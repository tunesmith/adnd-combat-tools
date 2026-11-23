import { z } from 'zod';
import type { TrackerRound, TrackerState } from '../types/tracker';
import type { CampaignDocument } from './campaignDocument';
import { canonical, trackerCombatantSchema } from './campaignSnapshots';
import { addCombatant, getNextCombatantKey } from './trackerState';

const preparedEnemySchema = z
  .object({
    id: z.string().min(1),
    combatant: trackerCombatantSchema
      .omit({ key: true, preparedEnemyId: true })
      .extend({ name: z.string().trim().min(1) })
      .strict(),
    notes: z.string(),
  })
  .strict();

export type PreparedEnemy = z.infer<typeof preparedEnemySchema>;
export const preparedEnemiesSchema = z
  .array(preparedEnemySchema)
  .refine(
    (entries) =>
      new Set(entries.map((entry) => entry.id)).size === entries.length,
    'Duplicate prepared enemy identity in this session.'
  );

export function preparedEnemiesInSession(
  document: CampaignDocument,
  sessionId: string
): PreparedEnemy[] {
  return (
    document.sessions.find((session) => session.id === sessionId)
      ?.preparedEnemies ?? []
  );
}

export function changePreparedEnemy(
  document: CampaignDocument,
  sessionId: string,
  original: PreparedEnemy | undefined,
  replacement: PreparedEnemy | undefined
): CampaignDocument {
  const session = document.sessions.find((item) => item.id === sessionId);
  if (!session) throw new Error('The session is unavailable.');
  const entries = session.preparedEnemies ?? [];
  const id = original?.id ?? replacement?.id;
  const current = entries.find((entry) => entry.id === id);
  if (canonical(current) === canonical(replacement)) return document;
  if (canonical(current) !== canonical(original))
    throw new Error(
      'The prepared enemy changed. Reopen it to edit the latest version.'
    );
  const preparedEnemies = replacement
    ? current
      ? entries.map((entry) => (entry.id === id ? replacement : entry))
      : [...entries, replacement]
    : entries.filter((entry) => entry.id !== id);
  return {
    ...document,
    sessions: document.sessions.map((item) =>
      item.id === sessionId ? { ...item, preparedEnemies } : item
    ),
  };
}

export function placedPreparedEnemyIds(round: TrackerRound | undefined) {
  const ids = new Set<string>();
  for (const enemy of round?.enemies ?? []) {
    if (enemy.preparedEnemyId) ids.add(enemy.preparedEnemyId);
  }
  return ids;
}

export function addPreparedEnemies(
  state: TrackerState,
  roster: PreparedEnemy[],
  selectedIds: readonly string[]
): TrackerState {
  if (!selectedIds.length) return state;
  const selected = new Set(selectedIds);
  const entries = roster.filter((entry) => selected.has(entry.id));
  if (entries.length !== selected.size)
    throw new Error(
      'A selected prepared enemy is unavailable. Review the roster.'
    );
  const round = state.rounds[state.activeRound];
  if (!round) throw new Error('The active round is unavailable.');
  const placed = placedPreparedEnemyIds(round);
  const additions = entries.filter((entry) => !placed.has(entry.id));
  if (round.enemies.length + additions.length > 100)
    throw new Error('A round can contain up to 100 enemies.');
  let key = getNextCombatantKey(state);
  for (const entry of additions) {
    state = addCombatant(
      state,
      'enemy',
      key,
      { ...entry.combatant, key, preparedEnemyId: entry.id },
      entry.notes
    );
    key++;
  }
  return state;
}

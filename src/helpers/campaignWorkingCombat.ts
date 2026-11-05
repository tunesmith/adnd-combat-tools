import { ownsVersion } from './campaignHistory';
import { z } from 'zod';
import { canonical, interpretSource } from './campaignSnapshots';
import { createInitialTrackerState } from './trackerState';
import type { TrackerState } from '../types/tracker';
import type { CampaignDocument } from './campaignDocument';
export interface WorkingCombat {
  id: string;
  sessionId: string;
  title: string;
  generation: number;
  state: TrackerState;
  origin:
    | { kind: 'empty' }
    | { kind: 'import'; recordId: string; revisionId: string }
    | { kind: 'checkpoint'; checkpointId: string };
}
export interface CombatCheckpoint {
  id: string;
  combatId: string;
  sessionId: string;
  label: string;
  capturedAt: string;
  origin?: WorkingCombat['origin'];
  state: TrackerState;
}
const id = z.string().min(1);
const tracker = z.unknown().superRefine((value, ctx) => {
  try {
    if (canonical(value) !== canonical(normalizeWorkingCombat(value)))
      ctx.addIssue({
        code: 'custom',
        message: 'Unsupported or unnormalized combat fields.',
      });
  } catch (error) {
    ctx.addIssue({ code: 'custom', message: String(error) });
  }
});
export const workingCombatSchema = z
  .object({
    id,
    sessionId: id,
    title: z.string().min(1).max(1000),
    generation: z.number().int().nonnegative(),
    state: tracker,
    origin: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('empty') }).strict(),
      z
        .object({ kind: z.literal('import'), recordId: id, revisionId: id })
        .strict(),
      z.object({ kind: z.literal('checkpoint'), checkpointId: id }).strict(),
    ]),
  })
  .strict();
export const combatCheckpointSchema = z
  .object({
    id,
    combatId: id,
    sessionId: id,
    label: z.string().min(1).max(1000),
    capturedAt: z.string().datetime(),
    origin: workingCombatSchema.shape.origin.optional(),
    state: tracker,
  })
  .strict();
function normalizeWorkingCombat(value: unknown): TrackerState {
  return interpretSource('tracker-json', JSON.stringify(value))
    .payload as unknown as TrackerState;
}
export function emptyWorkingCombat(): TrackerState {
  const state = createInitialTrackerState();
  const round = state.rounds[0];
  if (!round) throw new Error('Missing initial round');
  round.party = [];
  round.enemies = [];
  round.partyStates = [];
  round.enemyStates = [];
  round.cells = [];
  return normalizeWorkingCombat(state);
}
export function createWorkingCombat(
  doc: CampaignDocument,
  sessionId: string,
  title: string,
  state: TrackerState,
  origin: WorkingCombat['origin'],
  id: string
): CampaignDocument {
  if (!doc.sessions.some((s) => s.id === sessionId))
    throw new Error('Select a session.');
  const name = title.trim() || 'Untitled encounter';
  const combat: WorkingCombat = {
    id,
    sessionId,
    title: name,
    generation: 0,
    state: normalizeWorkingCombat({ ...state, title: name }),
    origin,
  };
  return {
    ...doc,
    workingCombats: [...doc.workingCombats, combat],
    workspace: {
      ...doc.workspace,
      sessionId,
      view: 'combats',
      combatSelections: { ...doc.workspace.combatSelections, [sessionId]: id },
    },
  };
}
export function changeWorkingCombat(
  doc: CampaignDocument,
  id: string,
  sessionId: string,
  generation: number,
  state: TrackerState
): CampaignDocument {
  if (
    !doc.workingCombats.some(
      (c) =>
        c.id === id && c.sessionId === sessionId && c.generation === generation
    )
  )
    throw new Error('Encounter changed; delayed edit cancelled.');
  const title = state.title?.trim() || 'Untitled encounter';
  const normalized = normalizeWorkingCombat({ ...state, title });
  return {
    ...doc,
    workingCombats: doc.workingCombats.map((c) =>
      c.id === id ? { ...c, title, state: normalized } : c
    ),
  };
}
export function captureCombatCheckpoint(
  doc: CampaignDocument,
  id: string,
  label: string,
  checkpointId: string,
  at: string
): CampaignDocument {
  const combat = doc.workingCombats.find((c) => c.id === id);
  if (!combat) throw new Error('Encounter not found.');
  if (!label.trim()) throw new Error('Name the checkpoint.');
  return {
    ...doc,
    combatCheckpoints: [
      ...doc.combatCheckpoints,
      {
        id: checkpointId,
        combatId: id,
        sessionId: combat.sessionId,
        label: label.trim(),
        capturedAt: at,
        origin: combat.origin,
        state: JSON.parse(JSON.stringify(combat.state)),
      },
    ],
  };
}
export function restoreWorkingCombat(
  doc: CampaignDocument,
  id: string,
  state: TrackerState,
  origin: WorkingCombat['origin'],
  checkpointId: string,
  at: string
): CampaignDocument {
  const combat = doc.workingCombats.find((c) => c.id === id);
  if (!combat) throw new Error('Encounter not found.');
  if (!ownsVersion(doc, 'combat', combat, origin))
    throw new Error('Version does not belong to this encounter.');
  const preserved = captureCombatCheckpoint(
    doc,
    id,
    'Before restoring encounter',
    checkpointId,
    at
  );
  const title = state.title?.trim() || combat.title;
  return {
    ...preserved,
    workingCombats: preserved.workingCombats.map((c) =>
      c.id === id
        ? {
            ...c,
            title,
            state: normalizeWorkingCombat({ ...state, title }),
            generation: c.generation + 1,
            origin,
          }
        : c
    ),
  };
}

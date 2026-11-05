import type { CampaignDocument } from './campaignDocument';
import { projectCombatRound } from './campaignParty';
import {
  captureCombatCheckpoint,
  changeWorkingCombat,
} from './campaignWorkingCombat';

export function applyPartyLevelsToLatestRound(
  doc: CampaignDocument,
  id: string,
  generation: number,
  checkpointId: string,
  at: string
): CampaignDocument {
  const combat = doc.workingCombats.find((c) => c.id === id && !c.removedAt);
  if (!combat || combat.generation !== generation)
    throw new Error('Encounter changed. Review linked levels again.');
  const latest = combat.state.rounds.length - 1;
  if (combat.state.activeRound !== latest)
    throw new Error('Select the latest round to apply linked levels.');
  const state = projectCombatRound(doc, combat, combat.state, latest);
  if (state === combat.state) return doc;
  const preserved = captureCombatCheckpoint(
    doc,
    id,
    'Before applying linked levels',
    checkpointId,
    at
  );
  return changeWorkingCombat(
    preserved,
    id,
    combat.sessionId,
    generation,
    state
  );
}

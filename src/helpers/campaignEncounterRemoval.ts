import type { CampaignDocument } from './campaignDocument';
import type { WorkingCombat } from './campaignWorkingCombat';
import { canonical } from './campaignSnapshots';

function removalState(
  combat: WorkingCombat,
  removedAt?: string
): WorkingCombat {
  const next = { ...combat, generation: combat.generation + 1 };
  if (removedAt) next.removedAt = removedAt;
  else delete next.removedAt;
  return next;
}

export function setEncounterRemoval(
  doc: CampaignDocument,
  id: string,
  sessionId: string,
  generation: number,
  removedAt?: string
): CampaignDocument {
  const combat = doc.workingCombats.find(
    (c) => c.id === id && c.sessionId === sessionId
  );
  if (!combat || combat.generation !== generation)
    throw new Error('Encounter changed. Review it again.');
  if (!!combat.removedAt === !!removedAt) return doc;
  const workingCombats = doc.workingCombats.map((c) =>
    c.id === id ? removalState(c, removedAt) : c
  );
  const combatSelections = { ...doc.workspace.combatSelections };
  if (removedAt && combatSelections[sessionId] === id) {
    const fallback = workingCombats.find(
      (c) => c.sessionId === sessionId && !c.removedAt
    );
    if (fallback) combatSelections[sessionId] = fallback.id;
    else delete combatSelections[sessionId];
  } else if (!removedAt) combatSelections[sessionId] = id;
  return {
    ...doc,
    workingCombats,
    workspace: { ...doc.workspace, combatSelections },
  };
}

export function validateEncounterRemoval(
  combat: WorkingCombat,
  changed: WorkingCombat
): boolean {
  const transitioned = !!combat.removedAt !== !!changed.removedAt;
  if (!transitioned && !combat.removedAt && !changed.removedAt) return false;
  const expected = transitioned
    ? removalState(combat, changed.removedAt)
    : combat;
  if (canonical(expected) !== canonical(changed))
    throw new Error('A removed encounter must retain its captured state.');
  return true;
}

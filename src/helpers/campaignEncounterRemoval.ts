import type { CampaignDocument } from './campaignDocument';
import type { WorkingCombat } from './campaignWorkingCombat';
import { canonical } from './campaignSnapshots';
import { sameCombatSlot } from './campaignParty';

function retainLinkGenerations(doc: CampaignDocument, combat: WorkingCombat) {
  return (
    doc.party?.combatLinks
      .filter((l) => l.combatId === combat.id)
      .map((l) =>
        l.generation === combat.generation
          ? { ...l, generation: l.generation + 1 }
          : l
      ) || []
  );
}

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
    ...(doc.party
      ? {
          party: {
            ...doc.party,
            combatLinks: [
              ...doc.party.combatLinks.filter((l) => l.combatId !== id),
              ...retainLinkGenerations(doc, combat),
            ],
          },
        }
      : {}),
  };
}

export function validateEncounterRemoval(
  old: CampaignDocument,
  next: CampaignDocument,
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
  const links = transitioned
    ? retainLinkGenerations(old, combat)
    : old.party?.combatLinks.filter((l) => l.combatId === combat.id) || [];
  const nextLinks =
    next.party?.combatLinks.filter((l) => l.combatId === combat.id) || [];
  if (
    links.length !== nextLinks.length ||
    links.some(
      (l) =>
        !nextLinks.some(
          (n) => sameCombatSlot(l, n) && canonical(l) === canonical(n)
        )
    )
  )
    throw new Error('A removed encounter must retain its character links.');
  return true;
}

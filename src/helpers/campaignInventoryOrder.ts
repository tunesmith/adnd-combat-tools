import type { CampaignDocument } from './campaignDocument';
import { inventoryMembership } from './campaignInventoryMembership';
import { inPartyOrder, reorderPartyCharacter } from './campaignParty';
import { changeWorkingInventory } from './campaignWorkingInventory';

export function inSessionInventoryOrder<T>(
  doc: CampaignDocument,
  sessionId: string,
  holders: readonly T[],
  holderId: (holder: T) => string
): T[] {
  const { matched } = inventoryMembership(doc, sessionId);
  const ordered = inPartyOrder(doc, matched, (m) => m.characterId, sessionId);
  const ranks = new Map(ordered.map((m, i) => [m.holderId, i]));
  const storage = new Set(
    [...doc.workingInventories, ...doc.inventoryCheckpoints].flatMap((w) =>
      w.document.version === 10
        ? w.document.storageLocations.map((h) => h.id)
        : []
    )
  );
  const rank = (item: T) =>
    ranks.get(holderId(item)) ??
    ranks.size + (storage.has(holderId(item)) ? 1 : 0);
  return [...holders].sort((a, b) => rank(a) - rank(b));
}

export function reorderInventoryCharacter(
  doc: CampaignDocument,
  sessionId: string,
  fromId: string,
  targetId: string
): CampaignDocument {
  const { matched } = inventoryMembership(doc, sessionId);
  const from = matched.find((m) => m.holderId === fromId);
  const target = matched.find((m) => m.holderId === targetId);
  if (from && target)
    return reorderPartyCharacter(
      doc,
      sessionId,
      from.characterId,
      target.characterId
    );
  // Never infer an identity or move an unmatched holder into the matched group.
  if (from || target || fromId === targetId) return doc;
  const working = doc.workingInventories.find((w) => w.sessionId === sessionId);
  if (!working) return doc;
  const characters = [...working.document.characters];
  const index = characters.findIndex((c) => c.id === targetId);
  const source = characters.find((c) => c.id === fromId);
  if (!source || index < 0) return doc;
  characters.splice(characters.indexOf(source), 1);
  characters.splice(index, 0, source);
  return changeWorkingInventory(doc, working.id, sessionId, {
    ...working.document,
    characters,
  });
}

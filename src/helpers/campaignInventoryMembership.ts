import type { CampaignDocument } from './campaignDocument';
import type { EncumbranceDmDocumentV10 } from '../types/encumbrance';
import {
  parseEncumbranceDocument,
  validateInventoryHolders,
} from './encumbranceDocument';
import {
  selectInventoryCharacters,
  inventoryHolders,
} from './encumbranceStorage';
import {
  captureInventoryCheckpoint,
  changeWorkingInventory,
} from './campaignWorkingInventory';
import { canonical, fingerprint } from './campaignSnapshots';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const nameKey = (value: string) =>
  value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
export function currentInventoryDocument(
  value: unknown
): EncumbranceDmDocumentV10 {
  const doc = parseEncumbranceDocument(JSON.stringify(value));
  if (doc.kind !== 'adnd-encumbrance-dm' || doc.version !== 10)
    throw Error('Campaign DM inventory required.');
  return doc;
}
export function inventoryMembership(doc: CampaignDocument, sessionId: string) {
  const source = doc.workingInventories.find((w) => w.sessionId === sessionId);
  if (!source) return { matched: [], unmatched: [] };
  const characters = source.document.characters,
    roster = doc.party?.roster ?? [];
  const matched = characters.flatMap((holder) => {
    const key = nameKey(holder.name);
    if (!key || characters.filter((c) => nameKey(c.name) === key).length !== 1)
      return [];
    const people = roster.filter((c) => nameKey(c.name) === key);
    return people.length === 1 && people[0]
      ? [{ holderId: holder.id, characterId: people[0].id, name: holder.name }]
      : [];
  });
  return {
    matched,
    unmatched: characters.filter(
      (c) => !matched.some((m) => m.holderId === c.id)
    ),
  };
}
export function inventoryIdsForParty(
  doc: CampaignDocument,
  sessionId: string,
  partyIds: readonly string[],
  unmatchedIds?: readonly string[]
) {
  const { matched, unmatched } = inventoryMembership(doc, sessionId);
  const extras = unmatchedIds ?? unmatched.map((c) => c.id);
  if (
    new Set(extras).size !== extras.length ||
    extras.some((id) => !unmatched.some((c) => c.id === id))
  )
    throw Error('Additional inventory choices changed.');
  const ids = [
    ...matched
      .filter((m) => partyIds.includes(m.characterId))
      .map((m) => m.holderId),
    ...extras,
  ];
  return (
    doc.workingInventories
      .find((w) => w.sessionId === sessionId)
      ?.document.characters.filter((c) => ids.includes(c.id))
      .map((c) => c.id) ?? []
  );
}
export function filteredInventory(
  doc: CampaignDocument,
  sessionId: string,
  partyIds: readonly string[],
  ids: readonly string[]
) {
  const working = doc.workingInventories.find((w) => w.sessionId === sessionId);
  if (!working) throw Error('Source inventory missing.');
  const { unmatched } = inventoryMembership(doc, sessionId);
  const expected = inventoryIdsForParty(
    doc,
    sessionId,
    partyIds,
    ids.filter((id) => unmatched.some((c) => c.id === id))
  );
  if (canonical([...expected].sort()) !== canonical([...ids].sort()))
    throw Error('Inventory holders must follow the selected party profiles.');
  return selectInventoryCharacters(
    currentInventoryDocument(working.document),
    ids
  );
}
export function earlierInventoryCharacters(
  doc: CampaignDocument,
  sessionId: string
) {
  const position = doc.sessions.findIndex((s) => s.id === sessionId);
  return doc.sessions.slice(0, Math.max(0, position)).flatMap((session) =>
    doc.workingInventories
      .filter((w) => w.sessionId === session.id)
      .flatMap((w) =>
        w.document.characters.map((character) => ({
          key: canonical([w.id, character.id]),
          sessionId: session.id,
          sessionLabel: session.label,
          workingId: w.id,
          character,
          fingerprint: fingerprint({
            workingId: w.id,
            sessionId: session.id,
            character,
          }),
        }))
      )
  );
}
export function returningInventoryId(
  doc: CampaignDocument,
  sessionId: string,
  name: string
) {
  const key = nameKey(name);
  if (
    !key ||
    (doc.party?.roster.filter((c) => nameKey(c.name) === key).length ?? 0) > 1
  )
    return undefined;
  const ids = Array.from(
    new Set(
      earlierInventoryCharacters(doc, sessionId)
        .filter((c) => nameKey(c.character.name) === nameKey(name))
        .map((c) => c.character.id)
    )
  );
  return ids.length === 1 ? ids[0] : undefined;
}
interface AddInventoryCharacterRequest {
  workingId: string;
  sessionId: string;
  characterId: string;
  name: string;
  strength: number;
  source?: {
    workingId: string;
    characterId: string;
    fingerprint: string;
    checkpointId: string;
    at: string;
  };
}
export function addCampaignInventoryCharacter(
  doc: CampaignDocument,
  request: AddInventoryCharacterRequest
): CampaignDocument {
  const working = doc.workingInventories.find(
    (w) => w.id === request.workingId && w.sessionId === request.sessionId
  );
  if (!working) throw Error('Working inventory changed.');
  const source = request.source;
  if (source) {
    const recorded = doc.inventoryCheckpoints.find(
      (c) => c.id === source.checkpointId
    );
    if (recorded) {
      if (
        recorded.workingId === source.workingId &&
        recorded.characterCopy?.characterId === source.characterId &&
        recorded.characterCopy.targetWorkingId === working.id &&
        source.fingerprint ===
          fingerprint({
            workingId: recorded.workingId,
            sessionId: recorded.sessionId,
            character: recorded.document.characters.find(
              (c) => c.id === source.characterId
            ),
          })
      )
        return doc;
      throw Error('This inventory copy operation was already used.');
    }
  }
  const inventory = currentInventoryDocument(working.document);
  if (inventoryHolders(inventory).some((c) => c.id === request.characterId))
    throw Error('This inventory holder already exists.');
  let next = doc;
  const character = {
    id: request.characterId,
    name: request.name.trim(),
    strength: { score: request.strength, exceptional: 'none' as const },
    inventory: [],
    dmNotes: '',
  };
  let copied: typeof inventory.characters[number] = character;
  if (source) {
    const choice = earlierInventoryCharacters(doc, request.sessionId).find(
      (c) =>
        c.workingId === source.workingId &&
        c.character.id === source.characterId
    );
    if (
      !choice ||
      choice.fingerprint !== source.fingerprint ||
      request.characterId !== source.characterId
    )
      throw Error('Earlier inventory changed. Review the copy again.');
    const present = new Set(
      inventoryHolders(inventory).flatMap((c) => c.inventory.map((i) => i.id))
    );
    if (choice.character.inventory.some((i) => present.has(i.id)))
      throw Error(
        'Some earlier items are already held in this inventory. Start empty or choose another source.'
      );
    copied = clone(choice.character);
    next = captureInventoryCheckpoint(
      doc,
      choice.workingId,
      `Copied ${choice.character.name} to ${
        doc.sessions.find((s) => s.id === request.sessionId)?.label
      }`,
      source.checkpointId,
      source.at
    );
    next = {
      ...next,
      inventoryCheckpoints: next.inventoryCheckpoints.map((c) =>
        c.id === source.checkpointId
          ? {
              ...c,
              characterCopy: {
                characterId: copied.id,
                targetWorkingId: working.id,
                targetSessionId: working.sessionId,
              },
            }
          : c
      ),
    };
  }
  if (!source && !copied.name.trim())
    throw Error('Enter an inventory character name.');
  const updated = {
    ...inventory,
    activeCharacterId: copied.id,
    characters: [...inventory.characters, copied],
  };
  validateInventoryHolders(inventoryHolders(updated));
  next = changeWorkingInventory(next, working.id, request.sessionId, updated);

  return next;
}

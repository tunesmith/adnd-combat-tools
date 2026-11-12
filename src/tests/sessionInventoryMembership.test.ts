import {
  membershipCampaign,
  memberIds,
  holderIds,
  membershipAt,
} from './fixtures/inventoryMembershipCampaign';
import {
  removeInventoryCharacter,
  selectInventoryCharacters,
} from '../helpers/encumbranceStorage';
import {
  parseEncumbranceDocument,
  stringifyEncumbranceDocument,
  redactEncumbranceDocument,
} from '../helpers/encumbranceDocument';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import { changeWorkingInventory } from '../helpers/campaignWorkingInventory';
import {
  currentInventoryDocument,
  inventoryIdsForParty,
  earlierInventoryCharacters,
  addCampaignInventoryCharacter,
  returningInventoryId,
} from '../helpers/campaignInventoryMembership';
import {
  startNextSession,
  sessionFingerprint,
} from '../helpers/campaignContinuity';
import {
  bankBalance,
  bankBalanceHolders,
  bankBoundaryDifference,
  bankHolderName,
} from '../helpers/campaignBanking';
import { copyPartyProfile, updatePartyProfile } from '../helpers/campaignParty';
const required = <T>(v: T | undefined): T => {
  if (v === undefined) throw Error('Fixture');
  return v;
};
const work = (d: ReturnType<typeof membershipCampaign>, session = 'day3') =>
  required(d.workingInventories.find((w) => w.sessionId === session));
const remove = (d: ReturnType<typeof membershipCampaign>, id: string) => {
  const w = work(d);
  return changeWorkingInventory(
    d,
    w.id,
    w.sessionId,
    removeInventoryCharacter(currentInventoryDocument(w.document), id),
    { id: 'before-' + id, at: membershipAt }
  );
};
const party = [memberIds.mira, memberIds.nera, memberIds.bram];
const continuation = (d: ReturnType<typeof membershipCampaign>) => ({
  campaignId: d.id,
  sourceSessionId: 'day2',
  sourceFingerprint: sessionFingerprint(d, 'day2'),
  destinationId: 'day4',
  label: 'Later session',
  combats: [],
  inventory: {
    sourceId: work(d, 'day2').id,
    instanceId: 'day4-inventory',
    checkpointId: 'day2-source-full',
    characterIds: inventoryIdsForParty(d, 'day2', party),
  },
  partyCharacterIds: party,
  copyNotes: false,
  capturedAt: membershipAt,
});

test('shared removal deletes all nested contents, selects a safe remaining holder and round trips an empty document', () => {
  const source = currentInventoryDocument(work(membershipCampaign()).document);
  const next = removeInventoryCharacter(source, holderIds.retired);
  expect(next.characters.some((c) => c.id === holderIds.retired)).toBe(false);
  expect(
    source.characters.find((c) => c.id === holderIds.retired)?.inventory
  ).toHaveLength(3);
  expect(parseEncumbranceDocument(stringifyEncumbranceDocument(next))).toEqual(
    next
  );
  let empty = selectInventoryCharacters(source, []);
  empty = { ...empty, storageLocations: [], activeCharacterId: '' };
  expect(parseEncumbranceDocument(stringifyEncumbranceDocument(empty))).toEqual(
    empty
  );
  expect(() => redactEncumbranceDocument(empty)).toThrow('Select');
  const only = {
    ...source,
    characters: [
      required(source.characters.find((c) => c.id === holderIds.retired)),
    ],
    storageLocations: [],
    activeCharacterId: holderIds.retired,
  };
  expect(removeInventoryCharacter(only, holderIds.retired)).toMatchObject({
    characters: [],
    activeCharacterId: '',
  });
});

test('removing retired and absent holders preserves past inventory, profile identities, money history and original checkpoints', () => {
  const before = membershipCampaign();
  let after = remove(before, holderIds.retired);
  validateHistoryTransition(before, after, '');
  after = remove(after, holderIds.absent);
  expect(after.banking).toBe(before.banking);
  expect(after.party).toBe(before.party);
  expect(after.workingInventories.find((w) => w.sessionId === 'day2')).toEqual(
    work(before, 'day2')
  );
  expect(
    after.inventoryCheckpoints.slice(0, before.inventoryCheckpoints.length)
  ).toEqual(before.inventoryCheckpoints);
  expect(after.records).toEqual(before.records);
  expect(bankBalanceHolders(after, 'day3').map((h) => h.id)).not.toContain(
    holderIds.retired
  );
  expect(bankBalanceHolders(after, 'day3').map((h) => h.id)).not.toContain(
    holderIds.absent
  );
  expect(bankHolderName(after, holderIds.retired)).toBe('Oren');
  expect(bankBalance(after, holderIds.absent, 'day3').ep).toBe(0);
  expect(parseCampaign(serializeCampaign(after))).toEqual(after);
  const funded = membershipCampaign(false),
    removed = remove(funded, holderIds.absent);
  expect(removed.banking).toBe(funded.banking);
  expect(
    bankBalanceHolders(removed, 'day3').find((h) => h.id === holderIds.absent)
      ?.name
  ).toBe('Tal');
  expect(
    bankBoundaryDifference(removed, 'day3').find(
      (d) => d.holderId === holderIds.absent
    )?.difference.ep
  ).toBe(-50);
  const unsafe = {
    ...before,
    workingInventories: before.workingInventories.map((w) =>
      w.sessionId === 'day3'
        ? {
            ...w,
            document: removeInventoryCharacter(
              currentInventoryDocument(w.document),
              holderIds.retired
            ),
          }
        : w
    ),
  };
  expect(() => validateHistoryTransition(before, unsafe, '')).toThrow(
    'checkpoint'
  );
});

test('selected party controls character carry-forward while all storage and the full source checkpoint remain intact', () => {
  const before = membershipCampaign(),
    request = continuation(before);
  expect(request.inventory.characterIds).toEqual([
    holderIds.mira,
    holderIds.nera,
    holderIds.bram,
  ]);
  const next = startNextSession(before, request);
  validateHistoryTransition(before, next, '');
  expect(work(next, 'day4').document.characters.map((c) => c.id)).toEqual(
    request.inventory.characterIds
  );
  expect(work(next, 'day4').document).toMatchObject({
    storageLocations: currentInventoryDocument(work(before, 'day2').document)
      .storageLocations,
  });
  expect(
    next.inventoryCheckpoints.find((c) => c.id === 'day2-source-full')?.document
  ).toEqual(work(before, 'day2').document);
  expect(next.banking).toBe(before.banking);
  expect(startNextSession(next, request)).toBe(next);
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
  expect(() =>
    startNextSession(next, {
      ...request,
      inventory: { ...request.inventory, characterIds: [] },
    })
  ).toThrow('exists');
  const storageOnly = startNextSession(before, {
    ...request,
    destinationId: 'storage-only',
    partyCharacterIds: [],
    inventory: {
      ...request.inventory,
      instanceId: 'storage-only-inventory',
      checkpointId: 'storage-only-checkpoint',
      characterIds: [],
    },
  });
  expect(work(storageOnly, 'storage-only').document.characters).toEqual([]);
  expect(
    currentInventoryDocument(work(storageOnly, 'storage-only').document)
      .storageLocations
  ).toHaveLength(1);
});

test('unmatched and ambiguous inventory holders require separate explicit choices instead of matching unchecked people', () => {
  let doc = membershipCampaign();
  doc = {
    ...doc,
    workingInventories: doc.workingInventories.map((w) =>
      w.sessionId === 'day2'
        ? {
            ...w,
            document: {
              ...w.document,
              characters: [
                ...w.document.characters,
                {
                  id: 'extra-holder',
                  name: 'Extra holder',
                  strength: { score: 8, exceptional: 'none' as const },
                  inventory: [],
                  dmNotes: '',
                },
              ],
            },
          }
        : w
    ),
  };
  expect(inventoryIdsForParty(doc, 'day2', party)).toContain('extra-holder');
  expect(inventoryIdsForParty(doc, 'day2', party, [])).not.toContain(
    'extra-holder'
  );
  const copied = startNextSession(doc, continuation(doc));
  expect(work(copied, 'day4').document.characters.map((c) => c.id)).toContain(
    'extra-holder'
  );
  const dup = {
    ...doc,
    party: doc.party
      ? {
          ...doc.party,
          roster: [
            ...doc.party.roster,
            { id: 'duplicate-mira', name: 'Mira', player: '', notes: '' },
          ],
        }
      : undefined,
  };
  expect(inventoryIdsForParty(dup, 'day2', [], [])).not.toContain(
    holderIds.mira
  );
  expect(returningInventoryId(dup, 'day3', 'Mira')).toBeUndefined();
});

test('a returning profile restores separately from gear, earlier copies keep IDs and nested containers, and remain independently editable', () => {
  let doc = membershipCampaign();
  doc = remove(doc, holderIds.absent);
  doc = startNextSession(doc, continuation(doc));
  const prior = required(
    doc.party?.profiles.find(
      (p) => p.characterId === memberIds.absent && p.sessionId === 'day2'
    )
  );
  doc = updatePartyProfile(doc, copyPartyProfile(prior, 'day4'));
  expect(
    work(doc, 'day4').document.characters.some((c) => c.id === holderIds.absent)
  ).toBe(false);
  const source = required(
    earlierInventoryCharacters(doc, 'day4').find(
      (c) => c.sessionId === 'day2' && c.character.id === holderIds.absent
    )
  );
  const before = doc;
  const request = {
    workingId: 'day4-inventory',
    sessionId: 'day4',
    characterId: source.character.id,
    name: 'Tal',
    strength: 8,
    source: {
      workingId: source.workingId,
      characterId: source.character.id,
      fingerprint: source.fingerprint,
      checkpointId: 'return-source',
      at: membershipAt,
    },
  };
  doc = addCampaignInventoryCharacter(doc, request);
  validateHistoryTransition(before, doc, '');
  expect(
    work(doc, 'day4').document.characters.find((c) => c.id === holderIds.absent)
  ).toEqual(source.character);
  expect(doc.banking).toBe(before.banking);
  expect(addCampaignInventoryCharacter(doc, request)).toBe(doc);
  expect(returningInventoryId(before, 'day4', 'Tal')).toBe(holderIds.absent);
  expect(parseCampaign(serializeCampaign(doc))).toEqual(doc);
  const updated = currentInventoryDocument(work(doc, 'day4').document);
  const character = required(
    updated.characters.find((c) => c.id === holderIds.absent)
  );
  character.inventory = character.inventory.map((i) =>
    i.id === 'tal-stones' ? { ...i, quantity: 1 } : i
  );
  const edited = changeWorkingInventory(doc, 'day4-inventory', 'day4', updated);
  expect(work(edited, 'day2')).toEqual(work(before, 'day2'));
  const changedSource = {
    ...before,
    workingInventories: before.workingInventories.map((w) =>
      w.id === source.workingId
        ? {
            ...w,
            document: {
              ...w.document,
              characters: w.document.characters.map((c) =>
                c.id === holderIds.absent ? { ...c, name: 'Changed' } : c
              ),
            },
          }
        : w
    ),
  };
  expect(() => addCampaignInventoryCharacter(changedSource, request)).toThrow(
    'changed'
  );
  const empty = addCampaignInventoryCharacter(before, {
    workingId: 'day4-inventory',
    sessionId: 'day4',
    characterId: holderIds.absent,
    name: 'Tal',
    strength: 10,
  });
  expect(empty.banking).toBe(before.banking);
  expect(
    work(empty, 'day4').document.characters.find(
      (c) => c.id === holderIds.absent
    )?.inventory
  ).toEqual([]);
  const overlapping = {
    ...before,
    workingInventories: before.workingInventories.map((w) =>
      w.id === 'day4-inventory'
        ? {
            ...w,
            document: {
              ...w.document,
              characters: w.document.characters.map((c) =>
                c.id === holderIds.mira
                  ? {
                      ...c,
                      inventory: [
                        ...c.inventory,
                        ...source.character.inventory,
                      ],
                    }
                  : c
              ),
            },
          }
        : w
    ),
  };
  expect(() => addCampaignInventoryCharacter(overlapping, request)).toThrow(
    'already held'
  );
  expect(() =>
    addCampaignInventoryCharacter(doc, {
      ...request,
      source: { ...request.source, fingerprint: 'changed-request' },
    })
  ).toThrow('already used');
});

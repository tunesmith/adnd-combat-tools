import { xpCampaign, xpAt, xpTestIds } from './fixtures/xpCampaign';
import { storageInventory } from './fixtures/storageInventory';
import {
  emptyProfile,
  profilesInSession,
  reorderPartyCharacter,
  updatePartyProfile,
} from '../helpers/campaignParty';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  sessionFingerprint,
  startNextSession,
} from '../helpers/campaignContinuity';
import {
  inSessionInventoryOrder,
  reorderInventoryCharacter,
} from '../helpers/campaignInventoryOrder';
import {
  bankBalanceHolders,
  bankBoundaryDifference,
  bankReconciliationFingerprint,
} from '../helpers/campaignBanking';
import { startWorkingInventory } from '../helpers/campaignWorkingInventory';
const ids = xpTestIds;
const names = ['Reatha', 'Dengue Dan', 'Kramrak', 'Chocolato', 'Imunoanne'];
function fixture() {
  let doc = xpCampaign(false);
  if (!doc.party) throw Error('fixture');
  doc.party.roster = doc.party.roster.map((c, i) => ({
    ...c,
    name: names[i] ?? c.name,
  }));
  doc.sessions.push({ id: 'Day3', label: 'Day3' });
  for (const id of ids) doc = updatePartyProfile(doc, emptyProfile('Day3', id));
  const inventory = storageInventory();
  const original = inventory.characters[0];
  if (!original) throw Error('fixture');
  inventory.characters = names.map((name, i) => ({
    ...original,
    id: 'holder-' + i,
    name,
    inventory: [],
  }));
  inventory.storageLocations = inventory.storageLocations
    .slice(0, 1)
    .map((h) => ({ ...h, name: 'Invisible Chest' }));
  inventory.activeCharacterId = 'holder-2';
  return startWorkingInventory(
    doc,
    'Day3',
    inventory,
    { kind: 'empty' },
    'day3-inventory',
    'unused',
    xpAt
  );
}
const order = (doc: ReturnType<typeof fixture>, session: string) =>
  profilesInSession(doc, session).map((p) => p.characterId);
test('legacy Day1/Day2 orders are frozen, Day3 round trips, and Day4 inherits once', () => {
  let doc = fixture();
  doc.sessions = doc.sessions.map(({ partyOrder, ...session }) => session);
  doc = parseCampaign(JSON.stringify(doc));
  const before = doc;
  const first = ids[0],
    last = ids[4];
  if (!first || !last) throw Error('fixture');
  doc = reorderPartyCharacter(doc, 'Day3', last, first);
  expect(order(doc, 'session-1')).toEqual(order(before, 'session-1'));
  expect(order(doc, 'session-2')).toEqual(order(before, 'session-2'));
  expect(doc.party).toEqual(before.party);
  expect(doc.records).toEqual(before.records);
  expect(doc.workingInventories).toEqual(before.workingInventories);
  expect(doc.xp).toEqual(before.xp);
  expect(doc.banking).toEqual(before.banking);
  expect(bankBoundaryDifference(doc, 'Day3')).toEqual(
    bankBoundaryDifference(before, 'Day3')
  );
  expect(bankReconciliationFingerprint(doc, 'Day3')).toBe(
    bankReconciliationFingerprint(before, 'Day3')
  );
  validateHistoryTransition(before, doc, '');
  doc = parseCampaign(serializeCampaign(doc));
  const source = doc;
  doc = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'Day3',
    sourceFingerprint: sessionFingerprint(doc, 'Day3'),
    destinationId: 'Day4',
    label: 'Day4',
    combats: [],
    inventory: null,
    copyNotes: false,
    partyCharacterIds: ids,
    capturedAt: xpAt,
  });
  validateHistoryTransition(source, doc, '');
  expect(order(doc, 'Day4')).toEqual(order(source, 'Day3'));
  const created = doc;
  doc = reorderPartyCharacter(doc, 'Day3', first, last);
  expect(order(doc, 'Day4')).toEqual(order(created, 'Day4'));
  const day3Order = order(doc, 'Day3');
  doc = reorderPartyCharacter(doc, 'Day4', first, last);
  expect(order(doc, 'Day3')).toEqual(day3Order);
  doc = updatePartyProfile(doc, {
    ...emptyProfile('Day4', first),
    participating: false,
  });
  doc = updatePartyProfile(doc, emptyProfile('Day4', first));
  expect(order(doc, 'Day4').slice(-1)).toEqual([first]);
});
test('Possessions uses unique holder matches and Banking shares that order without changing inventory', () => {
  const before = fixture();
  const doc = reorderInventoryCharacter(before, 'Day3', 'holder-4', 'holder-0');
  const inventory = doc.workingInventories.find(
    (w) => w.sessionId === 'Day3'
  )?.document;
  if (!inventory) throw Error('fixture');
  expect(
    inSessionInventoryOrder(doc, 'Day3', inventory.characters, (c) => c.id).map(
      (c) => c.name
    )
  ).toEqual([names[4], ...names.slice(0, 4)]);
  expect(bankBalanceHolders(doc, 'Day3').map((h) => h.name)).toEqual([
    names[4],
    ...names.slice(0, 4),
    'Invisible Chest',
  ]);
  expect(doc.workingInventories).toEqual(before.workingInventories);
  expect(order(doc, 'session-1')).toEqual(order(before, 'session-1'));
});
test('ambiguous and unmatched holders keep their data and reorder only within the unmatched group', () => {
  const doc = fixture();
  const working = doc.workingInventories.find((w) => w.sessionId === 'Day3');
  if (!working) throw Error('fixture');
  const a = working.document.characters[0],
    b = working.document.characters[1];
  if (!a || !b) throw Error('fixture');
  a.name = b.name = 'Reatha';
  const next = reorderInventoryCharacter(doc, 'Day3', b.id, a.id);
  expect(next.party).toEqual(doc.party);
  expect(next.sessions).toEqual(doc.sessions);
  const chars =
    next.workingInventories.find((w) => w.id === working.id)?.document
      .characters ?? [];
  expect(
    inSessionInventoryOrder(next, 'Day3', chars, (c) => c.id).map((c) => c.id)
  ).toEqual(['holder-2', 'holder-3', 'holder-4', b.id, a.id]);
  expect([...chars].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
    [...working.document.characters].sort((a, b) => a.id.localeCompare(b.id))
  );
  expect(reorderInventoryCharacter(next, 'Day3', a.id, 'holder-2')).toBe(next);
});
test('native boundary rejects duplicate or dangling session order identities', () => {
  const doc = fixture();
  for (const partyOrder of [[ids[0], ids[0]], ['missing']]) {
    expect(() =>
      parseCampaign(
        JSON.stringify({
          ...doc,
          sessions: doc.sessions.map((s) =>
            s.id === 'Day3' ? { ...s, partyOrder } : s
          ),
        })
      )
    ).toThrow('order');
  }
});

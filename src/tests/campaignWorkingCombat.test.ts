import baseline from './fixtures/campaignSnapshots.json';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  createWorkingCombat,
  changeWorkingCombat,
  captureCombatCheckpoint,
  restoreWorkingCombat,
  emptyWorkingCombat,
  createEncounterFromParty,
  addPreparedEnemiesToWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import { changePreparedEnemy } from '../helpers/campaignPreparedEnemies';
import { startWorkingInventory } from '../helpers/campaignWorkingInventory';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
import {
  addCombatant,
  createBaseCombatant,
  getNextCombatantKey,
  insertRoundAfterActive,
  removeCombatant,
} from '../helpers/trackerState';
import type { TrackerActionDeclaration } from '../types/tracker';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture');
  return value;
}
const at = '2026-11-04T12:00:00.000Z';
function setup() {
  return createWorkingCombat(
    startWorkingInventory(
      parseCampaign(JSON.stringify(baseline)),
      'session-1',
      syntheticInventory(),
      { kind: 'empty' },
      'inventory-work',
      'unused',
      at
    ),
    'session-1',
    'Lantern Gate',
    syntheticCombat(),
    { kind: 'import', recordId: 'combat-1', revisionId: 'combat-r1' },
    'encounter-1'
  );
}
test('two distinct encounters, rounds, every tracker field and inventory survive a complete serialization', () => {
  let doc = setup();
  const first = doc.workingCombats[0];
  if (!first) throw Error('fixture');
  let state = insertRoundAfterActive(first.state);
  const round = state.rounds[state.activeRound];
  if (!round?.partyStates[0]) throw Error('fixture');
  round.partyStates[0] = {
    hp: '12',
    effect: 'Blessed',
    action: 'Hold lantern',
    result: 'Gate opens',
    notes: 'Synthetic note',
  };
  round.summary = 'Third round notes';
  required(round.cells[0]?.[0]).partyToEnemy = 'Hit for 3';
  doc = changeWorkingCombat(doc, first.id, first.sessionId, 0, state);
  doc = captureCombatCheckpoint(doc, first.id, 'At gate', 'combat-check', at);
  state = JSON.parse(JSON.stringify(state));
  required(state.rounds[state.activeRound]?.partyStates[0]).hp = '7';
  doc = changeWorkingCombat(doc, first.id, first.sessionId, 0, state);
  doc = createWorkingCombat(
    doc,
    'session-1',
    'Bridge',
    emptyWorkingCombat(),
    { kind: 'empty' },
    'encounter-2'
  );
  const reopened = parseCampaign(serializeCampaign(doc));
  expect(reopened).toEqual(doc);
  expect(reopened.workingCombats[0]?.state.rounds).toHaveLength(3);
  expect(
    reopened.combatCheckpoints[0]?.state.rounds[2]?.partyStates[0]?.hp
  ).toBe('12');
  expect(reopened.workingCombats[0]?.state.rounds[2]?.partyStates[0]?.hp).toBe(
    '7'
  );
  expect(reopened.records).toEqual(baseline.records);
  expect(reopened.workingInventories).toEqual(doc.workingInventories);
});
test('restoring history preserves identity and previous state but invalidates delayed callbacks', () => {
  let doc = setup();
  doc = captureCombatCheckpoint(
    doc,
    'encounter-1',
    'Arrival',
    'combat-check',
    at
  );
  const historical = required(doc.combatCheckpoints[0]);
  const updated = insertRoundAfterActive(required(doc.workingCombats[0]).state);
  doc = changeWorkingCombat(doc, 'encounter-1', 'session-1', 0, updated);
  const restored = restoreWorkingCombat(
    doc,
    'encounter-1',
    historical.state,
    { kind: 'checkpoint', checkpointId: historical.id },
    'before-restore',
    at
  );
  expect(restored.workingCombats[0]?.id).toBe('encounter-1');
  expect(restored.workingCombats[0]?.generation).toBe(1);
  expect(restored.combatCheckpoints[1]?.state).toEqual(updated);
  expect(restored.combatCheckpoints[0]).toEqual(historical);
  expect(() =>
    changeWorkingCombat(restored, 'encounter-1', 'session-1', 0, updated)
  ).toThrow('cancelled');
  expect(() =>
    changeWorkingCombat(
      restored,
      'encounter-1',
      'different-session',
      1,
      updated
    )
  ).toThrow('cancelled');
  expect(parseCampaign(serializeCampaign(restored))).toEqual(restored);
});
test('removing a combatant reindexes surviving declared actions without changing earlier rounds', () => {
  const state = syntheticCombat(),
    round = required(state.rounds[1]);
  const actor = required(round.party[1]),
    target = required(round.enemies[0]);
  const action: TrackerActionDeclaration = {
    id: 'declared',
    source: 'intention',
    side: 'party',
    direction: 'partyToEnemy',
    combatantKey: actor.key,
    combatantIndex: 1,
    targetSide: 'enemy',
    declaredAction: 'open-melee',
    weaponId: actor.weapon,
    intention: 'Defend bridge',
    result: 'Held',
    targetDeclarations: [
      {
        targetCombatantKey: target.key,
        targetCombatantIndex: 0,
        cellRowIndex: 0,
        cellColumnIndex: 1,
        cellResultText: 'Hit',
      },
    ],
  };
  round.actions = [action];
  required(round.cells[0]?.[1]).partyToEnemyActionIds = ['declared'];
  const next = removeCombatant(state, 'party', 0);
  expect(next.rounds[0]).toBe(state.rounds[0]);
  expect(next.rounds[1]?.actions?.[0]?.combatantIndex).toBe(0);
  expect(
    next.rounds[1]?.actions?.[0]?.targetDeclarations[0]?.cellColumnIndex
  ).toBe(0);
  const doc = createWorkingCombat(
    setup(),
    'session-1',
    'With declarations',
    next,
    { kind: 'empty' },
    'declared-encounter'
  );
  expect(parseCampaign(serializeCampaign(doc))).toEqual(doc);
  const removed = removeCombatant(next, 'party', 0);
  expect(removed.rounds[1]?.actions).toEqual([]);
});
test('invalid identities, associations and future versions are rejected', () => {
  const doc = setup();
  expect(() =>
    parseCampaign(JSON.stringify({ ...doc, schemaVersion: 22 }))
  ).toThrow();
  required(doc.workingCombats[0]).sessionId = 'missing';
  expect(() => parseCampaign(JSON.stringify(doc))).toThrow();
});

test('session selection and independent encounters survive serialization without implicit carry-forward', () => {
  const doc = setup();
  doc.sessions.push({ id: 'session-2', label: 'Later' });
  const other = createWorkingCombat(
    doc,
    'session-2',
    'Second-session watch',
    emptyWorkingCombat(),
    { kind: 'empty' },
    'later-encounter'
  );
  expect(other.workspace.sessionId).toBe('session-2');
  expect(other.workspace.combatSelections).toEqual({
    'session-1': 'encounter-1',
    'session-2': 'later-encounter',
  });
  expect(other.workingCombats[0]).toEqual(doc.workingCombats[0]);
  expect(other.workingCombats[1]?.state.rounds[0]?.party).toEqual([]);
  expect(parseCampaign(serializeCampaign(other))).toEqual(other);
});

test('prepared enemies get distinct tracker identities and follow roster order in the active round', () => {
  let doc = setup();
  for (const name of ['Cube 1', 'Cube 2', 'Cube 3']) {
    const { key: _key, ...combatant } = createBaseCombatant(0, 'enemy', name);
    doc = changePreparedEnemy(doc, 'session-1', undefined, {
      id: name,
      combatant: { ...combatant, name, maxHp: '20' },
      notes: `Notes for ${name}`,
    });
  }
  doc = createEncounterFromParty(
    doc,
    'session-1',
    'Ambush',
    required(doc.workingCombats[0]),
    'ambush',
    'before-party-copy',
    at,
    ['Cube 3', 'Cube 1']
  );
  const created = required(
    doc.workingCombats.find((combat) => combat.id === 'ambush')
  );
  const state = insertRoundAfterActive(created.state);
  const advanced = addCombatant(state, 'enemy', getNextCombatantKey(state));
  doc = changeWorkingCombat(doc, created.id, created.sessionId, 0, advanced);
  const reinforced = addPreparedEnemiesToWorkingCombat(doc, created, 1, [
    'Cube 1',
    'Cube 2',
  ]);
  const reopened = parseCampaign(serializeCampaign(reinforced));
  const rounds = required(
    reopened.workingCombats.find((combat) => combat.id === 'ambush')
  ).state.rounds;
  expect(rounds[0]).toEqual(created.state.rounds[0]);
  expect(rounds[0]?.enemies.map((enemy) => enemy.name)).toEqual([
    'Cube 1',
    'Cube 3',
  ]);
  const round = required(rounds[1]);
  expect(round.enemies.map((enemy) => enemy.preparedEnemyId)).toEqual([
    'Cube 1',
    'Cube 3',
    undefined,
    'Cube 2',
  ]);
  expect(
    new Set(round.enemies.concat(round.party).map((actor) => actor.key)).size
  ).toBe(round.enemies.length + round.party.length);
  expect(round.enemyStates[3]).toMatchObject({
    hp: '20',
    notes: 'Notes for Cube 2',
  });
  expect(round.cells[3]).toHaveLength(round.party.length);
  expect(
    addPreparedEnemiesToWorkingCombat(reopened, created, 1, ['Cube 2'])
  ).toBe(reopened);
});

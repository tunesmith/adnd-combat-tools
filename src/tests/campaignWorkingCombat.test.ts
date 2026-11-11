import baseline from './fixtures/campaignB1V2.json';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  createWorkingCombat,
  changeWorkingCombat,
  captureCombatCheckpoint,
  restoreWorkingCombat,
  emptyWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import {
  startWorkingInventory,
  captureInventoryCheckpoint,
} from '../helpers/campaignWorkingInventory';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
import {
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
test('V3 migration preserves inventory/checkpoint data and every B1 field', () => {
  const doc = captureInventoryCheckpoint(
    setup(),
    'inventory-work',
    'Camp',
    'inventory-check',
    at
  );
  const { workingCombats, combatCheckpoints, ...v3 } = doc;
  void workingCombats;
  void combatCheckpoints;
  const old = {
    ...v3,
    schemaVersion: 3,
    sessions: v3.sessions.map(({ id, label }) => ({ id, label })),
    workspace: { sessionId: 'session-1', view: 'possessions' },
  };
  const migrated = parseCampaign(JSON.stringify(old));
  expect(migrated).toEqual({
    ...old,
    sessions: old.sessions.map((s) => ({ ...s, notes: '' })),
    schemaVersion: 16,
    workingCombats: [],
    combatCheckpoints: [],
    workspace: { ...old.workspace, combatSelections: {} },
  });
});
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
    parseCampaign(JSON.stringify({ ...doc, schemaVersion: 17 }))
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

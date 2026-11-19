import {
  createInitialTrackerState,
  insertRoundAfterActive,
  removeCombatant,
  startNewCombatFromActiveRound,
} from '../helpers/trackerState';
import { getTrackerActionDeclarations } from '../helpers/trackerActionDeclarations';
import { resolveTrackerRoundInitiative } from '../helpers/initiative/trackerRoundResolution';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw Error('Missing melee fixture data');
  return value;
}

function engaged() {
  const state = createInitialTrackerState();
  const round = required(state.rounds[0]);
  for (const row of round.cells) {
    required(row[0]).partyToEnemyVisible = true;
    required(row[0]).enemyToParty = 'x';
  }
  return state;
}

test.each(['12-14=dead!', '0', '5-10=-5-2=-7', 'unconscious', '5?', '8-3', ''])(
  'Advance keeps both sides engaged while a target with HP %j remains on the roster',
  (hp) => {
    const state = engaged();
    required(required(state.rounds[0]).enemyStates[1]).hp = hp;
    const next = required(insertRoundAfterActive(state).rounds[1]);
    const opponent = required(next.enemies[1]);
    const actions = getTrackerActionDeclarations(next);
    expect(next.cells[1]?.[0]).toMatchObject({
      enemyToPartyVisible: true,
      partyToEnemyVisible: true,
    });
    expect(
      actions
        .find((a) => a.side === 'party')
        ?.targetDeclarations.map((t) => t.targetCombatantKey)
    ).toEqual(next.enemies.map((e) => e.key));
    expect(
      actions.find((a) => a.side === 'enemy' && a.combatantKey === opponent.key)
        ?.declaredAction
    ).toBe('open-melee');
    const graph = resolveTrackerRoundInitiative(next);
    const enemy = required(
      graph.scenario.enemies.find((e) => e.ownerCombatantKey === opponent.key)
    );
    expect(
      graph.attackGraph.nodes.some((n) => n.combatantId === enemy.id)
    ).toBe(true);
  }
);

test('removing an opponent at the start of the new round drops its engagements and preserves the previous round', () => {
  const advanced = insertRoundAfterActive(engaged());
  const original = required(advanced.rounds[0]);
  const state = removeCombatant(advanced, 'enemy', 1);
  const next = required(state.rounds[1]);
  expect(next.enemies.map((e) => e.key)).toEqual([
    required(original.enemies[0]).key,
    required(original.enemies[2]).key,
  ]);
  const actions = getTrackerActionDeclarations(next);
  expect(
    actions
      .find((a) => a.side === 'party')
      ?.targetDeclarations.map((t) => t.targetCombatantKey)
  ).toEqual(next.enemies.map((e) => e.key));
  expect(
    actions.filter((a) => a.side === 'enemy').map((a) => a.combatantKey)
  ).toEqual(next.enemies.map((e) => e.key));
  expect(state.rounds[0]).toBe(original);
});

test('only the melee membership survives a mixed declaration and roster reindexing', () => {
  const state = engaged();
  const r = required(state.rounds[0]);
  const base = required(
    getTrackerActionDeclarations(r).find((a) => a.side === 'party')
  );
  r.actions = [
    {
      ...base,
      initiativeTiming: 'wins-initiative',
      attackRoutineCount: 2,
      targetDeclarations: [],
    },
    {
      ...base,
      id: 'spell',
      declaredAction: 'spell-casting',
      castingSegments: 2,
      targetDeclarations: [],
    },
  ];
  required(r.cells[0]?.[0]).partyToEnemyActionIds = ['spell'];
  const survivingKey = required(r.enemies[2]).key;
  const next = required(
    insertRoundAfterActive(removeCombatant(state, 'enemy', 1)).rounds[1]
  );
  const attacks = getTrackerActionDeclarations(next).filter(
    (a) => a.side === 'party'
  );
  expect(attacks).toHaveLength(1);
  expect(attacks[0]?.targetDeclarations).toMatchObject([
    { targetCombatantKey: survivingKey, targetCombatantIndex: 1 },
  ]);
  expect(attacks[0]).not.toHaveProperty('initiativeTiming');
  expect(attacks[0]).not.toHaveProperty('attackRoutineCount');
  expect(
    getTrackerActionDeclarations(
      required(startNewCombatFromActiveRound(state, 'carry-current').rounds[0])
    )
  ).toEqual([]);
});

test('an earlier spell or movement stays a one-round choice and missile grid shorthand keeps its usual default', () => {
  const state = engaged();
  const r = required(state.rounds[0]);
  required(r.party[0]).weapon = 11; // Missile weapon.
  required(r.cells[0]?.[0]).partyToEnemy = 'x';
  const bow = required(
    getTrackerActionDeclarations(r).find((a) => a.side === 'party')
  );
  expect(bow.declaredAction).toBe('missile');
  const enemy = required(
    getTrackerActionDeclarations(r).find((a) => a.side === 'enemy')
  );
  r.actions = [
    { ...enemy, declaredAction: 'spell-casting', castingSegments: 2 },
    { ...enemy, id: 'move', declaredAction: 'close', actionDistanceInches: 2 },
  ];
  required(r.cells[0]?.[0]).enemyToParty = '';
  const next = required(insertRoundAfterActive(state).rounds[1]);
  const actions = getTrackerActionDeclarations(next);
  expect(actions.find((a) => a.side === 'party')).toMatchObject({
    declaredAction: 'missile',
    targetDeclarations: [{ targetCombatantKey: required(r.enemies[0]).key }],
  });
  expect(
    actions.filter(
      (a) => a.side === 'enemy' && a.combatantKey === enemy.combatantKey
    )
  ).toEqual([]);
});

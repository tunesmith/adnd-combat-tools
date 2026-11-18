import { resolveInitiativeDraft } from '../helpers/initiative/resolvedRound';
import { buildInitiativeGraphEnabledNodeIds } from '../helpers/initiative/graphInspector';
import type { InitiativeScenarioDraftCombatant } from '../types/initiative';

const charger = (
  key: number,
  distance: number
): InitiativeScenarioDraftCombatant => ({
  combatantKey: key,
  name: `Orc ${key}`,
  declaredAction: 'charge',
  movementRate: 12,
  weaponId: 56,
  targetDeclarations: [{ targetCombatantKey: 3, distanceInches: distance }],
});

const guard: InitiativeScenarioDraftCombatant = {
  combatantKey: 3,
  name: 'Guard',
  declaredAction: 'open-melee',
  weaponId: 50,
  targetCombatantKeys: [1],
};

function resolve(
  defender: InitiativeScenarioDraftCombatant,
  chargers = [charger(1, 4)]
) {
  return resolveInitiativeDraft({
    label: 'Charge contact',
    partyInitiative: 2,
    enemyInitiative: 5,
    party: chargers,
    enemies: [defender],
  });
}

test.each([
  {
    name: 'fighter with three routines',
    attacksPerRoutine: 1,
    attackRoutineCount: 3,
    rolls: 1,
  },
  {
    name: 'claw/claw/bite',
    attacksPerRoutine: 3,
    attackRoutineCount: 1,
    rolls: 3,
  },
  {
    name: 'creature with two claw/claw/bite routines',
    attacksPerRoutine: 3,
    attackRoutineCount: 2,
    rolls: 3,
  },
])(
  'schedules one complete defensive routine for a $name',
  ({ attacksPerRoutine, attackRoutineCount, rolls }) => {
    const { attackGraph } = resolve({
      ...guard,
      weaponId: 1,
      attacksPerRoutine,
      attackRoutineCount,
    });
    const blows = attackGraph.nodes.filter((n) => n.side === 'enemy');
    expect(
      blows.map((node) => [
        node.id,
        node.routineNumber,
        node.componentNumber,
        node.segment,
        node.targetId,
      ])
    ).toEqual(
      Array.from({ length: rolls }, (_, i) => [
        `attack:enemy-3:${i + 1}`,
        1,
        i + 1,
        2,
        'party-1',
      ])
    );
  }
);

test.each([
  { weaponId: 50, first: 'defender' },
  { weaponId: 57, first: 'charger' },
  { weaponId: 56, first: 'simultaneous' },
])(
  'applies reach to the complete routine when first strike is $first',
  ({ weaponId, first }) => {
    const { attackGraph } = resolve({
      ...guard,
      weaponId,
      attacksPerRoutine: 3,
    });
    const defenderIds = [
      'attack:enemy-3:1',
      'attack:enemy-3:2',
      'attack:enemy-3:3',
    ];
    const attacker = 'attack:party-1:1';
    const ready = buildInitiativeGraphEnabledNodeIds(attackGraph, {});
    if (first === 'defender') {
      expect(ready).toEqual(new Set(defenderIds));
      expect(
        buildInitiativeGraphEnabledNodeIds(attackGraph, {
          'attack:enemy-3:1': 'resolved',
          'attack:enemy-3:2': 'resolved',
        })
      ).toEqual(new Set([defenderIds[2]]));
    } else if (first === 'charger') {
      expect(ready).toEqual(new Set([attacker]));
      expect(
        buildInitiativeGraphEnabledNodeIds(attackGraph, {
          [attacker]: 'resolved',
        })
      ).toEqual(new Set(defenderIds));
    } else {
      expect(ready).toEqual(new Set([attacker, ...defenderIds]));
    }
  }
);

test('two incoming charges require a single declared return target, regardless of roster order', () => {
  for (const party of [
    [charger(1, 4), charger(2, 8)],
    [charger(2, 8), charger(1, 4)],
  ]) {
    const ambiguous = resolve(
      {
        ...guard,
        targetCombatantKeys: [1, 2],
        attacksPerRoutine: 3,
        attackRoutineCount: 2,
      },
      party
    );
    expect(ambiguous.attackGraph.nodes.map((n) => n.id).sort()).toEqual([
      'attack:party-1:1',
      'attack:party-2:1',
    ]);
    expect(ambiguous.attackGraph.edges).toEqual([]);
    expect(ambiguous.viewModel.chargeDefenseWarnings).toHaveLength(1);
    for (const target of [1, 2]) {
      const selected = resolve(
        {
          ...guard,
          targetCombatantKeys: [target],
          attacksPerRoutine: 3,
          attackRoutineCount: 2,
        },
        party
      );
      const otherCharger = target === 1 ? 'party-2' : 'party-1';
      expect(
        selected.scenario.movementResolutions.find(
          (movement) => movement.combatantId === otherCharger
        )?.firstStrike
      ).toBeUndefined();
      const blows = selected.attackGraph.nodes.filter(
        (n) => n.side === 'enemy'
      );
      expect(blows).toHaveLength(3);
      for (const blow of blows)
        expect(blow).toMatchObject({
          targetId: `party-${target}`,
          segment: target === 1 ? 2 : 3,
          routineNumber: 1,
        });
      expect(selected.attackGraph.edges).toEqual(
        blows.map((blow) => ({
          fromNodeId: blow.id,
          toNodeId: `attack:party-${target}:1`,
          reasons: ['movement'],
        }))
      );
      expect(selected.viewModel.chargeDefenseWarnings).toEqual([]);
    }
    const untargeted = resolve({ ...guard, targetCombatantKeys: [] }, party);
    expect(
      untargeted.attackGraph.nodes.filter((n) => n.side === 'enemy')
    ).toEqual([]);
    expect(untargeted.viewModel.chargeDefenseWarnings).toEqual([]);
  }
});

test('a creature closing into a mutual charge contact keeps its components', () => {
  const { attackGraph } = resolve({
    ...guard,
    declaredAction: 'close',
    attacksPerRoutine: 3,
    movementRate: 12,
    targetDeclarations: [{ targetCombatantKey: 1, distanceInches: 4 }],
  });
  expect(
    attackGraph.nodes
      .filter((n) => n.side === 'enemy')
      .map((n) => n.componentNumber)
  ).toEqual([1, 2, 3]);
  expect(new Set(attackGraph.nodes.map((n) => n.id)).size).toBe(4);
});

test('a set spear has one readied strike even with multiple configured attacks', () => {
  const { attackGraph } = resolve({
    ...guard,
    declaredAction: 'set-vs-charge',
    attacksPerRoutine: 3,
    attackRoutineCount: 2,
  });
  expect(attackGraph.nodes.filter((n) => n.side === 'enemy')).toHaveLength(1);
  expect(
    attackGraph.nodes.find((n) => n.side === 'enemy')?.placement
  ).toMatchObject({ damageMultiplier: 2 });
});

test('declared melee against a charger out of reach generates no contact blows', () => {
  const { attackGraph } = resolve(
    { ...guard, attacksPerRoutine: 3, attackRoutineCount: 2 },
    [charger(1, 40)]
  );
  expect(attackGraph.nodes).toEqual([]);
});

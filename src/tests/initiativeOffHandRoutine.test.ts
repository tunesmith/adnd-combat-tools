import { resolveInitiativeDraft } from '../helpers/initiative/resolvedRound';
import { resolveTrackerRoundInitiative } from '../helpers/initiative/trackerRoundResolution';
import {
  buildTrackerSteps,
  retainPriorStepResults,
  setTrackerStepResult,
} from '../helpers/trackerStepResults';
import { createRegisterIntentionsFixtureState } from './support/trackerFixtures';
import type { InitiativeScenarioDraftCombatant } from '../types/initiative';

const fighter: InitiativeScenarioDraftCombatant = {
  combatantKey: 1,
  name: 'Fighter',
  declaredAction: 'open-melee',
  weaponId: 56,
  offHandWeaponId: 17,
  targetCombatantKeys: [2],
};
const rival: InitiativeScenarioDraftCombatant = {
  combatantKey: 2,
  name: 'Rival',
  declaredAction: 'open-melee',
  weaponId: 56,
  targetCombatantKeys: [1],
};
const exchange = (actor: InitiativeScenarioDraftCombatant, foe = rival) =>
  resolveInitiativeDraft({
    label: 'Two weapons',
    partyInitiative: 4,
    enemyInitiative: 4,
    party: [actor],
    enemies: [foe],
  });

test.each([1, 2])(
  'a routine configured for %i attack(s) produces one roll per hand on primary timing',
  (attacksPerRoutine) => {
    const { attackGraph, resolution } = exchange({
      ...fighter,
      attacksPerRoutine,
    });
    const nodes = attackGraph.nodes.filter((n) => n.side === 'party');
    expect(nodes.map((n) => [n.hand, n.routineNumber, n.source])).toEqual([
      ['main', 1, 'routine-component'],
      ['offHand', 1, 'routine-component'],
    ]);
    expect(nodes.map((n) => n.label)).toEqual([
      'Main hand · Sword, long',
      'Off-hand · Dagger (Held)',
    ]);
    expect(resolution.directMeleeEngagements[0]?.resolution.reason).toBe(
      'simultaneous'
    );
    expect(attackGraph.layers).toHaveLength(1);
  }
);

test('repeated and larger routines count the off hand once each', () => {
  const { attackGraph } = exchange({
    ...fighter,
    attacksPerRoutine: 3,
    attackRoutineCount: 2,
  });
  const nodes = attackGraph.nodes.filter((n) => n.side === 'party');
  for (const routine of [1, 2]) {
    expect(
      nodes.filter((n) => n.routineNumber === routine).map((n) => n.hand)
    ).toEqual(['main', 'offHand', 'main']);
  }
  expect(nodes).toHaveLength(6);
});

test('speed-factor bonus blows belong to the primary weapon only', () => {
  const spear = { ...rival, weaponId: 50 };
  const daggerInOffHand = exchange(fighter, spear).attackGraph.nodes.filter(
    (node) => node.side === 'party'
  );
  expect(daggerInOffHand.map((node) => node.source)).toEqual([
    'routine-component',
    'routine-component',
  ]);
  const { attackGraph } = exchange(
    {
      ...fighter,
      weaponId: 17,
      offHandWeaponId: 3,
    },
    spear
  );
  expect(
    attackGraph.nodes
      .filter((n) => n.side === 'party')
      .map((n) => [n.source, n.hand])
  ).toEqual([
    ['routine-component', 'main'],
    ['routine-component', 'offHand'],
    ['timing-bonus', 'main'],
  ]);
});

test('charge contact uses primary reach for both defender rolls', () => {
  const { attackGraph } = exchange(
    { ...fighter, weaponId: 50, attacksPerRoutine: 2, attackRoutineCount: 3 },
    {
      ...rival,
      declaredAction: 'charge',
      movementRate: 12,
      targetDeclarations: [{ targetCombatantKey: 1, distanceInches: 4 }],
    }
  );
  const nodes = attackGraph.nodes.filter((n) => n.side === 'party');
  expect(nodes.map((n) => [n.hand, n.segment, n.targetId])).toEqual([
    ['main', 2, 'enemy-2'],
    ['offHand', 2, 'enemy-2'],
  ]);
  expect(attackGraph.edges).toEqual(
    nodes.map((n) => ({
      fromNodeId: n.id,
      toNodeId: 'attack:enemy-2:1',
      reasons: ['movement'],
    }))
  );
});

test('an equipped secondary weapon adds no missile, spell or set-spear attacks', () => {
  for (const actor of [
    { ...fighter, weaponId: 11, declaredAction: 'missile' as const },
    {
      ...fighter,
      declaredAction: 'spell-casting' as const,
      castingSegments: 2,
    },
    { ...fighter, weaponId: 50, declaredAction: 'set-vs-charge' as const },
  ]) {
    const foe = {
      ...rival,
      declaredAction: 'charge' as const,
      movementRate: 12,
      targetDeclarations: [{ targetCombatantKey: 1, distanceInches: 4 }],
    };
    const nodes = exchange(actor, foe).attackGraph.nodes;
    expect(nodes).toEqual(
      exchange({ ...actor, offHandWeaponId: undefined }, foe).attackGraph.nodes
    );
  }
});

test('changing the secondary weapon retains the old blow as a prior result and preserves the primary result', () => {
  const round = createRegisterIntentionsFixtureState().rounds[0];
  const actor = round?.party[0];
  if (!round || !actor) throw Error('Missing fighter');
  actor.weapon = 56;
  actor.offHandWeapon = 17;
  actor.attacksPerRoutine = 2;
  const steps = buildTrackerSteps(round, resolveTrackerRoundInitiative(round));
  const main = steps.get('attack:party-1:1'),
    off = steps.get('attack:party-1:2');
  if (!main || !off) throw Error('Missing hand steps');
  const noted = setTrackerStepResult(
    setTrackerStepResult(round, main, 'Sword missed'),
    off,
    'Dagger hit'
  );
  const revised = retainPriorStepResults({
    ...noted,
    party: noted.party.map((c) =>
      c.key === actor.key ? { ...c, offHandWeapon: 3 } : c
    ),
  });
  expect(revised.stepResults).toEqual([
    { ...main, text: 'Sword missed' },
    { ...off, stepKey: null, text: 'Dagger hit' },
  ]);
});

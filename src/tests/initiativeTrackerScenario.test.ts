import { buildInitiativeScenarioFromTrackerRound } from '../helpers/initiative/trackerScenario';
import { createInitialTrackerState } from '../helpers/trackerState';
import type { DirectMeleeEngagement } from '../types/initiative';
import type { TrackerRound } from '../types/tracker';

const requireRound = (): TrackerRound => {
  const state = createInitialTrackerState();
  const round = state.rounds[0];

  if (!round) {
    throw new Error('Missing tracker round');
  }

  return round;
};

const setMutualTarget = (
  round: TrackerRound,
  enemyIndex: number,
  partyIndex: number
) => {
  const row = round.cells[enemyIndex];
  const current = row?.[partyIndex];

  if (!current) {
    throw new Error(`Missing tracker cell ${enemyIndex},${partyIndex}`);
  }

  if (!row) {
    throw new Error(`Missing tracker row ${enemyIndex}`);
  }

  row[partyIndex] = {
    ...current,
    enemyToPartyVisible: true,
    partyToEnemyVisible: true,
    enemyToParty: 'x',
    partyToEnemy: 'x',
  };
};

const getStepSignatures = (engagement: DirectMeleeEngagement): string[][] =>
  engagement.resolution.steps.map((step) =>
    step.attacks.map((attack) => `${attack.combatantId}${attack.attackNumber}`)
  );

const requireEngagement = (
  engagement: DirectMeleeEngagement | undefined
): DirectMeleeEngagement => {
  if (!engagement) {
    throw new Error('Missing direct melee engagement');
  }

  return engagement;
};

describe('tracker initiative scenario builder', () => {
  test('extracts combatants, weapon metadata, targets, and simple side order from a tracker round', () => {
    const round = requireRound();

    round.partyInitiative = '5';
    round.enemyInitiative = '2';

    if (
      !round.party[0] ||
      !round.party[1] ||
      !round.enemies[0] ||
      !round.enemies[1] ||
      !round.partyStates[0] ||
      !round.partyStates[1] ||
      !round.enemyStates[0]
    ) {
      throw new Error('Missing combatants or round state');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 2;
    round.party[1].weapon = 9;
    round.enemies[0].name = 'Ghoul';
    round.enemies[0].weapon = 1;
    round.enemies[1].weapon = 2;
    round.partyStates[0].action = 'close and strike';
    round.partyStates[1].action = 'loose arrow';
    round.enemyStates[0].action = 'claw';

    setMutualTarget(round, 0, 0);
    setMutualTarget(round, 1, 1);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.label).toBe('Round 1');
    expect(scenario.partyInitiative).toBe(5);
    expect(scenario.enemyInitiative).toBe(2);
    expect(scenario.simpleOrder).toBe('party-first');

    expect(scenario.party[0]).toMatchObject({
      id: 'party-1',
      side: 'party',
      name: 'Lodi',
      initiative: 5,
      weaponId: 2,
      weaponName: 'Axe, Battle',
      weaponType: 'melee',
      weaponSpeedFactor: 7,
      intention: 'close and strike',
      targetIds: ['enemy-4'],
      attackRoutine: {
        id: 'routine:party-1:1',
        timingBasisComponentId: 'attack-1',
      },
    });
    expect(scenario.party[1]).toMatchObject({
      id: 'party-2',
      weaponId: 9,
      weaponType: 'missile',
      weaponSpeedFactor: undefined,
      intention: 'loose arrow',
      targetIds: ['enemy-5'],
    });
    expect(scenario.enemies[0]).toMatchObject({
      id: 'enemy-4',
      side: 'enemy',
      name: 'Ghoul',
      initiative: 2,
      weaponId: 1,
      weaponName: 'Natural Weapon (Monster)',
      weaponType: 'natural',
      intention: 'claw',
      targetIds: ['party-1'],
    });
    expect(scenario.directMeleePairs).toEqual([
      {
        partyCombatantId: 'party-1',
        enemyCombatantId: 'enemy-4',
        inference: 'mutual-targeting-non-missile-weapons',
      },
    ]);
    const engagement = requireEngagement(scenario.directMeleeEngagements[0]);

    expect(scenario.directMeleeEngagements).toHaveLength(1);
    expect(engagement.resolution.reason).toBe('initiative');
    expect(getStepSignatures(engagement)).toEqual([['party-11'], ['enemy-41']]);
  });

  test('resolves tied direct melee with natural weapons as simultaneous', () => {
    const round = requireRound();

    round.partyInitiative = '3';
    round.enemyInitiative = '3';

    if (
      !round.party[0] ||
      !round.party[1] ||
      !round.enemies[0] ||
      !round.enemies[1]
    ) {
      throw new Error('Missing combatants');
    }

    round.party[0].weapon = 3;
    round.party[1].weapon = 9;
    round.enemies[0].weapon = 1;
    round.enemies[1].weapon = 2;

    setMutualTarget(round, 0, 0);
    setMutualTarget(round, 1, 1);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.simpleOrder).toBe('simultaneous');
    expect(scenario.directMeleePairs).toEqual([
      {
        partyCombatantId: 'party-1',
        enemyCombatantId: 'enemy-4',
        inference: 'mutual-targeting-non-missile-weapons',
      },
    ]);
    const engagement = requireEngagement(scenario.directMeleeEngagements[0]);

    expect(scenario.directMeleeEngagements).toHaveLength(1);
    expect(engagement.resolution.reason).toBe('simultaneous');
    expect(getStepSignatures(engagement)).toEqual([['party-11', 'enemy-41']]);
    expect(scenario.unresolvedMeleeCandidateIds).toEqual([]);
  });

  test('applies the open melee weapon speed resolver to tied direct weapon pairs', () => {
    const round = requireRound();

    round.partyInitiative = '4';
    round.enemyInitiative = '4';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].weapon = 17;
    round.enemies[0].weapon = 2;

    setMutualTarget(round, 0, 0);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.directMeleePairs).toEqual([
      {
        partyCombatantId: 'party-1',
        enemyCombatantId: 'enemy-4',
        inference: 'mutual-targeting-non-missile-weapons',
      },
    ]);
    const engagement = requireEngagement(scenario.directMeleeEngagements[0]);

    expect(scenario.directMeleeEngagements).toHaveLength(1);
    expect(engagement.resolution.reason).toBe('weapon-speed-double');
    expect(getStepSignatures(engagement)).toEqual([
      ['party-11'],
      ['party-12'],
      ['enemy-41'],
    ]);
  });

  test('leaves ambiguous mutual melee contact unresolved instead of inventing pairs', () => {
    const round = requireRound();

    if (!round.party[0] || !round.party[1] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].weapon = 2;
    round.party[1].weapon = 3;
    round.enemies[0].weapon = 1;

    setMutualTarget(round, 0, 0);
    setMutualTarget(round, 0, 1);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.directMeleePairs).toEqual([]);
    expect(scenario.directMeleeEngagements).toEqual([]);
    expect(scenario.unresolvedMeleeCandidateIds).toEqual(
      expect.arrayContaining(['party-1', 'party-2', 'enemy-4'])
    );
    expect(scenario.unresolvedMeleeCandidateIds).toHaveLength(3);
  });
});

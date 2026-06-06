import { resolveInitiativeRound } from '../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../helpers/initiative/scenario';
import { buildInitiativeScenarioFromTrackerRound } from '../helpers/initiative/trackerScenario';
import { createInitialTrackerState } from '../helpers/trackerState';
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

describe('initiative round resolution', () => {
  test('keeps all combatants on the baseline side initiative track', () => {
    const round = requireRound();

    round.partyInitiative = '2';
    round.enemyInitiative = '5';

    if (!round.party[0] || !round.party[1] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].weapon = 2;
    round.party[1].weapon = 9;
    round.enemies[0].weapon = 1;

    setMutualTarget(round, 0, 0);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);
    const resolution = resolveInitiativeRound(scenario);

    expect(resolution.simpleOrder).toBe('enemy-first');
    expect(resolution.overriddenCombatantIds).toEqual(['party-1', 'enemy-4']);
    expect(resolution.simpleOrderSteps).toEqual([
      {
        sides: ['enemy'],
        combatantIds: ['enemy-4', 'enemy-5', 'enemy-6'],
      },
      {
        sides: ['party'],
        combatantIds: ['party-1', 'party-2', 'party-3'],
      },
    ]);
    expect(resolution.simpleOrderCombatantIds).toEqual([
      'enemy-4',
      'enemy-5',
      'enemy-6',
      'party-1',
      'party-2',
      'party-3',
    ]);
    expect(resolution.directMeleeEngagements).toHaveLength(1);
    expect(resolution.unresolvedMeleeCandidateIds).toEqual([]);
  });

  test('keeps labeled no combat actions on the baseline side initiative track', () => {
    const scenario = buildInitiativeScenario({
      label: 'Labeled Non Combat Action',
      partyInitiative: 6,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Lodi',
          declaredAction: 'none',
          actionLabel: 'Cross room',
          weaponId: 2,
          targetCombatantKeys: [],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Gnoll',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);

    expect(resolution.simpleOrder).toBe('party-first');
    expect(resolution.simpleOrderSteps).toEqual([
      {
        sides: ['party'],
        combatantIds: ['party-1'],
      },
      {
        sides: ['enemy'],
        combatantIds: ['enemy-3'],
      },
    ]);
    expect(resolution.simpleOrderCombatantIds).toEqual(['party-1', 'enemy-3']);
  });

  test('groups action timing overrides before and after normal side initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Timing Overrides',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Lodi',
          weaponId: 17,
          actions: [
            {
              id: 'main',
              declaredAction: 'open-melee',
              actionLabel: 'Sword of speed',
              initiativeTiming: 'wins-initiative',
              targetCombatantKeys: [3],
            },
            {
              id: 'action-2',
              declaredAction: 'open-melee',
              actionLabel: 'Normal attack',
              targetCombatantKeys: [3],
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Yeenoghu',
          declaredAction: 'spell-casting',
          actionLabel: 'Slow spell',
          initiativeTiming: 'loses-initiative',
          castingSegments: 4,
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);

    expect(resolution.simpleOrder).toBe('enemy-first');
    expect(resolution.simpleOrderSteps).toEqual([
      {
        sides: ['party'],
        initiativeTiming: 'wins-initiative',
        combatantIds: ['party-1'],
      },
      {
        sides: ['party'],
        combatantIds: ['party-action-1001'],
      },
      {
        sides: ['enemy'],
        initiativeTiming: 'loses-initiative',
        combatantIds: ['enemy-3'],
      },
    ]);
    expect(resolution.simpleOrderCombatantIds).toEqual([
      'party-1',
      'party-action-1001',
      'enemy-3',
    ]);
  });

  test('groups simple-order combatants together when side initiative is simultaneous', () => {
    const round = requireRound();

    round.partyInitiative = '4';
    round.enemyInitiative = '4';

    const scenario = buildInitiativeScenarioFromTrackerRound(round);
    const resolution = resolveInitiativeRound(scenario);

    expect(resolution.simpleOrder).toBe('simultaneous');
    expect(resolution.overriddenCombatantIds).toEqual([]);
    expect(resolution.simpleOrderSteps).toEqual([
      {
        sides: ['party', 'enemy'],
        combatantIds: [
          'party-1',
          'party-2',
          'party-3',
          'enemy-4',
          'enemy-5',
          'enemy-6',
        ],
      },
    ]);
    expect(resolution.directMeleeEngagements).toEqual([]);
    expect(resolution.unresolvedMeleeCandidateIds).toEqual([]);
  });

  test('leaves unresolved melee candidates on baseline side initiative', () => {
    const round = requireRound();

    round.partyInitiative = '6';
    round.enemyInitiative = '1';

    if (!round.party[0] || !round.party[1] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].weapon = 2;
    round.party[1].weapon = 3;
    round.enemies[0].weapon = 1;

    setMutualTarget(round, 0, 0);
    setMutualTarget(round, 0, 1);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);
    const resolution = resolveInitiativeRound(scenario);

    expect(resolution.directMeleeEngagements).toEqual([]);
    expect(resolution.overriddenCombatantIds).toEqual([]);
    expect(resolution.unresolvedMeleeCandidateIds).toEqual(
      expect.arrayContaining(['party-1', 'party-2', 'enemy-4'])
    );
    expect(resolution.simpleOrderSteps).toEqual([
      {
        sides: ['party'],
        combatantIds: ['party-1', 'party-2', 'party-3'],
      },
      {
        sides: ['enemy'],
        combatantIds: ['enemy-4', 'enemy-5', 'enemy-6'],
      },
    ]);
    expect(resolution.simpleOrderCombatantIds).toEqual([
      'party-1',
      'party-2',
      'party-3',
      'enemy-4',
      'enemy-5',
      'enemy-6',
    ]);
  });
});

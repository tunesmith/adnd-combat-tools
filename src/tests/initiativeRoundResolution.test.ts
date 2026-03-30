import { resolveInitiativeRound } from '../helpers/initiative/roundResolution';
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
  test('keeps only non-overridden combatants in simple side order steps', () => {
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
        combatantIds: ['enemy-5', 'enemy-6'],
      },
      {
        sides: ['party'],
        combatantIds: ['party-2', 'party-3'],
      },
    ]);
    expect(resolution.simpleOrderCombatantIds).toEqual([
      'enemy-5',
      'enemy-6',
      'party-2',
      'party-3',
    ]);
    expect(resolution.directMeleeEngagements).toHaveLength(1);
    expect(resolution.unresolvedMeleeCandidateIds).toEqual([]);
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

  test('keeps unresolved melee candidates out of simple side order', () => {
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
        combatantIds: ['party-3'],
      },
      {
        sides: ['enemy'],
        combatantIds: ['enemy-5', 'enemy-6'],
      },
    ]);
    expect(resolution.simpleOrderCombatantIds).toEqual([
      'party-3',
      'enemy-5',
      'enemy-6',
    ]);
  });
});

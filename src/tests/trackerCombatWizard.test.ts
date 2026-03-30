import { createInitialTrackerState } from '../helpers/trackerState';
import { buildCombatWizardEntries } from '../helpers/trackerCombatWizard';

describe('tracker combat wizard helpers', () => {
  test('orders party before enemies when party initiative wins or ties', () => {
    const state = createInitialTrackerState();
    const round = state.rounds[0];

    if (!round) {
      throw new Error('Missing tracker round');
    }

    round.partyInitiative = '4';
    round.enemyInitiative = '4';
    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing initial combatants');
    }
    round.party[0].name = 'Lodi';
    round.enemies[0].name = 'Ghoul';

    const entries = buildCombatWizardEntries(round);

    expect(entries[0]).toMatchObject({
      side: 'party',
      combatantName: 'Lodi',
    });
    expect(entries[3]).toMatchObject({
      side: 'enemy',
      combatantName: 'Ghoul',
    });
  });

  test('orders enemies first when enemy initiative is higher and keeps only active targets', () => {
    const state = createInitialTrackerState();
    const round = state.rounds[0];

    if (!round) {
      throw new Error('Missing tracker round');
    }

    round.partyInitiative = '2';
    round.enemyInitiative = '5';
    if (
      !round.party[0] ||
      !round.party[1] ||
      !round.enemies[0] ||
      !round.partyStates[0] ||
      !round.cells[0] ||
      !round.cells[0][0] ||
      !round.cells[1] ||
      !round.cells[1][0]
    ) {
      throw new Error('Missing initial combatants or cells');
    }
    round.party[0].name = 'Lodi';
    round.party[1].name = 'Azalia';
    round.enemies[0].name = 'Ghoul';
    round.partyStates[0].result = 'hit for 4';
    round.cells[0][0] = {
      ...round.cells[0][0],
      enemyToPartyVisible: true,
      enemyToParty: 'xx',
    };
    round.cells[1][0] = {
      ...round.cells[1][0],
      partyToEnemyVisible: true,
      partyToEnemy: '5',
    };

    const entries = buildCombatWizardEntries(round);

    expect(entries[0]).toMatchObject({
      side: 'enemy',
      combatantName: 'Ghoul',
      targetIndices: [0],
      resolved: false,
    });
    expect(entries[3]).toMatchObject({
      side: 'party',
      combatantName: 'Lodi',
      targetIndices: [1],
      resolved: true,
      result: 'hit for 4',
    });
  });
});

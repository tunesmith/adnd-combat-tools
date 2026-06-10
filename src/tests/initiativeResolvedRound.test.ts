import { resolveInitiativeDraft } from '../helpers/initiative/resolvedRound';
import { resolveTrackerRoundInitiative } from '../helpers/initiative/trackerRoundResolution';
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

const setPartyTarget = (
  round: TrackerRound,
  enemyIndex: number,
  partyIndex: number,
  resultText: string
) => {
  const row = round.cells[enemyIndex];
  const cell = row?.[partyIndex];

  if (!row || !cell) {
    throw new Error(`Missing tracker cell ${enemyIndex},${partyIndex}`);
  }

  row[partyIndex] = {
    ...cell,
    partyToEnemyVisible: true,
    partyToEnemy: resultText,
  };
};

describe('initiative resolved round', () => {
  test('resolves an initiative draft into scenario, order, graph, and view model artifacts', () => {
    const resolvedRound = resolveInitiativeDraft({
      label: 'Shared Resolution',
      partyInitiative: 6,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Lodi',
          weaponId: 2,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Gnoll',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });

    expect(resolvedRound.scenario.simpleOrder).toBe('party-first');
    expect(resolvedRound.resolution.simpleOrderSteps).toEqual([
      {
        sides: ['party'],
        combatantIds: ['party-1'],
      },
      {
        sides: ['enemy'],
        combatantIds: ['enemy-3'],
      },
    ]);
    expect(resolvedRound.attackGraph.nodes.map((node) => node.id)).toEqual([
      'attack:party-1:1',
      'attack:enemy-3:1',
    ]);
    expect(resolvedRound.viewModel.cards.map((card) => card.kind)).toEqual([
      'simple-order',
      'direct-melee',
    ]);
  });

  test('resolves a combat tracker round through the same initiative pipeline', () => {
    const round = requireRound();

    round.partyInitiative = '6';
    round.enemyInitiative = '2';

    if (!round.party[0] || !round.enemies[0] || !round.partyStates[0]) {
      throw new Error('Missing tracker combatants');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 9;
    round.enemies[0].name = 'Gnoll';
    round.partyStates[0].action = 'Fire arrows';
    setPartyTarget(round, 0, 0, '7');

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'missile',
      weaponName: 'Bow, composite, long',
      targetIds: ['enemy-4'],
    });
    expect(
      resolvedRound.attackGraph.nodes
        .filter((node) => node.combatantId === 'party-1')
        .map((node) => node.id)
    ).toEqual(['attack:party-1:1', 'attack:party-1:2']);
    expect(resolvedRound.viewModel.combatantNameById['party-1']).toBe('Lodi');
    expect(resolvedRound.viewModel.cards[0]).toMatchObject({
      id: 'simple-order',
      kind: 'simple-order',
    });
  });
});

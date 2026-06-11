import {
  deriveTrackerActionDeclarations,
  getTrackerActionDeclarations,
} from '../helpers/trackerActionDeclarations';
import { createInitialTrackerState } from '../helpers/trackerState';
import type { TrackerActionDeclaration, TrackerRound } from '../types/tracker';

const requireRound = (): TrackerRound => {
  const state = createInitialTrackerState();
  const round = state.rounds[0];

  if (!round) {
    throw new Error('Missing tracker round');
  }

  return round;
};

describe('tracker action declarations', () => {
  test('derives one main party action with multiple target declarations from visible grid cells', () => {
    const round = requireRound();

    if (!round.party[0] || !round.enemies[0] || !round.enemies[1]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 9;
    round.partyStates[0] = {
      hp: '',
      effect: '',
      action: 'Fire arrows',
      result: 'Volley resolved',
      notes: '',
    };

    const firstRow = round.cells[0];
    const secondRow = round.cells[1];
    const firstCell = firstRow?.[0];
    const secondCell = secondRow?.[0];

    if (!firstRow || !secondRow || !firstCell || !secondCell) {
      throw new Error('Missing target cells');
    }

    firstRow[0] = {
      ...firstCell,
      partyToEnemyVisible: true,
      partyToEnemy: '7',
    };
    secondRow[0] = {
      ...secondCell,
      partyToEnemyVisible: true,
      partyToEnemy: 'miss',
    };

    expect(deriveTrackerActionDeclarations(round)).toEqual([
      {
        id: 'party:1:main',
        source: 'combat-cell',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'missile',
        weaponId: 9,
        intention: 'Fire arrows',
        result: 'Volley resolved',
        targetDeclarations: [
          {
            targetCombatantKey: 4,
            targetCombatantIndex: 0,
            cellRowIndex: 0,
            cellColumnIndex: 0,
            cellResultText: '7',
          },
          {
            targetCombatantKey: 5,
            targetCombatantIndex: 1,
            cellRowIndex: 1,
            cellColumnIndex: 0,
            cellResultText: 'miss',
          },
        ],
      },
    ]);
  });

  test('derives enemy actions from enemy-to-party cells and infers open melee for natural weapons', () => {
    const round = requireRound();

    if (!round.enemies[0] || !round.party[0]) {
      throw new Error('Missing combatants');
    }

    round.enemies[0].name = 'Ghoul';
    round.enemies[0].weapon = 1;
    round.enemyStates[0] = {
      hp: '',
      effect: '',
      action: 'Claw Lodi',
      result: '',
      notes: '',
    };

    const row = round.cells[0];
    const cell = row?.[0];

    if (!row || !cell) {
      throw new Error('Missing target cell');
    }

    row[0] = {
      ...cell,
      enemyToPartyVisible: true,
      enemyToParty: '4',
    };

    expect(deriveTrackerActionDeclarations(round)).toMatchObject([
      {
        id: 'enemy:4:main',
        source: 'combat-cell',
        side: 'enemy',
        direction: 'enemyToParty',
        combatantKey: 4,
        combatantIndex: 0,
        targetSide: 'party',
        declaredAction: 'open-melee',
        weaponId: 1,
        intention: 'Claw Lodi',
        targetDeclarations: [
          {
            targetCombatantKey: 1,
            targetCombatantIndex: 0,
            cellResultText: '4',
          },
        ],
      },
    ]);
  });

  test('uses explicit round actions while inheriting that combatant target selections from the grid', () => {
    const round = requireRound();
    const explicitAction: TrackerActionDeclaration = {
      id: 'party:1:main',
      source: 'intention',
      side: 'party',
      direction: 'partyToEnemy',
      combatantKey: 1,
      combatantIndex: 0,
      targetSide: 'enemy',
      declaredAction: 'close',
      actionLabel: 'Move east',
      actionDistanceInches: 6,
      weaponId: 1,
      intention: 'Move east (6")',
      result: '',
      targetDeclarations: [],
    };
    const firstRow = round.cells[0];
    const firstCell = firstRow?.[0];
    const secondCell = firstRow?.[1];

    if (!firstRow || !firstCell || !secondCell) {
      throw new Error('Missing target cells');
    }

    firstRow[0] = {
      ...firstCell,
      partyToEnemyVisible: true,
      partyToEnemy: 'selected target',
    };
    firstRow[1] = {
      ...secondCell,
      partyToEnemyVisible: true,
      partyToEnemy: '7',
    };

    round.actions = [explicitAction];

    expect(getTrackerActionDeclarations(round)).toEqual([
      expect.objectContaining({
        id: 'party:2:main',
        source: 'combat-cell',
        combatantKey: 2,
        targetDeclarations: [
          expect.objectContaining({
            targetCombatantKey: 4,
            cellResultText: '7',
          }),
        ],
      }),
      {
        ...explicitAction,
        targetDeclarations: [
          {
            targetCombatantKey: 4,
            targetCombatantIndex: 0,
            cellRowIndex: 0,
            cellColumnIndex: 0,
            cellResultText: 'selected target',
          },
        ],
      },
    ]);
  });
});

import { getWeaponInfo } from '../tables/weapon';
import type { InitiativeDeclaredAction } from '../types/initiative';
import type {
  TrackerActionDeclaration,
  TrackerActionDirection,
  TrackerActionSide,
  TrackerActionTargetDeclaration,
  TrackerCellState,
  TrackerCombatant,
  TrackerCombatantRoundState,
  TrackerRound,
} from '../types/tracker';

export const getDefaultTrackerDeclaredAction = (
  combatant: TrackerCombatant
): InitiativeDeclaredAction =>
  getWeaponInfo(combatant.weapon)?.weaponType === 'missile'
    ? 'missile'
    : 'open-melee';

const hasActiveCellDirection = (
  cell: TrackerCellState | undefined,
  direction: TrackerActionDirection
): boolean => {
  if (!cell) {
    return false;
  }

  return direction === 'partyToEnemy'
    ? cell.partyToEnemyVisible ||
        Boolean(cell.partyToEnemy.trim()) ||
        Boolean(cell.partyToEnemyActionIds?.length)
    : cell.enemyToPartyVisible ||
        Boolean(cell.enemyToParty.trim()) ||
        Boolean(cell.enemyToPartyActionIds?.length);
};

const getCellResultText = (
  cell: TrackerCellState,
  direction: TrackerActionDirection
): string =>
  direction === 'partyToEnemy' ? cell.partyToEnemy : cell.enemyToParty;

const getCellActionIds = (
  cell: TrackerCellState,
  direction: TrackerActionDirection
): string[] =>
  direction === 'partyToEnemy'
    ? cell.partyToEnemyActionIds || []
    : cell.enemyToPartyActionIds || [];

const getActionId = (
  side: TrackerActionSide,
  combatant: TrackerCombatant
): string => `${side}:${combatant.key}:main`;

const getActionGroupKey = (
  side: TrackerActionSide,
  combatantKey: number
): string => `${side}:${combatantKey}`;

const buildActionDeclaration = ({
  side,
  direction,
  combatant,
  combatantIndex,
  targetSide,
  roundState,
  targetDeclarations,
}: {
  side: TrackerActionSide;
  direction: TrackerActionDirection;
  combatant: TrackerCombatant;
  combatantIndex: number;
  targetSide: TrackerActionSide;
  roundState: TrackerCombatantRoundState | undefined;
  targetDeclarations: TrackerActionTargetDeclaration[];
}): TrackerActionDeclaration => ({
  id: getActionId(side, combatant),
  source: 'combat-cell',
  side,
  direction,
  combatantKey: combatant.key,
  combatantIndex,
  targetSide,
  declaredAction: getDefaultTrackerDeclaredAction(combatant),
  ...(roundState?.action.trim()
    ? { actionLabel: roundState.action.trim() }
    : {}),
  weaponId: combatant.weapon,
  intention: roundState?.action || '',
  result: roundState?.result || '',
  targetDeclarations,
});

export const deriveTrackerActionDeclarations = (
  round: TrackerRound
): TrackerActionDeclaration[] => {
  const partyDeclarations = round.party.flatMap((combatant, partyIndex) => {
    const targetDeclarations = round.enemies.flatMap(
      (targetCombatant, enemyIndex) => {
        const cell = round.cells[enemyIndex]?.[partyIndex];

        if (!cell || !hasActiveCellDirection(cell, 'partyToEnemy')) {
          return [];
        }

        return [
          {
            targetCombatantKey: targetCombatant.key,
            targetCombatantIndex: enemyIndex,
            cellRowIndex: enemyIndex,
            cellColumnIndex: partyIndex,
            cellResultText: getCellResultText(cell, 'partyToEnemy'),
          },
        ];
      }
    );

    return targetDeclarations.length > 0
      ? [
          buildActionDeclaration({
            side: 'party',
            direction: 'partyToEnemy',
            combatant,
            combatantIndex: partyIndex,
            targetSide: 'enemy',
            roundState: round.partyStates[partyIndex],
            targetDeclarations,
          }),
        ]
      : [];
  });

  const enemyDeclarations = round.enemies.flatMap((combatant, enemyIndex) => {
    const targetDeclarations = round.party.flatMap(
      (targetCombatant, partyIndex) => {
        const cell = round.cells[enemyIndex]?.[partyIndex];

        if (!cell || !hasActiveCellDirection(cell, 'enemyToParty')) {
          return [];
        }

        return [
          {
            targetCombatantKey: targetCombatant.key,
            targetCombatantIndex: partyIndex,
            cellRowIndex: enemyIndex,
            cellColumnIndex: partyIndex,
            cellResultText: getCellResultText(cell, 'enemyToParty'),
          },
        ];
      }
    );

    return targetDeclarations.length > 0
      ? [
          buildActionDeclaration({
            side: 'enemy',
            direction: 'enemyToParty',
            combatant,
            combatantIndex: enemyIndex,
            targetSide: 'party',
            roundState: round.enemyStates[enemyIndex],
            targetDeclarations,
          }),
        ]
      : [];
  });

  return partyDeclarations.concat(enemyDeclarations);
};

const getTargetDeclarationsForAction = (
  round: TrackerRound,
  action: TrackerActionDeclaration
): TrackerActionTargetDeclaration[] => {
  if (action.usesGridTargets === false) {
    return [];
  }

  if (action.direction === 'partyToEnemy') {
    return round.enemies.flatMap((targetCombatant, enemyIndex) => {
      const cell = round.cells[enemyIndex]?.[action.combatantIndex];

      if (!cell || !hasActiveCellDirection(cell, action.direction)) {
        return [];
      }

      const actionIds = getCellActionIds(cell, action.direction);
      if (actionIds.length > 0 && !actionIds.includes(action.id)) {
        return [];
      }

      return [
        {
          targetCombatantKey: targetCombatant.key,
          targetCombatantIndex: enemyIndex,
          cellRowIndex: enemyIndex,
          cellColumnIndex: action.combatantIndex,
          cellResultText: getCellResultText(cell, action.direction),
        },
      ];
    });
  }

  return round.party.flatMap((targetCombatant, partyIndex) => {
    const cell = round.cells[action.combatantIndex]?.[partyIndex];

    if (!cell || !hasActiveCellDirection(cell, action.direction)) {
      return [];
    }

    const actionIds = getCellActionIds(cell, action.direction);
    if (actionIds.length > 0 && !actionIds.includes(action.id)) {
      return [];
    }

    return [
      {
        targetCombatantKey: targetCombatant.key,
        targetCombatantIndex: partyIndex,
        cellRowIndex: action.combatantIndex,
        cellColumnIndex: partyIndex,
        cellResultText: getCellResultText(cell, action.direction),
      },
    ];
  });
};

export const getTrackerActionDeclarations = (
  round: TrackerRound
): TrackerActionDeclaration[] => {
  const explicitActions = round.actions || [];
  const derivedRoundActions = deriveTrackerActionDeclarations(round);

  if (explicitActions.length === 0) {
    return derivedRoundActions;
  }

  const explicitCombatantKeys = new Set(
    explicitActions.map((action) =>
      getActionGroupKey(action.side, action.combatantKey)
    )
  );
  const derivedActions = derivedRoundActions.filter(
    (action) =>
      !explicitCombatantKeys.has(
        getActionGroupKey(action.side, action.combatantKey)
      )
  );
  const explicitActionsWithCurrentTargets = explicitActions.map((action) => {
    const targetDeclarations = getTargetDeclarationsForAction(round, action);

    if (targetDeclarations.length === 0) {
      return action;
    }

    return {
      ...action,
      targetDeclarations,
    };
  });

  return derivedActions.concat(explicitActionsWithCurrentTargets);
};

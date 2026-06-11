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
    ? cell.partyToEnemyVisible || Boolean(cell.partyToEnemy.trim())
    : cell.enemyToPartyVisible || Boolean(cell.enemyToParty.trim());
};

const getCellResultText = (
  cell: TrackerCellState,
  direction: TrackerActionDirection
): string =>
  direction === 'partyToEnemy' ? cell.partyToEnemy : cell.enemyToParty;

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
  const derivedActionByCombatant = new Map(
    derivedRoundActions.map((action) => [
      getActionGroupKey(action.side, action.combatantKey),
      action,
    ])
  );
  const derivedActions = derivedRoundActions.filter(
    (action) =>
      !explicitCombatantKeys.has(
        getActionGroupKey(action.side, action.combatantKey)
      )
  );
  const explicitActionsWithCurrentTargets = explicitActions.map((action) => {
    const derivedAction = derivedActionByCombatant.get(
      getActionGroupKey(action.side, action.combatantKey)
    );

    if (
      action.usesGridTargets === false ||
      !derivedAction?.targetDeclarations.length
    ) {
      return action;
    }

    return {
      ...action,
      targetDeclarations: derivedAction.targetDeclarations,
    };
  });

  return derivedActions.concat(explicitActionsWithCurrentTargets);
};

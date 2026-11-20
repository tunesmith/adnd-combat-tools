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

export const getDefaultTrackerDeclaredAction = (): InitiativeDeclaredAction =>
  'none';

const getInferredTrackerDeclaredAction = (
  combatant: TrackerCombatant
): InitiativeDeclaredAction =>
  getWeaponInfo(combatant.weapon)?.weaponType === 'missile'
    ? 'missile'
    : 'open-melee';

const hasActiveCellDirection = (
  cell: TrackerCellState | undefined,
  direction: TrackerActionDirection
): boolean => {
  if (!cell || cell[`${direction}NoTarget`]) {
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
  declaredAction: getInferredTrackerDeclaredAction(combatant),
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
  const party = action.side === 'party';
  const targets = party ? round.enemies : round.party;
  return targets.flatMap((target, targetIndex) => {
    const cellRowIndex = party ? targetIndex : action.combatantIndex;
    const cellColumnIndex = party ? action.combatantIndex : targetIndex;
    const cell = round.cells[cellRowIndex]?.[cellColumnIndex];
    if (!cell || !hasActiveCellDirection(cell, action.direction)) return [];
    const ids = getCellActionIds(cell, action.direction);
    // Narrative associations are opt-in. Old disabled actions never acquire
    // a target merely because an unrelated grid entry is visible.
    if (
      action.usesGridTargets === false &&
      !(action.declaredAction === 'none' && ids.includes(action.id))
    )
      return [];
    if (ids.length && !ids.includes(action.id)) return [];
    return [
      {
        targetCombatantKey: target.key,
        targetCombatantIndex: targetIndex,
        cellRowIndex,
        cellColumnIndex,
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

export function canAssignGridTarget(action: TrackerActionDeclaration) {
  return action.usesGridTargets !== false || action.declaredAction === 'none';
}

export function actionIdsForTarget(
  actions: TrackerActionDeclaration[],
  key: number
) {
  return actions
    .filter(
      (a) =>
        canAssignGridTarget(a) &&
        a.targetDeclarations.some((t) => t.targetCombatantKey === key)
    )
    .map((a) => a.id);
}

// An omitted list retains the legacy "all eligible actions" convention. When
// the last owner is removed a handwritten entry can still occupy the grid.
export function setCellTargetOwners(
  cell: TrackerCellState,
  direction: TrackerActionDirection,
  ids: string[] | undefined
): TrackerCellState {
  const assigned = ids === undefined || ids.length > 0;
  const handwritten = Boolean(
    cell[direction] || cell[`${direction}ManualBlank`]
  );
  return {
    ...cell,
    [`${direction}Visible`]: assigned || handwritten,
    [`${direction}NoTarget`]: !assigned && handwritten ? true : undefined,
    [`${direction}ActionIds`]: ids?.length ? ids : undefined,
  };
}

// Copy effective memberships before editing stored targets or changing the
// action list. A wildcard in the old list then applies only to its old owners.
export function materializeStoredTargets(
  round: TrackerRound,
  side: TrackerActionSide,
  index: number,
  survivingIds?: ReadonlySet<string>
): TrackerRound {
  const owns = (a: TrackerActionDeclaration) =>
    a.side === side && a.combatantIndex === index;
  if (
    !survivingIds &&
    !round.actions?.some((a) => owns(a) && a.targetDeclarations.length)
  )
    return round;
  const old = getTrackerActionDeclarations(round).filter(owns);
  const direction = side === 'party' ? 'partyToEnemy' : 'enemyToParty';
  const targets = side === 'party' ? round.enemies : round.party;
  return {
    ...round,
    actions: round.actions?.map((a) =>
      owns(a) && a.targetDeclarations.length && canAssignGridTarget(a)
        ? { ...a, targetDeclarations: [] }
        : a
    ),
    cells: round.cells.map((row, r) =>
      row.map((cell, c) => {
        if ((side === 'party' ? c : r) !== index) return cell;
        const target = targets[side === 'party' ? r : c];
        if (!target) return cell;
        const ids = actionIdsForTarget(old, target.key).filter(
          (id) => !survivingIds || survivingIds.has(id)
        );
        return ids.length || hasActiveCellDirection(cell, direction)
          ? setCellTargetOwners(cell, direction, ids)
          : cell;
      })
    ),
  };
}

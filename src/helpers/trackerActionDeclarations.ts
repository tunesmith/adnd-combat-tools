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

const getDefaultDeclaredAction = (
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
  declaredAction: getDefaultDeclaredAction(combatant),
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
): TrackerActionDeclaration[] =>
  round.actions && round.actions.length > 0
    ? round.actions
    : deriveTrackerActionDeclarations(round);

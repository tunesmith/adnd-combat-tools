import { buildInitiativeScenario } from './scenario';
import type {
  InitiativeScenario,
  InitiativeScenarioDraft,
} from '../../types/initiative';
import type { TrackerRound } from '../../types/tracker';

const parseInitiative = (value: string): number => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTargetIndicesForPartyCombatant = (
  round: TrackerRound,
  partyIndex: number
): number[] =>
  round.enemies.flatMap((_, enemyIndex) => {
    const cell = round.cells[enemyIndex]?.[partyIndex];
    return cell &&
      (cell.partyToEnemyVisible || Boolean(cell.partyToEnemy.trim()))
      ? [enemyIndex]
      : [];
  });

const getTargetIndicesForEnemyCombatant = (
  round: TrackerRound,
  enemyIndex: number
): number[] =>
  round.party.flatMap((_, partyIndex) => {
    const cell = round.cells[enemyIndex]?.[partyIndex];
    return cell &&
      (cell.enemyToPartyVisible || Boolean(cell.enemyToParty.trim()))
      ? [partyIndex]
      : [];
  });

export const buildInitiativeScenarioFromTrackerRound = (
  round: TrackerRound
): InitiativeScenario => {
  const partyInitiative = parseInitiative(round.partyInitiative);
  const enemyInitiative = parseInitiative(round.enemyInitiative);

  const draft: InitiativeScenarioDraft = {
    label: round.label,
    partyInitiative,
    enemyInitiative,
    party: round.party.map((combatant, index) => ({
      combatantKey: combatant.key,
      name: combatant.name,
      weaponId: combatant.weapon,
      intention: round.partyStates[index]?.action || '',
      result: round.partyStates[index]?.result || '',
      targetCombatantKeys: getTargetIndicesForPartyCombatant(round, index)
        .map((enemyIndex) => round.enemies[enemyIndex]?.key)
        .filter((combatantKey): combatantKey is number =>
          Number.isFinite(combatantKey)
        ),
    })),
    enemies: round.enemies.map((combatant, index) => ({
      combatantKey: combatant.key,
      name: combatant.name,
      weaponId: combatant.weapon,
      intention: round.enemyStates[index]?.action || '',
      result: round.enemyStates[index]?.result || '',
      targetCombatantKeys: getTargetIndicesForEnemyCombatant(round, index)
        .map((partyIndex) => round.party[partyIndex]?.key)
        .filter((combatantKey): combatantKey is number =>
          Number.isFinite(combatantKey)
        ),
    })),
  };

  return buildInitiativeScenario(draft);
};

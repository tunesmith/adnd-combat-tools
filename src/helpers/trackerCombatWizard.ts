import type { TrackerRound } from "../types/tracker";

export type CombatWizardSide = "party" | "enemy";

export interface CombatWizardEntry {
  side: CombatWizardSide;
  index: number;
  combatantKey: number;
  combatantName: string;
  intention: string;
  result: string;
  targetIndices: number[];
  resolved: boolean;
}

const parseInitiative = (value: string): number => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getEnemyTargetIndices = (round: TrackerRound, enemyIndex: number): number[] =>
  round.party.flatMap((_, partyIndex) => {
    const cell = round.cells[enemyIndex]?.[partyIndex];
    return cell && (cell.enemyToPartyVisible || Boolean(cell.enemyToParty.trim()))
      ? [partyIndex]
      : [];
  });

const getPartyTargetIndices = (round: TrackerRound, partyIndex: number): number[] =>
  round.enemies.flatMap((_, enemyIndex) => {
    const cell = round.cells[enemyIndex]?.[partyIndex];
    return cell && (cell.partyToEnemyVisible || Boolean(cell.partyToEnemy.trim()))
      ? [enemyIndex]
      : [];
  });

export const buildCombatWizardEntries = (
  round: TrackerRound
): CombatWizardEntry[] => {
  const partyFirst =
    parseInitiative(round.partyInitiative) >= parseInitiative(round.enemyInitiative);

  const partyEntries: CombatWizardEntry[] = round.party.map((combatant, index) => ({
    side: "party",
    index,
    combatantKey: combatant.key,
    combatantName: combatant.name || `Party ${index + 1}`,
    intention: round.partyStates[index]?.action || "",
    result: round.partyStates[index]?.result || "",
    targetIndices: getPartyTargetIndices(round, index),
    resolved: Boolean(round.partyStates[index]?.result.trim()),
  }));

  const enemyEntries: CombatWizardEntry[] = round.enemies.map((combatant, index) => ({
    side: "enemy",
    index,
    combatantKey: combatant.key,
    combatantName: combatant.name || `Enemy ${index + 1}`,
    intention: round.enemyStates[index]?.action || "",
    result: round.enemyStates[index]?.result || "",
    targetIndices: getEnemyTargetIndices(round, index),
    resolved: Boolean(round.enemyStates[index]?.result.trim()),
  }));

  return partyFirst
    ? partyEntries.concat(enemyEntries)
    : enemyEntries.concat(partyEntries);
};

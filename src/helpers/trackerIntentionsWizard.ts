import type { TrackerRound } from "../types/tracker";

export type IntentionWizardSide = "party" | "enemy";
export type IntentionWizardVisibilityField =
  | "enemyToPartyVisible"
  | "partyToEnemyVisible";

export interface IntentionWizardTargetOption {
  targetIndex: number;
  targetKey: number;
  targetName: string;
  selected: boolean;
  lockedOpen: boolean;
}

export interface IntentionWizardEntry {
  side: IntentionWizardSide;
  index: number;
  combatantKey: number;
  combatantName: string;
  targetOptions: IntentionWizardTargetOption[];
  intention: string;
}

export interface IntentionWizardVisibilityChange {
  rowIndex: number;
  columnIndex: number;
  field: IntentionWizardVisibilityField;
  value: boolean;
}

export const buildIntentionWizardEntries = (
  round: TrackerRound
): IntentionWizardEntry[] => {
  const enemyEntries: IntentionWizardEntry[] = round.enemies.map(
    (combatant, index) => ({
      side: "enemy",
      index,
      combatantKey: combatant.key,
      combatantName: combatant.name || `Enemy ${index + 1}`,
      targetOptions: round.party.map((targetCombatant, targetIndex) => ({
        targetIndex,
        targetKey: targetCombatant.key,
        targetName: targetCombatant.name || `Party ${targetIndex + 1}`,
        selected:
          round.cells[index]?.[targetIndex]?.enemyToPartyVisible || false,
        lockedOpen: Boolean(round.cells[index]?.[targetIndex]?.enemyToParty.trim()),
      })),
      intention: round.enemyStates[index]?.action || "",
    })
  );
  const partyEntries: IntentionWizardEntry[] = round.party.map(
    (combatant, index) => ({
      side: "party",
      index,
      combatantKey: combatant.key,
      combatantName: combatant.name || `Party ${index + 1}`,
      targetOptions: round.enemies.map((targetCombatant, targetIndex) => ({
        targetIndex,
        targetKey: targetCombatant.key,
        targetName: targetCombatant.name || `Enemy ${targetIndex + 1}`,
        selected:
          round.cells[targetIndex]?.[index]?.partyToEnemyVisible || false,
        lockedOpen: Boolean(round.cells[targetIndex]?.[index]?.partyToEnemy.trim()),
      })),
      intention: round.partyStates[index]?.action || "",
    })
  );

  return enemyEntries.concat(partyEntries);
};

export const replaceIntentionWizardEntry = (
  entries: IntentionWizardEntry[],
  entryIndex: number,
  nextEntry: IntentionWizardEntry
): IntentionWizardEntry[] =>
  entries.map((entry, index) => (index === entryIndex ? nextEntry : entry));

export const toggleIntentionWizardEntryTarget = (
  entry: IntentionWizardEntry,
  targetIndex: number
): {
  nextEntry: IntentionWizardEntry;
  visibilityChange?: IntentionWizardVisibilityChange;
} => {
  const changedTarget = entry.targetOptions.find(
    (targetOption) => targetOption.targetIndex === targetIndex
  );

  if (!changedTarget || changedTarget.lockedOpen) {
    return { nextEntry: entry };
  }

  const nextTargetOptions = entry.targetOptions.map((targetOption) =>
    targetOption.targetIndex === targetIndex
      ? {
          ...targetOption,
          selected: !targetOption.selected,
        }
      : targetOption
  );
  const nextSelected = !changedTarget.selected;

  return {
    nextEntry: {
      ...entry,
      targetOptions: nextTargetOptions,
    },
    visibilityChange: {
      rowIndex: entry.side === "enemy" ? entry.index : targetIndex,
      columnIndex: entry.side === "enemy" ? targetIndex : entry.index,
      field:
        entry.side === "enemy" ? "enemyToPartyVisible" : "partyToEnemyVisible",
      value: nextSelected,
    },
  };
};

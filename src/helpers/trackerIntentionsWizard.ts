import type { TrackerRound } from '../types/tracker';

export type IntentionWizardSide = 'party' | 'enemy';

export interface IntentionWizardEntry {
  side: IntentionWizardSide;
  index: number;
  combatantKey: number;
  combatantName: string;
  intention: string;
}

export const buildIntentionWizardEntries = (
  round: TrackerRound
): IntentionWizardEntry[] => {
  const enemyEntries: IntentionWizardEntry[] = round.enemies.map(
    (combatant, index) => ({
      side: 'enemy',
      index,
      combatantKey: combatant.key,
      combatantName: combatant.name || `Enemy ${index + 1}`,
      intention: round.enemyStates[index]?.action || '',
    })
  );
  const partyEntries: IntentionWizardEntry[] = round.party.map(
    (combatant, index) => ({
      side: 'party',
      index,
      combatantKey: combatant.key,
      combatantName: combatant.name || `Party ${index + 1}`,
      intention: round.partyStates[index]?.action || '',
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

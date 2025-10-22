import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureMiscMagicE5,
  TreasureMiscMagicE5,
} from '../../../tables/dungeon/treasureMiscMagicE5';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const ITEM_LABELS: Record<TreasureMiscMagicE5, string> = {
  [TreasureMiscMagicE5.RobeOfTheArchmagi]: 'Robe of the Archmagi (M)',
  [TreasureMiscMagicE5.RobeOfBlending]: 'Robe of Blending',
  [TreasureMiscMagicE5.RobeOfEyes]: 'Robe of Eyes (M)',
  [TreasureMiscMagicE5.RobeOfPowerlessness]: 'Robe of Powerlessness (M)',
  [TreasureMiscMagicE5.RobeOfScintillatingColors]:
    'Robe of Scintillating Colors (C, M)',
  [TreasureMiscMagicE5.RobeOfUsefulItems]: 'Robe of Useful Items (M)',
  [TreasureMiscMagicE5.RopeOfClimbing]: 'Rope of Climbing',
  [TreasureMiscMagicE5.RopeOfConstriction]: 'Rope of Constriction',
  [TreasureMiscMagicE5.RopeOfEntanglement]: 'Rope of Entanglement',
  [TreasureMiscMagicE5.RugOfSmothering]: 'Rug of Smothering',
  [TreasureMiscMagicE5.RugOfWelcome]: 'Rug of Welcome (M)',
  [TreasureMiscMagicE5.SawOfMightyCutting]: 'Saw of Mighty Cutting (F)',
  [TreasureMiscMagicE5.ScarabOfDeath]: 'Scarab of Death',
  [TreasureMiscMagicE5.ScarabOfEnragingEnemies]: 'Scarab of Enraging Enemies',
  [TreasureMiscMagicE5.ScarabOfInsanity]: 'Scarab of Insanity',
  [TreasureMiscMagicE5.ScarabOfProtection]: 'Scarab of Protection',
  [TreasureMiscMagicE5.SpadeOfColossalExcavation]:
    'Spade of Colossal Excavation (F)',
  [TreasureMiscMagicE5.SphereOfAnnihilation]: 'Sphere of Annihilation (M)',
  [TreasureMiscMagicE5.StoneOfControllingEarthElementals]:
    'Stone of Controlling Earth Elementals',
  [TreasureMiscMagicE5.StoneOfGoodLuckLuckstone]:
    'Stone of Good Luck (Luckstone)',
  [TreasureMiscMagicE5.StoneOfWeightLoadstone]:
    'Stone of Weight (Loadstone)',
  [TreasureMiscMagicE5.TalismanOfPureGood]: 'Talisman of Pure Good (C)',
  [TreasureMiscMagicE5.TalismanOfTheSphere]: 'Talisman of the Sphere (M)',
  [TreasureMiscMagicE5.TalismanOfUltimateEvil]:
    'Talisman of Ultimate Evil (C)',
  [TreasureMiscMagicE5.TalismanOfZagy]: 'Talisman of Zagy',
  [TreasureMiscMagicE5.TomeOfClearThought]: 'Tome of Clear Thought',
  [TreasureMiscMagicE5.TomeOfLeadershipAndInfluence]:
    'Tome of Leadership and Influence',
  [TreasureMiscMagicE5.TomeOfUnderstanding]: 'Tome of Understanding',
  [TreasureMiscMagicE5.TridentOfFishCommand]:
    'Trident of Fish Command (C, F, T)',
  [TreasureMiscMagicE5.TridentOfSubmission]: 'Trident of Submission (F)',
  [TreasureMiscMagicE5.TridentOfWarning]: 'Trident of Warning (C, F, T)',
  [TreasureMiscMagicE5.TridentOfYearning]: 'Trident of Yearning',
  [TreasureMiscMagicE5.VacuousGrimoire]: 'Vacuous Grimoire',
  [TreasureMiscMagicE5.WellOfManyWorlds]: 'Well of Many Worlds',
  [TreasureMiscMagicE5.WingsOfFlying]: 'Wings of Flying',
};

export function renderTreasureMiscMagicE5Detail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE5') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic (Table E.5)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${ITEM_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMiscMagicE5Compact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE5') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMiscMagicE5Preview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Magic (Table E.5)',
    sides: treasureMiscMagicE5.sides,
    entries: treasureMiscMagicE5.entries.map(({ range, command }) => ({
      range,
      label: ITEM_LABELS[command],
    })),
  });

export function miscMagicE5Sentence(result: TreasureMiscMagicE5): string {
  const label = ITEM_LABELS[result];
  return `There is ${articleFor(label)} ${stripUsageTag(label)}.`;
}

function resolvedSentence(result: TreasureMiscMagicE5): string {
  return miscMagicE5Sentence(result);
}

function articleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

function stripUsageTag(label: string): string {
  return label.replace(/\s+\(([A-Z],?\s?)+\)/, '').trim();
}

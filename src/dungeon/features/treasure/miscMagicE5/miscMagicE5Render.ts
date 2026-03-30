import type { DungeonRenderNode } from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { treasureMiscMagicE5, TreasureMiscMagicE5 } from './miscMagicE5Table';
import type { TreasureRobeOfTheArchmagi } from './miscMagicE5Subtables';
import type {
  TreasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurseResolution,
} from './miscMagicE5Subtables';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import {
  robeOfTheArchmagiAlignmentDisplay,
  robeOfTheArchmagiParenthetical,
  scarabOfProtectionParenthetical,
} from './miscMagicE5SubtablesRender';
import {
  renderTreasureParentCompact,
  renderTreasureParentDetail,
} from '../sharedRender';

const ITEM_LABELS: Record<TreasureMiscMagicE5, string> = {
  [TreasureMiscMagicE5.RobeOfTheArchmagi]: 'Robe of the Archmagi',
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
  [TreasureMiscMagicE5.StoneOfWeightLoadstone]: 'Stone of Weight (Loadstone)',
  [TreasureMiscMagicE5.TalismanOfPureGood]: 'Talisman of Pure Good (C)',
  [TreasureMiscMagicE5.TalismanOfTheSphere]: 'Talisman of the Sphere (M)',
  [TreasureMiscMagicE5.TalismanOfUltimateEvil]: 'Talisman of Ultimate Evil (C)',
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
  const robeChild = findChildEvent(outcome, 'treasureRobeOfTheArchmagi');
  const robeAlignment =
    robeChild && robeChild.event.kind === 'treasureRobeOfTheArchmagi'
      ? robeChild.event.result
      : undefined;
  const scarabCurse = findChildEvent(
    outcome,
    'treasureScarabOfProtectionCurse'
  );
  const scarabCurseResult =
    scarabCurse && scarabCurse.event.kind === 'treasureScarabOfProtectionCurse'
      ? scarabCurse.event.result
      : undefined;
  const scarabResolution = scarabCurse
    ? findChildEvent(scarabCurse, 'treasureScarabOfProtectionCurseResolution')
    : undefined;
  const scarabResolutionResult =
    scarabResolution &&
    scarabResolution.event.kind === 'treasureScarabOfProtectionCurseResolution'
      ? scarabResolution.event.result
      : undefined;
  return renderTreasureParentDetail({
    outcome,
    appendPendingPreviews,
    detailHeading: 'Miscellaneous Magic (Table E.5)',
    compactHeading: 'Miscellaneous Magic',
    resultLabel: resolvedLabel(
      outcome.event.result,
      robeAlignment,
      scarabCurseResult,
      scarabResolutionResult
    ),
    text: resolvedSentence(
      outcome.event.result,
      robeAlignment,
      scarabCurseResult,
      scarabResolutionResult
    ),
  });
}

export function renderTreasureMiscMagicE5Compact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE5') return [];
  const robeChild = findChildEvent(outcome, 'treasureRobeOfTheArchmagi');
  const robeAlignment =
    robeChild && robeChild.event.kind === 'treasureRobeOfTheArchmagi'
      ? robeChild.event.result
      : undefined;
  const scarabCurse = findChildEvent(
    outcome,
    'treasureScarabOfProtectionCurse'
  );
  const scarabCurseResult =
    scarabCurse && scarabCurse.event.kind === 'treasureScarabOfProtectionCurse'
      ? scarabCurse.event.result
      : undefined;
  const scarabResolution = scarabCurse
    ? findChildEvent(scarabCurse, 'treasureScarabOfProtectionCurseResolution')
    : undefined;
  const scarabResolutionResult =
    scarabResolution &&
    scarabResolution.event.kind === 'treasureScarabOfProtectionCurseResolution'
      ? scarabResolution.event.result
      : undefined;
  return renderTreasureParentCompact({
    outcome,
    appendPendingPreviews,
    detailHeading: 'Miscellaneous Magic (Table E.5)',
    compactHeading: 'Miscellaneous Magic',
    resultLabel: '',
    text: resolvedSentence(
      outcome.event.result,
      robeAlignment,
      scarabCurseResult,
      scarabResolutionResult
    ),
  });
}

export const buildTreasureMiscMagicE5Preview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Magic (Table E.5)',
    sides: treasureMiscMagicE5.sides,
    entries: treasureMiscMagicE5.entries.map(({ range, command }) => ({
      range,
      label: ITEM_LABELS[command],
    })),
    context,
  });

export function miscMagicE5Sentence(
  result: TreasureMiscMagicE5,
  robeAlignment?: TreasureRobeOfTheArchmagi,
  scarabCurse?: TreasureScarabOfProtectionCurse,
  scarabResolution?: TreasureScarabOfProtectionCurseResolution
): string {
  if (
    result === TreasureMiscMagicE5.RobeOfTheArchmagi &&
    robeAlignment !== undefined
  ) {
    const alignment = robeOfTheArchmagiAlignmentDisplay(robeAlignment);
    const item = ITEM_LABELS[TreasureMiscMagicE5.RobeOfTheArchmagi];
    return `There is a ${item} (${alignment}).`;
  }
  if (result === TreasureMiscMagicE5.ScarabOfProtection) {
    const parenthetical = scarabOfProtectionParenthetical(
      scarabCurse,
      scarabResolution
    );
    if (parenthetical) {
      return `There is a Scarab of Protection (${parenthetical}).`;
    }
    return 'There is a Scarab of Protection.';
  }
  const label = ITEM_LABELS[result];
  return `There is ${articleFor(label)} ${stripUsageTag(label)}.`;
}

function resolvedSentence(
  result: TreasureMiscMagicE5,
  robeAlignment?: TreasureRobeOfTheArchmagi,
  scarabCurse?: TreasureScarabOfProtectionCurse,
  scarabResolution?: TreasureScarabOfProtectionCurseResolution
): string {
  return miscMagicE5Sentence(
    result,
    robeAlignment,
    scarabCurse,
    scarabResolution
  );
}

function articleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

function stripUsageTag(label: string): string {
  return label.replace(/\s+\(([A-Z],?\s?)+\)/, '').trim();
}

function resolvedLabel(
  result: TreasureMiscMagicE5,
  robeAlignment?: TreasureRobeOfTheArchmagi,
  scarabCurse?: TreasureScarabOfProtectionCurse,
  scarabResolution?: TreasureScarabOfProtectionCurseResolution
): string {
  if (result === TreasureMiscMagicE5.RobeOfTheArchmagi) {
    const base = ITEM_LABELS[TreasureMiscMagicE5.RobeOfTheArchmagi];
    if (robeAlignment === undefined) return base;
    return `${base} (${robeOfTheArchmagiParenthetical(robeAlignment)})`;
  }
  if (result === TreasureMiscMagicE5.ScarabOfProtection) {
    const base = ITEM_LABELS[TreasureMiscMagicE5.ScarabOfProtection];
    if (!scarabCurse) return base;
    return `${base} (${scarabOfProtectionParenthetical(
      scarabCurse,
      scarabResolution
    )})`;
  }
  return ITEM_LABELS[result];
}

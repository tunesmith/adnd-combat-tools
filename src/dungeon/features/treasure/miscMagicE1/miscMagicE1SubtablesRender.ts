import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import {
  emphasizeInlineText,
  extractLeadingItemPhrase,
} from '../../../helpers/inlineContent';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  BAG_OF_HOLDING_STATS,
  treasureBagOfHolding,
  TreasureBagOfHolding,
  treasureBagOfTricks,
  TreasureBagOfTricks,
  treasureBracersOfDefense,
  TreasureBracersOfDefense,
  treasureBucknardsEverfullPurse,
  TreasureBucknardsEverfullPurse,
  treasureArtifactOrRelic,
  TreasureArtifactOrRelic,
} from './miscMagicE1Subtables';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

function emphasizedSentence(text: string) {
  return emphasizeInlineText(text, extractLeadingItemPhrase(text));
}

export function renderTreasureBagOfHoldingDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBagOfHolding') return [];
  const stats = BAG_OF_HOLDING_STATS[outcome.event.result];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bag of Holding',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${labelForBagOfHolding(outcome.event.result)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(bagOfHoldingSentence(stats)),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureBagOfHoldingCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBagOfHolding') return [];
  const stats = BAG_OF_HOLDING_STATS[outcome.event.result];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bag of Holding',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(bagOfHoldingSentence(stats)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureBagOfHoldingPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Bag of Holding Capacity',
    sides: treasureBagOfHolding.sides,
    entries: treasureBagOfHolding.entries.map(({ range, command }) => ({
      range,
      label: previewBagOfHoldingLabel(command),
    })),
  });

function labelForBagOfHolding(command: TreasureBagOfHolding): string {
  const labels: Record<TreasureBagOfHolding, string> = {
    [TreasureBagOfHolding.TypeI]: 'Type I',
    [TreasureBagOfHolding.TypeII]: 'Type II',
    [TreasureBagOfHolding.TypeIII]: 'Type III',
    [TreasureBagOfHolding.TypeIV]: 'Type IV',
  };
  return labels[command];
}

export function bagOfHoldingSentence({
  bagWeight,
  weightLimit,
  volumeLimit,
}: {
  bagWeight: number;
  weightLimit: number;
  volumeLimit: number;
}): string {
  return `There is a bag of holding (${volumeLimit} cu. ft., ${weightLimit.toLocaleString()} lb capacity; bag weight ${bagWeight} lb).`;
}

function previewBagOfHoldingLabel(command: TreasureBagOfHolding): string {
  return `${labelForBagOfHolding(command)} (${
    BAG_OF_HOLDING_STATS[command].volumeLimit
  } cu. ft.)`;
}

const BAG_OF_TRICKS_LABELS: Record<TreasureBagOfTricks, string> = {
  [TreasureBagOfTricks.Weasel]: 'Weasel',
  [TreasureBagOfTricks.Rat]: 'Rat',
  [TreasureBagOfTricks.Jackal]: 'Jackal',
};

export function labelForBagOfTricks(result: TreasureBagOfTricks): string {
  return BAG_OF_TRICKS_LABELS[result];
}

export function renderTreasureBagOfTricksDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBagOfTricks') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bag of Tricks',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${labelForBagOfTricks(outcome.event.result)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(bagOfTricksSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureBagOfTricksCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBagOfTricks') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bag of Tricks',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(bagOfTricksSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureBagOfTricksPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Bag of Tricks Contents',
    sides: treasureBagOfTricks.sides,
    entries: treasureBagOfTricks.entries.map(({ range, command }) => ({
      range,
      label: labelForBagOfTricks(command),
    })),
  });

export function bagOfTricksSentence(result: TreasureBagOfTricks): string {
  return `There is a bag of tricks, "${labelForBagOfTricks(result)}".`;
}

const BRACERS_AC_LABELS: Record<TreasureBracersOfDefense, string> = {
  [TreasureBracersOfDefense.AC8]: 'AC8',
  [TreasureBracersOfDefense.AC7]: 'AC7',
  [TreasureBracersOfDefense.AC6]: 'AC6',
  [TreasureBracersOfDefense.AC5]: 'AC5',
  [TreasureBracersOfDefense.AC4]: 'AC4',
  [TreasureBracersOfDefense.AC3]: 'AC3',
  [TreasureBracersOfDefense.AC2]: 'AC2',
};

export function labelForBracersOfDefense(
  result: TreasureBracersOfDefense
): string {
  return `Bracers of Defense ${BRACERS_AC_LABELS[result]}`;
}

export function bracersSentence(result: TreasureBracersOfDefense): string {
  return `There is a pair of bracers of defense ${BRACERS_AC_LABELS[
    result
  ].toUpperCase()}.`;
}

export function renderTreasureBracersOfDefenseDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBracersOfDefense') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bracers of Defense',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${labelForBracersOfDefense(
        outcome.event.result
      )}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(bracersSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureBracersOfDefenseCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBracersOfDefense') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bracers of Defense',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(bracersSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureBracersOfDefensePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Bracers of Defense Armor Class',
    sides: treasureBracersOfDefense.sides,
    entries: treasureBracersOfDefense.entries.map(({ range, command }) => ({
      range,
      label: labelForBracersOfDefense(command),
    })),
  });

const PURSE_LABELS: Record<TreasureBucknardsEverfullPurse, string> = {
  [TreasureBucknardsEverfullPurse.Gold]: "Bucknard's Everfull Purse of Gold",
  [TreasureBucknardsEverfullPurse.Platinum]:
    "Bucknard's Everfull Purse of Platinum",
  [TreasureBucknardsEverfullPurse.Gems]: "Bucknard's Everfull Purse of Gems",
};

export function labelForBucknardsEverfullPurse(
  result: TreasureBucknardsEverfullPurse
): string {
  return PURSE_LABELS[result];
}

export function purseSentence(result: TreasureBucknardsEverfullPurse): string {
  return `${labelForBucknardsEverfullPurse(result)} is here.`;
}

export function renderTreasureBucknardsEverfullPurseDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBucknardsEverfullPurse') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: "Bucknard's Everfull Purse",
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${labelForBucknardsEverfullPurse(
        outcome.event.result
      )}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(purseSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureBucknardsEverfullPurseCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBucknardsEverfullPurse') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: "Bucknard's Everfull Purse",
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(purseSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureBucknardsEverfullPursePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: "Bucknard's Everfull Purse Contents",
    sides: treasureBucknardsEverfullPurse.sides,
    entries: treasureBucknardsEverfullPurse.entries.map(
      ({ range, command }) => ({
        range,
        label: labelForBucknardsEverfullPurse(command),
      })
    ),
  });

const ARTIFACT_LABELS: Record<TreasureArtifactOrRelic, string> = {
  [TreasureArtifactOrRelic.AxeOfTheDwarvishLords]: 'Axe of the Dwarvish Lords',
  [TreasureArtifactOrRelic.BabaYagasHut]: "Baba Yaga's Hut",
  [TreasureArtifactOrRelic.CodexOfTheInfinitePlanes]:
    'Codex of the Infinite Planes',
  [TreasureArtifactOrRelic.CrownOfMight]: 'Crown of Might',
  [TreasureArtifactOrRelic.CrystalOfTheEbonFlame]: 'Crystal of the Ebon Flame',
  [TreasureArtifactOrRelic.CupAndTalismanOfAlAkbar]:
    "Cup and Talisman of Al'Akbar",
  [TreasureArtifactOrRelic.EyeOfVecna]: 'Eye of Vecna',
  [TreasureArtifactOrRelic.HandOfVecna]: 'Hand of Vecna',
  [TreasureArtifactOrRelic.HewardsMysticalOrgan]: "Heward's Mystical Organ",
  [TreasureArtifactOrRelic.HornOfChange]: 'Horn of Change',
  [TreasureArtifactOrRelic.InvulnerableCoatOfArnd]: 'Invulnerable Coat of Arnd',
  [TreasureArtifactOrRelic.IronFlaskOfTuernyTheMerciless]:
    'Iron Flask of Tuerny the Merciless',
  [TreasureArtifactOrRelic.JacinthOfInestimableBeauty]:
    'Jacinth of Inestimable Beauty',
  [TreasureArtifactOrRelic.JohydeesMask]: "Johydee's Mask",
  [TreasureArtifactOrRelic.KurothsQuill]: "Kuroth's Quill",
  [TreasureArtifactOrRelic.MaceOfCuthbert]: 'Mace of Cuthbert',
  [TreasureArtifactOrRelic.MachineOfLumTheMad]: 'Machine of Lum the Mad',
  [TreasureArtifactOrRelic.MightyServantOfLeukO]: 'Mighty Servant of Leuk-O',
  [TreasureArtifactOrRelic.OrbOfTheDragonkind]: 'Orb of the Dragonkind',
  [TreasureArtifactOrRelic.OrbOfMight]: 'Orb of Might',
  [TreasureArtifactOrRelic.QueenEhlissasMarvelousNightingale]:
    "Queen Ehlissa's Marvelous Nightingale",
  [TreasureArtifactOrRelic.RecorderOfYeCind]: "Recorder of Ye'Cind",
  [TreasureArtifactOrRelic.RingOfGaxx]: 'Ring of Gaxx',
  [TreasureArtifactOrRelic.RodOfSevenParts]: 'Rod of Seven Parts',
  [TreasureArtifactOrRelic.SceptreOfMight]: 'Sceptre of Might',
  [TreasureArtifactOrRelic.SwordOfKas]: 'Sword of Kas',
  [TreasureArtifactOrRelic.TeethOfDahlverNar]: 'Teeth of Dahlver-Nar',
  [TreasureArtifactOrRelic.ThroneOfTheGods]: 'Throne of the Gods',
  [TreasureArtifactOrRelic.WandOfOrcus]: 'Wand of Orcus',
};

export function labelForArtifact(result: TreasureArtifactOrRelic): string {
  return ARTIFACT_LABELS[result];
}

export function artifactSentence(result: TreasureArtifactOrRelic): string {
  return `There is ${articleForArtifact(result)} ${labelForArtifact(result)}.`;
}

export function renderTreasureArtifactOrRelicDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureArtifactOrRelic') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Artifact or Relic',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${labelForArtifact(outcome.event.result)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(artifactSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureArtifactOrRelicCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureArtifactOrRelic') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Artifact or Relic',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(artifactSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureArtifactOrRelicPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Artifact or Relic',
    sides: treasureArtifactOrRelic.sides,
    entries: treasureArtifactOrRelic.entries.map(({ range, command }) => ({
      range,
      label: labelForArtifact(command),
    })),
  });

function articleForArtifact(result: TreasureArtifactOrRelic): string {
  const label = ARTIFACT_LABELS[result];
  const first = label[0]?.toLowerCase() ?? 'a';
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

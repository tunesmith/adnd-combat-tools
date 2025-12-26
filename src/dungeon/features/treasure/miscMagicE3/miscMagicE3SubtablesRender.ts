import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type {
  OutcomeEventNode,
  TreasureIounStonesResult,
} from '../../../domain/outcome';
import type {
  IounStonesSummary,
  IounStoneListEntry,
} from '../../../../types/dungeon';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import {
  treasureFigurineMarbleElephant,
  TreasureFigurineMarbleElephant,
  treasureFigurineOfWondrousPower,
  TreasureFigurineOfWondrousPower,
  treasureGirdleOfGiantStrength,
  TreasureGirdleOfGiantStrength,
  treasureHornOfValhallaAlignment,
  TreasureHornOfValhallaAlignment,
  treasureHornOfValhallaAttunement,
  TreasureHornOfValhallaAttunement,
  treasureHornOfValhallaType,
  TreasureHornOfValhallaType,
  treasureInstrumentOfTheBards,
  TreasureInstrumentOfTheBards,
  treasureIronFlask,
  TreasureIronFlaskContent,
} from './miscMagicE3Subtables';

const FIGURINE_LABELS: Record<TreasureFigurineOfWondrousPower, string> = {
  [TreasureFigurineOfWondrousPower.EbonyFly]: 'an ebony fly',
  [TreasureFigurineOfWondrousPower.GoldenLions]: 'a pair of golden lions',
  [TreasureFigurineOfWondrousPower.IvoryGoats]: 'a trio of ivory goats',
  [TreasureFigurineOfWondrousPower.MarbleElephant]: 'a marble elephant',
  [TreasureFigurineOfWondrousPower.ObsidianSteed]: 'an obsidian steed',
  [TreasureFigurineOfWondrousPower.OnyxDog]: 'an onyx dog',
  [TreasureFigurineOfWondrousPower.SerpentineOwl]: 'a serpentine owl',
};

export function renderTreasureFigurineOfWondrousPowerDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildFigurineNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureFigurineOfWondrousPowerCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildFigurineNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureFigurineOfWondrousPowerPreview: TablePreviewFactory =
  (tableId) =>
    buildPreview(tableId, {
      title: 'Figurine of Wondrous Power',
      sides: treasureFigurineOfWondrousPower.sides,
      entries: treasureFigurineOfWondrousPower.entries.map(
        ({ range, command }) => ({
          range,
          label: figurinePreviewLabel(command),
        })
      ),
    });

export function figurineSentence(
  result: TreasureFigurineOfWondrousPower,
  marbleChild?: OutcomeEventNode
): string {
  if (
    result === TreasureFigurineOfWondrousPower.MarbleElephant &&
    marbleChild &&
    marbleChild.event.kind === 'treasureFigurineMarbleElephant'
  ) {
    const variant = marbleElephantVariantName(marbleChild.event.result);
    return `There is a Figurine of Wondrous Power. The Figurine is a marble elephant (${variant}).`;
  }
  const label = FIGURINE_LABELS[result];
  return `There is a Figurine of Wondrous Power. The Figurine is ${label}.`;
}

function buildFigurineNodes(outcome: OutcomeEventNode): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureFigurineOfWondrousPower') return [];
  const marbleChild = findChildEvent(outcome, 'treasureFigurineMarbleElephant');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Figurine of Wondrous Power',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${figurinePreviewLabel(outcome.event.result)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: figurineSentence(outcome.event.result, marbleChild),
  };
  return [heading, bullet, paragraph];
}

function figurinePreviewLabel(result: TreasureFigurineOfWondrousPower): string {
  if (result === TreasureFigurineOfWondrousPower.MarbleElephant) {
    return 'Marble Elephant';
  }
  const label = FIGURINE_LABELS[result];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const MARBLE_ELEPHANT_LABELS: Record<TreasureFigurineMarbleElephant, string> = {
  [TreasureFigurineMarbleElephant.Asiatic]: 'Asiatic elephant',
  [TreasureFigurineMarbleElephant.African]: 'African loxodont elephant',
  [TreasureFigurineMarbleElephant.PrehistoricMammoth]: 'prehistoric mammoth',
  [TreasureFigurineMarbleElephant.PrehistoricMastodon]: 'prehistoric mastodon',
};

const MARBLE_ELEPHANT_VARIANT_NAMES: Record<
  TreasureFigurineMarbleElephant,
  string
> = {
  [TreasureFigurineMarbleElephant.Asiatic]: 'Asiatic Elephant',
  [TreasureFigurineMarbleElephant.African]: 'African Loxodont',
  [TreasureFigurineMarbleElephant.PrehistoricMammoth]: 'Prehistoric (Mammoth)',
  [TreasureFigurineMarbleElephant.PrehistoricMastodon]:
    'Prehistoric (Mastodon)',
};

export function renderTreasureFigurineMarbleElephantDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureFigurineMarbleElephant') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Marble Elephant Form',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${marbleElephantLabel(outcome.event.result)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: marbleElephantSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureFigurineMarbleElephantCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureFigurineMarbleElephant') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Marble Elephant Form',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: marbleElephantSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureFigurineMarbleElephantPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Marble Elephant Form',
    sides: treasureFigurineMarbleElephant.sides,
    entries: treasureFigurineMarbleElephant.entries.map(
      ({ range, command }) => ({
        range,
        label: marbleElephantLabel(command),
      })
    ),
  });

export function marbleElephantSentence(
  result: TreasureFigurineMarbleElephant
): string {
  const label = marbleElephantLabel(result);
  return `The marble elephant takes the form of ${withArticle(label)}.`;
}

export function marbleElephantVariantName(
  result: TreasureFigurineMarbleElephant
): string {
  return MARBLE_ELEPHANT_VARIANT_NAMES[result];
}

function marbleElephantLabel(result: TreasureFigurineMarbleElephant): string {
  return MARBLE_ELEPHANT_LABELS[result];
}

function withArticle(label: string): string {
  const trimmed = label.trim();
  const first = trimmed.charAt(0).toLowerCase();
  const article = 'aeiou'.includes(first) ? 'an' : 'a';
  return `${article} ${trimmed}`;
}

const GIANT_STRENGTH_LABELS: Record<TreasureGirdleOfGiantStrength, string> = {
  [TreasureGirdleOfGiantStrength.Hill]: 'Hill Giant Strength',
  [TreasureGirdleOfGiantStrength.Stone]: 'Stone Giant Strength',
  [TreasureGirdleOfGiantStrength.Frost]: 'Frost Giant Strength',
  [TreasureGirdleOfGiantStrength.Fire]: 'Fire Giant Strength',
  [TreasureGirdleOfGiantStrength.Cloud]: 'Cloud Giant Strength',
  [TreasureGirdleOfGiantStrength.Storm]: 'Storm Giant Strength',
};

export function renderTreasureGirdleOfGiantStrengthDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureGirdleOfGiantStrength') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Girdle of Giant Strength',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${GIANT_STRENGTH_LABELS[outcome.event.result]}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: girdleSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureGirdleOfGiantStrengthCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureGirdleOfGiantStrength') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Girdle of Giant Strength',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: girdleSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureGirdleOfGiantStrengthPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Girdle of Giant Strength',
    sides: treasureGirdleOfGiantStrength.sides,
    entries: treasureGirdleOfGiantStrength.entries.map(
      ({ range, command }) => ({
        range,
        label: GIANT_STRENGTH_LABELS[command],
      })
    ),
  });

export function girdleSentence(result: TreasureGirdleOfGiantStrength): string {
  return `There is a Girdle of ${GIANT_STRENGTH_LABELS[result]} (C, F, T).`;
}

const INSTRUMENT_LABELS: Record<TreasureInstrumentOfTheBards, string> = {
  [TreasureInstrumentOfTheBards.FochlucanBandore]: 'Fochlucan Bandore',
  [TreasureInstrumentOfTheBards.MacFuirmidhCittern]: 'Mac-Fuirmidh Cittern',
  [TreasureInstrumentOfTheBards.DossLute]: 'Doss Lute',
  [TreasureInstrumentOfTheBards.CanaithMandolin]: 'Canaith Mandolin',
  [TreasureInstrumentOfTheBards.CliLyre]: 'Cli Lyre',
  [TreasureInstrumentOfTheBards.AnstruthHarp]: 'Anstruth Harp',
  [TreasureInstrumentOfTheBards.OllamhHarp]: 'Ollamh Harp',
};

export function renderTreasureInstrumentOfTheBardsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureInstrumentOfTheBards') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Instrument of the Bards',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${INSTRUMENT_LABELS[outcome.event.result]}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: instrumentOfTheBardsSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureInstrumentOfTheBardsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureInstrumentOfTheBards') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Instrument of the Bards',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: instrumentOfTheBardsSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureInstrumentOfTheBardsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Instrument of the Bards',
    sides: treasureInstrumentOfTheBards.sides,
    entries: treasureInstrumentOfTheBards.entries.map(({ range, command }) => ({
      range,
      label: INSTRUMENT_LABELS[command],
    })),
  });

export function instrumentOfTheBardsSentence(
  result: TreasureInstrumentOfTheBards
): string {
  return `There is an Instrument of the Bards: ${INSTRUMENT_LABELS[result]}.`;
}

const IRON_FLASK_LABELS: Record<TreasureIronFlaskContent, string> = {
  [TreasureIronFlaskContent.Empty]: 'Empty',
  [TreasureIronFlaskContent.AirElemental]: 'Air Elemental',
  [TreasureIronFlaskContent.DemonTypeIToIII]: 'Demon (type I–III)',
  [TreasureIronFlaskContent.DemonTypeIVToVI]: 'Demon (type IV–VI)',
  [TreasureIronFlaskContent.DevilLesser]: 'Devil (lesser)',
  [TreasureIronFlaskContent.DevilGreater]: 'Devil (greater)',
  [TreasureIronFlaskContent.Djinni]: 'Djinni',
  [TreasureIronFlaskContent.EarthElemental]: 'Earth Elemental',
  [TreasureIronFlaskContent.Efreeti]: 'Efreeti',
  [TreasureIronFlaskContent.FireElemental]: 'Fire Elemental',
  [TreasureIronFlaskContent.InvisibleStalker]: 'Invisible Stalker',
  [TreasureIronFlaskContent.Mezzodaemon]: 'Mezzodaemon',
  [TreasureIronFlaskContent.NightHag]: 'Night Hag',
  [TreasureIronFlaskContent.Nycadaemon]: 'Nycadaemon',
  [TreasureIronFlaskContent.Rakshasa]: 'Rakshasa',
  [TreasureIronFlaskContent.Salamander]: 'Salamander',
  [TreasureIronFlaskContent.WaterElemental]: 'Water Elemental',
  [TreasureIronFlaskContent.WindWalker]: 'Wind Walker',
  [TreasureIronFlaskContent.Xorn]: 'Xorn',
};

export function renderTreasureIronFlaskDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureIronFlask') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Iron Flask',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${IRON_FLASK_LABELS[outcome.event.result]}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: ironFlaskSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureIronFlaskCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureIronFlask') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Iron Flask',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: ironFlaskSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureIronFlaskPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Iron Flask Contents',
    sides: treasureIronFlask.sides,
    entries: treasureIronFlask.entries.map(({ range, command }) => ({
      range,
      label: IRON_FLASK_LABELS[command],
    })),
  });

export function ironFlaskSentence(result: TreasureIronFlaskContent): string {
  if (result === TreasureIronFlaskContent.Empty) {
    return 'There is an Iron Flask (empty).';
  }
  const label = IRON_FLASK_LABELS[result];
  const article = ironFlaskArticleFor(label);
  return `There is an Iron Flask. It contains ${article} ${label}.`;
}

function ironFlaskArticleFor(label: string): 'a' | 'an' {
  const firstChar = label.trim().charAt(0).toLowerCase();
  if ('aeiou'.includes(firstChar)) return 'an';
  if (label.toLowerCase().startsWith('invisible')) return 'an';
  return 'a';
}

export function renderTreasureIounStonesDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureIounStones') return [];
  const summary = toIounStonesSummary(outcome.event.result);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Ioun Stones',
  };
  const rollInfo: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${summary.count} stone${
        summary.count === 1 ? '' : 's'
      }`,
    ],
  };
  const detailMessage: DungeonMessage = {
    kind: 'ioun-stones',
    summary,
    display: 'detail',
  };
  const nodes: DungeonRenderNode[] = [heading, rollInfo, detailMessage];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureIounStonesCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureIounStones') return [];
  const summary = toIounStonesSummary(outcome.event.result);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Ioun Stones',
  };
  const rollInfo: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${summary.count} stone${
        summary.count === 1 ? '' : 's'
      }`,
    ],
  };
  const compactMessage: DungeonMessage = {
    kind: 'ioun-stones',
    summary,
    display: 'compact',
  };
  const nodes: DungeonRenderNode[] = [heading, rollInfo, compactMessage];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function toIounStonesSummary(
  result: TreasureIounStonesResult
): IounStonesSummary {
  return {
    count: result.stones.length,
    countRoll: result.countRoll,
    stones: result.stones.map((stone) => ({
      index: stone.index,
      color: stone.color,
      shape: stone.shape,
      effect: stone.effect,
      status: stone.status,
      duplicateOf: stone.duplicateOf,
    })) as IounStoneListEntry[],
  };
}

function iounStoneBaseText(stone: IounStoneListEntry): string {
  const color = stone.color.trim();
  const shape = stone.shape.trim();
  if (shape.length > 0 && shape.toLowerCase() === 'any') {
    return color;
  }
  if (color.length === 0) return shape;
  if (shape.length === 0) return color;
  return `${color} ${shape}`.replace(/\\s+/g, ' ').trim();
}

function iounStoneStatusText(stone: IounStoneListEntry): string {
  if (stone.status === 'duplicate') {
    if (stone.duplicateOf !== undefined) {
      return `duplicate of stone ${stone.duplicateOf}, burned out`;
    }
    return 'duplicate, burned out';
  }
  if (stone.status === 'dead') {
    return 'burned out ("dead" stone)';
  }
  return stone.effect.trim();
}

export function iounStoneCompactLine(stone: IounStoneListEntry): string {
  const base = iounStoneBaseText(stone);
  const descriptor = iounStoneStatusText(stone);
  const prefix =
    base.length > 0 ? `Stone ${stone.index}: ${base}` : `Stone ${stone.index}`;
  return `${prefix} — ${descriptor}`.trim();
}

export function iounStonesCompactSentence(summary: IounStonesSummary): string {
  if (summary.count === 0) {
    return 'There are no ioun stones.';
  }
  const parts = summary.stones.map(iounStoneCompactLine);
  const detail = parts.join('; ');
  if (summary.count === 1) {
    return `There is 1 ioun stone: ${detail}.`;
  }
  return `There are ioun stones (${summary.count}): ${detail}.`;
}

const HORN_TYPE_LABELS: Record<TreasureHornOfValhallaType, string> = {
  [TreasureHornOfValhallaType.Silver]: 'Silver Horn of Valhalla',
  [TreasureHornOfValhallaType.Brass]: 'Brass Horn of Valhalla',
  [TreasureHornOfValhallaType.Bronze]: 'Bronze Horn of Valhalla',
  [TreasureHornOfValhallaType.Iron]: 'Iron Horn of Valhalla',
};

const HORN_ALIGNMENT_LABELS: Record<TreasureHornOfValhallaAlignment, string> = {
  [TreasureHornOfValhallaAlignment.LawfulGood]: 'lawful good',
  [TreasureHornOfValhallaAlignment.LawfulNeutral]: 'lawful neutral',
  [TreasureHornOfValhallaAlignment.LawfulEvil]: 'lawful evil',
  [TreasureHornOfValhallaAlignment.NeutralEvil]: 'neutral evil',
  [TreasureHornOfValhallaAlignment.ChaoticEvil]: 'chaotic evil',
  [TreasureHornOfValhallaAlignment.ChaoticNeutral]: 'chaotic neutral',
  [TreasureHornOfValhallaAlignment.ChaoticGood]: 'chaotic good',
  [TreasureHornOfValhallaAlignment.NeutralGood]: 'neutral good',
  [TreasureHornOfValhallaAlignment.Neutral]: 'neutral',
};

export function renderTreasureHornOfValhallaTypeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureHornOfValhallaType') return [];
  const attunement = findChildEvent(
    outcome,
    'treasureHornOfValhallaAttunement'
  );
  const alignment =
    attunement && attunement.event.kind === 'treasureHornOfValhallaAttunement'
      ? findChildEvent(attunement, 'treasureHornOfValhallaAlignment')
      : undefined;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Horn Type',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${HORN_TYPE_LABELS[outcome.event.result]}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: hornSentence({
      type: outcome.event.result,
      attunement:
        attunement?.event.kind === 'treasureHornOfValhallaAttunement'
          ? attunement.event.result
          : undefined,
      alignment:
        alignment?.event.kind === 'treasureHornOfValhallaAlignment'
          ? alignment.event.result
          : undefined,
    }),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureHornOfValhallaTypeCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureHornOfValhallaType') return [];
  const attunement = findChildEvent(
    outcome,
    'treasureHornOfValhallaAttunement'
  );
  const alignment =
    attunement && attunement.event.kind === 'treasureHornOfValhallaAttunement'
      ? findChildEvent(attunement, 'treasureHornOfValhallaAlignment')
      : undefined;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Horn Type',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: hornSentence({
      type: outcome.event.result,
      attunement:
        attunement?.event.kind === 'treasureHornOfValhallaAttunement'
          ? attunement.event.result
          : undefined,
      alignment:
        alignment?.event.kind === 'treasureHornOfValhallaAlignment'
          ? alignment.event.result
          : undefined,
    }),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureHornOfValhallaAttunementDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureHornOfValhallaAttunement') return [];
  const alignment = findChildEvent(outcome, 'treasureHornOfValhallaAlignment');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Horn Attunement',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${hornAttunementLabel(outcome.event.result)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: attunementSentence({
      attunement: outcome.event.result,
      alignment:
        alignment?.event.kind === 'treasureHornOfValhallaAlignment'
          ? alignment.event.result
          : undefined,
    }),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureHornOfValhallaAttunementCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureHornOfValhallaAttunement') return [];
  const alignment = findChildEvent(outcome, 'treasureHornOfValhallaAlignment');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Horn Attunement',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: attunementSentence({
      attunement: outcome.event.result,
      alignment:
        alignment?.event.kind === 'treasureHornOfValhallaAlignment'
          ? alignment.event.result
          : undefined,
    }),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureHornOfValhallaAlignmentDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureHornOfValhallaAlignment') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Horn Alignment',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${hornAlignmentLabel(outcome.event.result)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: alignmentSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureHornOfValhallaAlignmentCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureHornOfValhallaAlignment') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Horn Alignment',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: alignmentSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureHornOfValhallaTypePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Horn Type',
    sides: treasureHornOfValhallaType.sides,
    entries: treasureHornOfValhallaType.entries.map(({ range, command }) => ({
      range,
      label: HORN_TYPE_LABELS[command],
    })),
  });

export const buildTreasureHornOfValhallaAttunementPreview: TablePreviewFactory =
  (tableId) =>
    buildPreview(tableId, {
      title: 'Horn Attunement',
      sides: treasureHornOfValhallaAttunement.sides,
      entries: treasureHornOfValhallaAttunement.entries.map(
        ({ range, command }) => ({
          range,
          label: hornAttunementLabel(command),
        })
      ),
    });

export const buildTreasureHornOfValhallaAlignmentPreview: TablePreviewFactory =
  (tableId) =>
    buildPreview(tableId, {
      title: 'Horn Alignment',
      sides: treasureHornOfValhallaAlignment.sides,
      entries: treasureHornOfValhallaAlignment.entries.map(
        ({ range, command }) => ({
          range,
          label: hornAlignmentLabel(command),
        })
      ),
    });

export function hornSentence({
  type,
  attunement,
  alignment,
}: {
  type?: TreasureHornOfValhallaType;
  attunement?: TreasureHornOfValhallaAttunement;
  alignment?: TreasureHornOfValhallaAlignment;
}): string {
  if (type === undefined) return 'There is a Horn of Valhalla.';
  const typeLabel = HORN_TYPE_LABELS[type];
  const article = hornArticleFor(typeLabel);
  if (attunement === undefined) {
    return `There is ${article} ${typeLabel}.`;
  }
  if (attunement === TreasureHornOfValhallaAttunement.NonAligned) {
    return `There is ${article} ${typeLabel} (non-aligned).`;
  }
  if (alignment === undefined) {
    return `There is ${article} ${typeLabel} (aligned).`;
  }
  return `There is ${article} ${typeLabel} (${hornAlignmentLabel(alignment)}).`;
}

export function attunementSentence({
  attunement,
  alignment,
}: {
  attunement: TreasureHornOfValhallaAttunement;
  alignment?: TreasureHornOfValhallaAlignment;
}): string {
  if (attunement === TreasureHornOfValhallaAttunement.NonAligned) {
    return 'The horn is non-aligned.';
  }
  if (alignment === undefined) {
    return 'The horn is aligned. Roll alignment below to learn its allegiance.';
  }
  return `The horn is aligned ${hornAlignmentLabel(alignment)}.`;
}

export function alignmentSentence(
  alignment: TreasureHornOfValhallaAlignment
): string {
  return `The horn is ${hornAlignmentLabel(alignment)}.`;
}

function hornAttunementLabel(
  attunement: TreasureHornOfValhallaAttunement
): string {
  return attunement === TreasureHornOfValhallaAttunement.NonAligned
    ? 'Non-aligned'
    : 'Aligned';
}

function hornAlignmentLabel(
  alignment: TreasureHornOfValhallaAlignment
): string {
  return HORN_ALIGNMENT_LABELS[alignment];
}

function hornArticleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

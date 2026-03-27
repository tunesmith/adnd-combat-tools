import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { treasureMiscMagicE3, TreasureMiscMagicE3 } from './miscMagicE3Table';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import {
  figurineSentence,
  girdleSentence,
  hornSentence,
  instrumentOfTheBardsSentence,
  ironFlaskSentence,
  toIounStonesSummary,
} from './miscMagicE3SubtablesRender';

const ITEM_LABELS: Record<TreasureMiscMagicE3, string> = {
  [TreasureMiscMagicE3.FigurineOfWondrousPower]: 'Figurine of Wondrous Power',
  [TreasureMiscMagicE3.FlaskOfCurses]: 'Flask of Curses',
  [TreasureMiscMagicE3.GauntletsOfDexterity]: 'Gauntlets of Dexterity',
  [TreasureMiscMagicE3.GauntletsOfFumbling]: 'Gauntlets of Fumbling',
  [TreasureMiscMagicE3.GauntletsOfOgrePower]: 'Gauntlets of Ogre Power',
  [TreasureMiscMagicE3.GauntletsOfSwimmingAndClimbing]:
    'Gauntlets of Swimming and Climbing (C, F, T)',
  [TreasureMiscMagicE3.GemOfBrightness]: 'Gem of Brightness',
  [TreasureMiscMagicE3.GemOfSeeing]: 'Gem of Seeing',
  [TreasureMiscMagicE3.GirdleOfFemininityMasculinity]:
    'Girdle of Femininity/Masculinity (C, F, T)',
  [TreasureMiscMagicE3.GirdleOfGiantStrength]:
    'Girdle of Giant Strength (C, F, T)',
  [TreasureMiscMagicE3.HelmOfBrilliance]: 'Helm of Brilliance',
  [TreasureMiscMagicE3.HelmOfComprehendingLanguagesAndReadingMagic]:
    'Helm of Comprehending Languages & Reading Magic',
  [TreasureMiscMagicE3.HelmOfOppositeAlignment]: 'Helm of Opposite Alignment',
  [TreasureMiscMagicE3.HelmOfTelepathy]: 'Helm of Telepathy',
  [TreasureMiscMagicE3.HelmOfTeleportation]: 'Helm of Teleportation',
  [TreasureMiscMagicE3.HelmOfUnderwaterAction]: 'Helm of Underwater Action',
  [TreasureMiscMagicE3.HornOfBlasting]: 'Horn of Blasting',
  [TreasureMiscMagicE3.HornOfBubbles]: 'Horn of Bubbles',
  [TreasureMiscMagicE3.HornOfCollapsing]: 'Horn of Collapsing',
  [TreasureMiscMagicE3.HornOfTheTritons]: 'Horn of the Tritons (C, F)',
  [TreasureMiscMagicE3.HornOfValhalla]: 'Horn of Valhalla',
  [TreasureMiscMagicE3.HorseshoesOfSpeed]: 'Horseshoes of Speed',
  [TreasureMiscMagicE3.HorseshoesOfAZephyr]: 'Horseshoes of a Zephyr',
  [TreasureMiscMagicE3.IncenseOfMeditation]: 'Incense of Meditation (C)',
  [TreasureMiscMagicE3.IncenseOfObsession]: 'Incense of Obsession (C)',
  [TreasureMiscMagicE3.IounStones]: 'Ioun Stones',
  [TreasureMiscMagicE3.InstrumentOfTheBards]: 'Instrument of the Bards',
  [TreasureMiscMagicE3.IronFlask]: 'Iron Flask',
  [TreasureMiscMagicE3.JavelinOfLightning]: 'Javelin of Lightning (F)',
  [TreasureMiscMagicE3.JavelinOfPiercing]: 'Javelin of Piercing (F)',
  [TreasureMiscMagicE3.JewelOfAttacks]: 'Jewel of Attacks',
  [TreasureMiscMagicE3.JewelOfFlawlessness]: 'Jewel of Flawlessness',
  [TreasureMiscMagicE3.KeoghtomsOintment]: "Keoghtom's Ointment",
};

export function renderTreasureMiscMagicE3Detail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE3') return [];
  const figurineChild = findChildEvent(
    outcome,
    'treasureFigurineOfWondrousPower'
  );
  const girdleChild = findChildEvent(outcome, 'treasureGirdleOfGiantStrength');
  const hornTypeChild = findChildEvent(outcome, 'treasureHornOfValhallaType');
  const instrumentChild = findChildEvent(
    outcome,
    'treasureInstrumentOfTheBards'
  );
  const ironFlaskChild = findChildEvent(outcome, 'treasureIronFlask');
  const iounChild = findChildEvent(outcome, 'treasureIounStones');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic (Table E.3)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${ITEM_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(
      outcome.event.result,
      outcome.event.ointmentJars,
      figurineChild,
      girdleChild,
      hornTypeChild,
      instrumentChild,
      ironFlaskChild,
      iounChild
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMiscMagicE3Compact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE3') return [];
  const figurineChild = findChildEvent(
    outcome,
    'treasureFigurineOfWondrousPower'
  );
  const girdleChild = findChildEvent(outcome, 'treasureGirdleOfGiantStrength');
  const hornTypeChild = findChildEvent(outcome, 'treasureHornOfValhallaType');
  const instrumentChild = findChildEvent(
    outcome,
    'treasureInstrumentOfTheBards'
  );
  const ironFlaskChild = findChildEvent(outcome, 'treasureIronFlask');
  const iounChild = findChildEvent(outcome, 'treasureIounStones');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(
      outcome.event.result,
      outcome.event.ointmentJars,
      figurineChild,
      girdleChild,
      hornTypeChild,
      instrumentChild,
      ironFlaskChild,
      iounChild
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  if (iounChild && iounChild.event.kind === 'treasureIounStones') {
    nodes.push({
      kind: 'ioun-stones',
      summary: toIounStonesSummary(iounChild.event.result),
      display: 'compact',
    });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMiscMagicE3Preview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Magic (Table E.3)',
    sides: treasureMiscMagicE3.sides,
    entries: treasureMiscMagicE3.entries.map(({ range, command }) => ({
      range,
      label: ITEM_LABELS[command],
    })),
    context,
  });

export function miscMagicE3Sentence(
  result: TreasureMiscMagicE3,
  ointmentJars?: number
): string {
  if (
    result === TreasureMiscMagicE3.KeoghtomsOintment &&
    typeof ointmentJars === 'number'
  ) {
    return `There ${
      ointmentJars === 1 ? 'is 1 jar' : `are ${ointmentJars} jars`
    } of Keoghtom's Ointment.`;
  }
  const label = ITEM_LABELS[result];
  const normalized = stripUsageTag(label);
  if (normalized.toLowerCase() === 'ioun stones') {
    return 'There are ioun stones awaiting identification.';
  }
  return `There is ${articleFor(normalized)} ${normalized}.`;
}

function resolvedSentence(
  result: TreasureMiscMagicE3,
  ointmentJars?: number,
  figurineChild?: OutcomeEventNode,
  girdleChild?: OutcomeEventNode,
  hornTypeChild?: OutcomeEventNode,
  instrumentChild?: OutcomeEventNode,
  ironFlaskChild?: OutcomeEventNode,
  iounChild?: OutcomeEventNode
): string {
  if (
    result === TreasureMiscMagicE3.FigurineOfWondrousPower &&
    figurineChild &&
    figurineChild.event.kind === 'treasureFigurineOfWondrousPower'
  ) {
    const marbleChild = findChildEvent(
      figurineChild,
      'treasureFigurineMarbleElephant'
    );
    return figurineSentence(figurineChild.event.result, marbleChild);
  }
  if (
    result === TreasureMiscMagicE3.GirdleOfGiantStrength &&
    girdleChild &&
    girdleChild.event.kind === 'treasureGirdleOfGiantStrength'
  ) {
    return girdleSentence(girdleChild.event.result);
  }
  if (
    result === TreasureMiscMagicE3.InstrumentOfTheBards &&
    instrumentChild &&
    instrumentChild.event.kind === 'treasureInstrumentOfTheBards'
  ) {
    return instrumentOfTheBardsSentence(instrumentChild.event.result);
  }
  if (
    result === TreasureMiscMagicE3.IronFlask &&
    ironFlaskChild &&
    ironFlaskChild.event.kind === 'treasureIronFlask'
  ) {
    return ironFlaskSentence(ironFlaskChild.event.result);
  }
  if (
    result === TreasureMiscMagicE3.IounStones &&
    iounChild &&
    iounChild.event.kind === 'treasureIounStones'
  ) {
    const summary = toIounStonesSummary(iounChild.event.result);
    if (summary.count === 0) {
      return 'There are no ioun stones.';
    }
    if (summary.count === 1) {
      return 'There is 1 ioun stone awaiting identification.';
    }
    return `There are ${summary.count} ioun stones awaiting identification.`;
  }
  if (
    result === TreasureMiscMagicE3.HornOfValhalla &&
    hornTypeChild &&
    hornTypeChild.event.kind === 'treasureHornOfValhallaType'
  ) {
    const attunementChild = findChildEvent(
      hornTypeChild,
      'treasureHornOfValhallaAttunement'
    );
    const alignmentChild =
      attunementChild &&
      attunementChild.event.kind === 'treasureHornOfValhallaAttunement'
        ? findChildEvent(attunementChild, 'treasureHornOfValhallaAlignment')
        : undefined;
    return hornSentence({
      type: hornTypeChild.event.result,
      attunement:
        attunementChild &&
        attunementChild.event.kind === 'treasureHornOfValhallaAttunement'
          ? attunementChild.event.result
          : undefined,
      alignment:
        alignmentChild &&
        alignmentChild.event.kind === 'treasureHornOfValhallaAlignment'
          ? alignmentChild.event.result
          : undefined,
    });
  }
  return miscMagicE3Sentence(result, ointmentJars);
}

function stripUsageTag(label: string): string {
  return label.replace(/\\s+\\(([A-Z],?\\s?)+\\)/, '').trim();
}

function articleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

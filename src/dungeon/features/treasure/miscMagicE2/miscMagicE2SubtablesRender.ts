import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  treasureCarpetOfFlying,
  TreasureCarpetOfFlying,
  treasureCloakOfProtection,
  TreasureCloakOfProtection,
  treasureCrystalBall,
  TreasureCrystalBall,
  treasureDeckOfManyThings,
  TreasureDeckOfManyThings,
  treasureEyesOfPetrification,
  TreasureEyesOfPetrification,
} from './miscMagicE2Subtables';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

const CARPET_SIZE_LABELS: Record<TreasureCarpetOfFlying, string> = {
  [TreasureCarpetOfFlying.ThreeByFive]: "3' × 5'",
  [TreasureCarpetOfFlying.FourBySix]: "4' × 6'",
  [TreasureCarpetOfFlying.FiveBySeven]: "5' × 7'",
  [TreasureCarpetOfFlying.SixByNine]: "6' × 9'",
};

export function renderTreasureCarpetOfFlyingDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCarpetOfFlying') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Carpet of Flying Size',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${CARPET_SIZE_LABELS[outcome.event.result]}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: carpetSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureCarpetOfFlyingCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCarpetOfFlying') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Carpet of Flying Size',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: carpetSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureCarpetOfFlyingPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Carpet of Flying Size',
    sides: treasureCarpetOfFlying.sides,
    entries: treasureCarpetOfFlying.entries.map(({ range, command }) => ({
      range,
      label: CARPET_SIZE_LABELS[command],
    })),
  });

function carpetSentence(result: TreasureCarpetOfFlying): string {
  return `The carpet is ${CARPET_SIZE_LABELS[result]}.`;
}

const CLOAK_BONUS_LABELS: Record<TreasureCloakOfProtection, string> = {
  [TreasureCloakOfProtection.PlusOne]: 'Cloak of Protection +1',
  [TreasureCloakOfProtection.PlusTwo]: 'Cloak of Protection +2',
  [TreasureCloakOfProtection.PlusThree]: 'Cloak of Protection +3',
  [TreasureCloakOfProtection.PlusFour]: 'Cloak of Protection +4',
  [TreasureCloakOfProtection.PlusFive]: 'Cloak of Protection +5',
};

export function renderTreasureCloakOfProtectionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCloakOfProtection') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Cloak of Protection Bonus',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${CLOAK_BONUS_LABELS[outcome.event.result]}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: cloakSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureCloakOfProtectionCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCloakOfProtection') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Cloak of Protection Bonus',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: cloakSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureCloakOfProtectionPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Cloak of Protection Bonus',
    sides: treasureCloakOfProtection.sides,
    entries: treasureCloakOfProtection.entries.map(({ range, command }) => ({
      range,
      label: CLOAK_BONUS_LABELS[command],
    })),
  });

export function cloakSentence(result: TreasureCloakOfProtection): string {
  return `There is a ${CLOAK_BONUS_LABELS[result]}.`;
}

const CRYSTAL_BALL_LABELS: Record<TreasureCrystalBall, string> = {
  [TreasureCrystalBall.Standard]: 'crystal ball (normal)',
  [TreasureCrystalBall.Clairaudience]: 'crystal ball with clairaudience',
  [TreasureCrystalBall.Esp]: 'crystal ball with ESP',
  [TreasureCrystalBall.Telepathy]: 'crystal ball with telepathy',
};

export function renderTreasureCrystalBallDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCrystalBall') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Crystal Ball',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${CRYSTAL_BALL_LABELS[outcome.event.result]}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: crystalBallSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureCrystalBallCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCrystalBall') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Crystal Ball',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: crystalBallSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureCrystalBallPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Crystal Ball Variant',
    sides: treasureCrystalBall.sides,
    entries: treasureCrystalBall.entries.map(({ range, command }) => ({
      range,
      label: CRYSTAL_BALL_LABELS[command],
    })),
  });

export function crystalBallSentence(result: TreasureCrystalBall): string {
  return `There is a ${CRYSTAL_BALL_LABELS[result]}.`;
}

const DECK_OF_MANY_THINGS_LABELS: Record<TreasureDeckOfManyThings, string> = {
  [TreasureDeckOfManyThings.ThirteenPlaques]:
    'deck of many things with 13 plaques',
  [TreasureDeckOfManyThings.TwentyTwoPlaques]:
    'deck of many things with 22 plaques',
};

export function renderTreasureDeckOfManyThingsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureDeckOfManyThings') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Deck of Many Things Composition',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        DECK_OF_MANY_THINGS_LABELS[outcome.event.result]
      }`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: deckSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureDeckOfManyThingsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureDeckOfManyThings') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Deck of Many Things',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: deckSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureDeckOfManyThingsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Deck of Many Things Composition',
    sides: treasureDeckOfManyThings.sides,
    entries: treasureDeckOfManyThings.entries.map(({ range, command }) => ({
      range,
      label: DECK_OF_MANY_THINGS_LABELS[command],
    })),
  });

export function deckSentence(result: TreasureDeckOfManyThings): string {
  const plaques =
    result === TreasureDeckOfManyThings.ThirteenPlaques ? '13' : '22';
  return `There is a deck of many things containing ${plaques} plaques.`;
}

const EYES_OF_PETRIFICATION_LABELS: Record<
  TreasureEyesOfPetrification,
  string
> = {
  [TreasureEyesOfPetrification.Basilisk]: 'eyes of petrification (basilisk)',
  [TreasureEyesOfPetrification.Normal]: 'eyes of petrification (normal)',
};

export function renderTreasureEyesOfPetrificationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureEyesOfPetrification') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Eyes of Petrification Variant',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        EYES_OF_PETRIFICATION_LABELS[outcome.event.result]
      }`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: eyesSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureEyesOfPetrificationCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureEyesOfPetrification') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Eyes of Petrification',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: eyesSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureEyesOfPetrificationPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Eyes of Petrification Variant',
    sides: treasureEyesOfPetrification.sides,
    entries: treasureEyesOfPetrification.entries.map(({ range, command }) => ({
      range,
      label: EYES_OF_PETRIFICATION_LABELS[command],
    })),
  });

export function eyesSentence(result: TreasureEyesOfPetrification): string {
  return `There are ${EYES_OF_PETRIFICATION_LABELS[result]}.`;
}

import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureHornOfValhallaType,
  TreasureHornOfValhallaType,
} from '../../../tables/dungeon/treasureHornOfValhallaType';
import {
  treasureHornOfValhallaAttunement,
  TreasureHornOfValhallaAttunement,
} from '../../../tables/dungeon/treasureHornOfValhallaAttunement';
import {
  treasureHornOfValhallaAlignment,
  TreasureHornOfValhallaAlignment,
} from '../../../tables/dungeon/treasureHornOfValhallaAlignment';
import { buildPreview, findChildEvent } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const TYPE_LABELS: Record<TreasureHornOfValhallaType, string> = {
  [TreasureHornOfValhallaType.Silver]: 'Silver Horn of Valhalla',
  [TreasureHornOfValhallaType.Brass]: 'Brass Horn of Valhalla',
  [TreasureHornOfValhallaType.Bronze]: 'Bronze Horn of Valhalla',
  [TreasureHornOfValhallaType.Iron]: 'Iron Horn of Valhalla',
};

const ALIGNMENT_LABELS: Record<TreasureHornOfValhallaAlignment, string> = {
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
    items: [`roll: ${outcome.roll} — ${TYPE_LABELS[outcome.event.result]}`],
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
    items: [`roll: ${outcome.roll} — ${attunementLabel(outcome.event.result)}`],
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
    items: [`roll: ${outcome.roll} — ${alignmentLabel(outcome.event.result)}`],
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
      label: TYPE_LABELS[command],
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
          label: attunementLabel(command),
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
          label: alignmentLabel(command),
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
  const typeLabel = TYPE_LABELS[type];
  const article = articleFor(typeLabel);
  if (attunement === undefined) {
    return `There is ${article} ${typeLabel}.`;
  }
  if (attunement === TreasureHornOfValhallaAttunement.NonAligned) {
    return `There is ${article} ${typeLabel} (non-aligned).`;
  }
  if (alignment === undefined) {
    return `There is ${article} ${typeLabel} (aligned).`;
  }
  return `There is ${article} ${typeLabel} (${alignmentLabel(alignment)}).`;
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
  return `The horn is aligned ${alignmentLabel(alignment)}.`;
}

export function alignmentSentence(
  alignment: TreasureHornOfValhallaAlignment
): string {
  return `The horn is ${alignmentLabel(alignment)}.`;
}

function attunementLabel(attunement: TreasureHornOfValhallaAttunement): string {
  return attunement === TreasureHornOfValhallaAttunement.NonAligned
    ? 'Non-aligned'
    : 'Aligned';
}

function alignmentLabel(alignment: TreasureHornOfValhallaAlignment): string {
  return ALIGNMENT_LABELS[alignment];
}

function articleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

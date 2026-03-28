import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { InlineText } from '../../../helpers/inlineContent';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { joinSentenceInlineTexts } from '../../../helpers/inlineContent';
import {
  stairs,
  Egress,
  Stairs,
  Chute,
  chute as chuteTable,
  egressOne,
  egressTwo,
  egressThree,
} from './stairsTable';
import {
  findChildEvent,
  type AppendPreviewFn,
} from '../../../adapters/render/shared';
import {
  buildPreview,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

type StairsDeps = {
  renderChamberSummary?: (node: OutcomeEventNode) => string;
  renderChamberSummaryInline?: (node: OutcomeEventNode) => InlineText;
};

const DEFAULT_DEPS: Required<StairsDeps> = {
  renderChamberSummary: () => '',
  renderChamberSummaryInline: () => ({ text: '' }),
};

export function renderStairsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn,
  deps?: StairsDeps
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'stairs') return [];
  const resolved = withDefaults(deps);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Stairs',
  };
  const label = Stairs[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeStairs(outcome, resolved);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (summary.detailParagraphs.length > 0) {
    nodes.push(...summary.detailParagraphs);
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderStairsCompactInline(
  node: OutcomeEventNode,
  deps?: StairsDeps
): InlineText {
  if (node.event.kind !== 'stairs') return { text: '' };
  const summary = describeStairs(node, withDefaults(deps));
  return {
    text: summary.compactText,
    inline: summary.compactInline.inline,
  };
}

export function renderStairsCompactNodes(
  outcome: OutcomeEventNode,
  deps?: StairsDeps
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'stairs') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Stairs',
  };
  const label = Stairs[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text = renderStairsCompactInline(outcome, deps);
  return [heading, bullet, { kind: 'paragraph', ...text }];
}

function describeStairs(
  node: OutcomeEventNode,
  deps?: StairsDeps
): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
  compactInline: InlineText;
} {
  if (node.event.kind !== 'stairs') {
    return {
      detailParagraphs: [],
      compactText: '',
      compactInline: { text: '' },
    };
  }
  const resolved = withDefaults(deps);
  const detailParagraphs: DungeonMessage[] = [];
  const compactTextSegments: string[] = [];
  const compactInlineSegments: Array<string | InlineText> = [];
  const append = (
    raw: string,
    options?: { detail?: boolean; compact?: boolean }
  ) => {
    const includeDetail = options?.detail !== false;
    const includeCompact = options?.compact !== false;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return;
    const endsWithPunctuation = /[.!?]$/.test(trimmed);
    if (includeDetail) {
      const detailText = endsWithPunctuation ? `${trimmed} ` : `${trimmed}. `;
      detailParagraphs.push({ kind: 'paragraph', text: detailText });
    }
    if (includeCompact) {
      const sentence = endsWithPunctuation ? trimmed : `${trimmed}.`;
      compactTextSegments.push(sentence);
      compactInlineSegments.push(sentence);
    }
  };

  const baseDescription = formatStairs(node.event.result);
  if (baseDescription.length > 0) {
    append(baseDescription);
  }

  const egress = findChildEvent(node, 'egress');
  if (egress && egress.event.kind === 'egress') {
    if (egress.event.result === Egress.Closed) {
      append(
        'After descending, an unnoticed door will close egress for the day.',
        { detail: false }
      );
    }
  }

  const chuteEvent = findChildEvent(node, 'chute');
  if (chuteEvent && chuteEvent.event.kind === 'chute') {
    if (chuteEvent.event.result === Chute.Exists) {
      append(
        'The stairs will turn into a chute, descending two levels from the top.'
      );
    }
  }

  if (node.event.result === Stairs.UpOneDownTwo) {
    const chamber = findChildEvent(node, 'chamberDimensions');
    if (chamber) {
      const chamberSummary = resolved.renderChamberSummaryInline(chamber);
      if (chamberSummary.text.trim().length > 0) {
        compactTextSegments.push(chamberSummary.text.trim());
        compactInlineSegments.push(chamberSummary);
      }
    }
  }

  return {
    detailParagraphs,
    compactText: joinCompactSegments(compactTextSegments),
    compactInline: joinSentenceInlineTexts(compactInlineSegments),
  };
}

function withDefaults(deps?: StairsDeps): Required<StairsDeps> {
  if (!deps) return DEFAULT_DEPS;
  return {
    renderChamberSummary:
      deps.renderChamberSummary ?? DEFAULT_DEPS.renderChamberSummary,
    renderChamberSummaryInline:
      deps.renderChamberSummaryInline ??
      DEFAULT_DEPS.renderChamberSummaryInline,
  };
}

function joinCompactSegments(segments: string[]): string {
  const normalized = segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => (/[.!?]$/.test(segment) ? segment : `${segment}.`));
  if (normalized.length === 0) return '';
  return `${normalized.join(' ')} `;
}

export const buildStairsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Stairs',
    sides: stairs.sides,
    entries: stairs.entries.map((entry) => ({
      range: entry.range,
      label: Stairs[entry.command] ?? String(entry.command),
    })),
  });

export function renderChuteDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildChuteNodes(outcome);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildChutePreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Chute',
    sides: chuteTable.sides,
    entries: chuteTable.entries.map((entry) => ({
      range: entry.range,
      label: Chute[entry.command] ?? String(entry.command),
    })),
  });

export function renderChuteCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildChuteNodes(outcome);
}

function buildChuteNodes(outcome: OutcomeEventNode): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chute') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Chute',
  };
  const label =
    Chute[outcome.event.result as 0 | 1] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text = formatChute(outcome.event.result);
  return [heading, bullet, { kind: 'paragraph', text }];
}

function formatChute(result: Chute): string {
  return result === Chute.Exists
    ? 'The stairs will turn into a chute, descending two levels from the top. '
    : '';
}

function formatStairs(result: Stairs): string {
  switch (result) {
    case Stairs.DownOne:
      return 'There are stairs here that descend one level.';
    case Stairs.DownTwo:
      return 'There are stairs here that descend two levels.';
    case Stairs.DownThree:
      return 'There are stairs here that descend three levels.';
    case Stairs.UpOne:
      return 'There are stairs here that ascend one level.';
    case Stairs.UpDead:
      return 'There are stairs here that ascend one level to a dead end.';
    case Stairs.DownDead:
      return 'There are stairs here that descend one level to a dead end.';
    case Stairs.ChimneyUpOne:
      return "There is a chimney that goes up one level. The current passage continues, check again in 30'.";
    case Stairs.ChimneyUpTwo:
      return "There is a chimney that goes up two levels. The current passage continues, check again in 30'.";
    case Stairs.ChimneyDownTwo:
      return "There is a chimney that goes down two levels. The current passage continues, check again in 30'.";
    case Stairs.TrapDoorDownOne:
      return "There is a trap door that goes down one level. The current passage continues, check again in 30'.";
    case Stairs.TrapDownDownTwo:
      return "There is a trap door that goes down two levels. The current passage continues, check again in 30'.";
    case Stairs.UpOneDownTwo:
      return 'There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber.';
    default:
      return '';
  }
}

export function renderEgressDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildEgressNodes(outcome);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderEgressCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildEgressNodes(outcome);
}

function buildEgressNodes(outcome: OutcomeEventNode): DungeonRenderNode[] {
  if (outcome.event.kind !== 'egress') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Egress',
  };
  const label = Egress[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const suffix = formatEgress(outcome.event.result);
  return [heading, bullet, { kind: 'paragraph', text: suffix }];
}

export const buildEgressPreview: TablePreviewFactory = (tableId) => {
  const which = tableId.split(':')[1] as 'one' | 'two' | 'three' | undefined;
  const table =
    which === 'one' ? egressOne : which === 'two' ? egressTwo : egressThree;
  const title =
    which === 'one'
      ? 'Egress (1 level)'
      : which === 'two'
      ? 'Egress (2 levels)'
      : 'Egress (3 levels)';
  return buildPreview(tableId, {
    title,
    sides: table.sides,
    entries: table.entries.map((entry) => ({
      range: entry.range,
      label: Egress[entry.command] ?? String(entry.command),
    })),
  });
};

function formatEgress(result: Egress): string {
  return result === Egress.Closed
    ? 'After descending, an unnoticed door will close egress for the day. '
    : '';
}

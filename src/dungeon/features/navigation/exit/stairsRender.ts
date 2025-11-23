import type { DungeonMessage, DungeonRenderNode } from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { stairs, Egress, Stairs, Chute } from './stairsTable';
import { findChildEvent, type AppendPreviewFn } from '../../../adapters/render/shared';
import { buildPreview, type TablePreviewFactory } from '../../../adapters/render/shared';

export type StairsDeps = {
  renderChamberSummary?: (node: OutcomeEventNode) => string;
};

const DEFAULT_DEPS: Required<StairsDeps> = {
  renderChamberSummary: () => '',
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

export function renderStairsCompact(
  node: OutcomeEventNode,
  deps?: StairsDeps
): string {
  if (node.event.kind !== 'stairs') return '';
  const summary = describeStairs(node, withDefaults(deps));
  return summary.compactText;
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
  const text = renderStairsCompact(outcome, deps);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export function describeStairs(
  node: OutcomeEventNode,
  deps?: StairsDeps
): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'stairs') {
    return { detailParagraphs: [], compactText: '' };
  }
  const resolved = withDefaults(deps);
  const detailParagraphs: DungeonMessage[] = [];
  const compactSegments: string[] = [];
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
      compactSegments.push(endsWithPunctuation ? trimmed : `${trimmed}.`);
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
      const chamberSummary = resolved.renderChamberSummary(chamber).trim();
      if (chamberSummary.length > 0) {
        append(chamberSummary, { detail: false });
      }
    }
  }

  return {
    detailParagraphs,
    compactText: joinCompactSegments(compactSegments),
  };
}

function withDefaults(deps?: StairsDeps): Required<StairsDeps> {
  if (!deps) return DEFAULT_DEPS;
  return {
    renderChamberSummary:
      deps.renderChamberSummary ?? DEFAULT_DEPS.renderChamberSummary,
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

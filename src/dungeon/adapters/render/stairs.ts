import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { Egress, Stairs, Chute } from '../../../tables/dungeon/stairs';
import { findChildEvent, type AppendPreviewFn } from './shared';

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

  switch (node.event.result) {
    case Stairs.DownOne:
      append('There are stairs here that descend one level.');
      break;
    case Stairs.DownTwo:
      append('There are stairs here that descend two levels.');
      break;
    case Stairs.DownThree:
      append('There are stairs here that descend three levels.');
      break;
    case Stairs.UpOne:
      append('There are stairs here that ascend one level.');
      break;
    case Stairs.UpDead:
      append('There are stairs here that ascend one level to a dead end.');
      break;
    case Stairs.DownDead:
      append('There are stairs here that descend one level to a dead end.');
      break;
    case Stairs.ChimneyUpOne:
      append(
        "There is a chimney that goes up one level. The current passage continues, check again in 30'."
      );
      break;
    case Stairs.ChimneyUpTwo:
      append(
        "There is a chimney that goes up two levels. The current passage continues, check again in 30'."
      );
      break;
    case Stairs.ChimneyDownTwo:
      append(
        "There is a chimney that goes down two levels. The current passage continues, check again in 30'."
      );
      break;
    case Stairs.TrapDoorDownOne:
      append(
        "There is a trap door that goes down one level. The current passage continues, check again in 30'."
      );
      break;
    case Stairs.TrapDownDownTwo:
      append(
        "There is a trap door that goes down two levels. The current passage continues, check again in 30'."
      );
      break;
    case Stairs.UpOneDownTwo:
      append(
        'There are stairs here that ascend one level and then descend two levels. The stairs descend into a chamber.'
      );
      break;
  }

  const egress = findChildEvent(node, 'egress');
  if (egress && egress.event.kind === 'egress') {
    if (egress.event.result === Egress.Closed) {
      append(
        'After descending, an unnoticed door will close egress for the day.'
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

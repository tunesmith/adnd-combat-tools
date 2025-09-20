import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { PassageTurns } from '../../../tables/dungeon/passageTurns';
import type { AppendPreviewFn } from './shared';

export type PassageTurnDeps = {
  renderPassageWidth?: (node: OutcomeEventNode) => string;
};

const DEFAULT_DEPS: Required<PassageTurnDeps> = {
  renderPassageWidth: () => '',
};

export function renderPassageTurnsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn,
  deps?: PassageTurnDeps
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'passageTurns') return [];
  const resolvedDeps = withDefaults(deps);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Passage Turns',
  };
  const label = PassageTurns[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const summary = describePassageTurn(outcome, resolvedDeps);
  if (summary.detailParagraphs.length > 0) {
    nodes.push(...summary.detailParagraphs);
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describePassageTurn(
  node: OutcomeEventNode,
  deps?: PassageTurnDeps
): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'passageTurns') {
    return { detailParagraphs: [], compactText: '' };
  }
  const resolvedDeps = withDefaults(deps);
  let detailText = '';
  switch (node.event.result) {
    case PassageTurns.Left90:
      detailText = "The passage turns left 90 degrees - check again in 30'. ";
      break;
    case PassageTurns.Left45:
      detailText = "The passage turns left 45 degrees ahead - check again in 30'. ";
      break;
    case PassageTurns.Left135:
      detailText =
        "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
      break;
    case PassageTurns.Right90:
      detailText = "The passage turns right 90 degrees - check again in 30'. ";
      break;
    case PassageTurns.Right45:
      detailText = "The passage turns right 45 degrees ahead - check again in 30'. ";
      break;
    case PassageTurns.Right135:
      detailText =
        "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
      break;
    default:
      detailText = '';
  }
  let compactText = detailText;
  const widthNode = findChildEvent(node, 'passageWidth');
  if (widthNode && widthNode.event.kind === 'passageWidth') {
    compactText += resolvedDeps.renderPassageWidth(widthNode);
  }
  const detailParagraphs: DungeonMessage[] = [];
  if (detailText.length > 0) {
    detailParagraphs.push({ kind: 'paragraph', text: detailText });
  }
  return { detailParagraphs, compactText };
}

export function renderCompactPassageTurn(
  node: OutcomeEventNode,
  deps?: PassageTurnDeps
): string {
  if (node.event.kind !== 'passageTurns') return '';
  const summary = describePassageTurn(node, deps);
  return summary.compactText;
}

function withDefaults(deps?: PassageTurnDeps): Required<PassageTurnDeps> {
  if (!deps) return DEFAULT_DEPS;
  return {
    renderPassageWidth: deps.renderPassageWidth ?? DEFAULT_DEPS.renderPassageWidth,
  };
}

function findChildEvent(
  node: OutcomeEventNode,
  kind: OutcomeEventNode['event']['kind']
): OutcomeEventNode | undefined {
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    if (child.event.kind === kind) return child;
  }
  return undefined;
}

import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import {
  emphasizeInlineText,
  extractLeadingItemPhrase,
} from '../../helpers/inlineContent';
import type { OutcomeEventNode } from '../../domain/outcome';
import type { AppendPreviewFn } from '../../adapters/render/shared';

type RenderTreasureParentOptions = {
  outcome: OutcomeEventNode;
  appendPendingPreviews: AppendPreviewFn;
  detailHeading: string;
  compactHeading: string;
  resultLabel: string;
  text: string;
  compactExtras?: DungeonRenderNode[];
};

function buildEmphasizedParagraph(text: string): DungeonMessage {
  return {
    kind: 'paragraph',
    ...emphasizeInlineText(text, extractLeadingItemPhrase(text)),
  };
}

export function renderTreasureParentDetail(
  options: RenderTreasureParentOptions
): DungeonRenderNode[] {
  const nodes: DungeonRenderNode[] = [
    {
      kind: 'heading',
      level: 4,
      text: options.detailHeading,
    },
    {
      kind: 'bullet-list',
      items: [`roll: ${options.outcome.roll} — ${options.resultLabel}`],
    },
    buildEmphasizedParagraph(options.text),
  ];
  options.appendPendingPreviews(options.outcome, nodes);
  return nodes;
}

export function renderTreasureParentCompact(
  options: RenderTreasureParentOptions
): DungeonRenderNode[] {
  const nodes: DungeonRenderNode[] = [
    {
      kind: 'heading',
      level: 4,
      text: options.compactHeading,
    },
    buildEmphasizedParagraph(options.text),
    ...(options.compactExtras ?? []),
  ];
  options.appendPendingPreviews(options.outcome, nodes);
  return nodes;
}

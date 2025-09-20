import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
} from '../../domain/outcome';

/**
 * Signature used by detail renderers to append table previews generated from pending rolls.
 * Implementations can track deduplication through the optional `seenPreviews` set.
 */
export type AppendPreviewFn = (
  outcome: DungeonOutcomeNode,
  collector: DungeonRenderNode[],
  seenPreviews?: Set<string>
) => void;

/**
 * Locate the first child event of a given kind within an outcome node.
 * Shared by render adapters to avoid duplicating the same tree-walk logic.
 */
export function findChildEvent<K extends OutcomeEvent['kind']>(
  node: OutcomeEventNode,
  kind: K
): OutcomeEventNode | undefined {
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    if (child.event.kind === kind) return child;
  }
  return undefined;
}

export type TablePreviewFactory = (
  tableId: string,
  context?: TableContext
) => DungeonTablePreview;

export function buildPreview(
  tableId: string,
  options: {
    title: string;
    sides: number;
    entries: Array<{ range: number[]; label: string }>;
    context?: TableContext;
  }
): DungeonTablePreview {
  const { title, sides, entries, context } = options;
  return {
    kind: 'table-preview',
    id: tableId,
    title,
    sides,
    entries: entries.map((entry) => ({
      range: formatRange(entry.range),
      label: entry.label,
    })),
    context,
  };
}

function formatRange(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
}

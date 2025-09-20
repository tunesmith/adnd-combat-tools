import type { DungeonRenderNode } from '../../../types/dungeon';
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

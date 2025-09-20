import type { DungeonRenderNode } from '../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
} from '../../domain/outcome';

export type AppendPreviewFn = (
  outcome: DungeonOutcomeNode,
  collector: DungeonRenderNode[],
  seenPreviews?: Set<string>
) => void;

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

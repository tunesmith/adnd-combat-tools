import type { DungeonRenderNode } from '../../../types/dungeon';
import type { DungeonOutcomeNode } from '../../domain/outcome';

export type AppendPreviewFn = (
  outcome: DungeonOutcomeNode,
  collector: DungeonRenderNode[],
  seenPreviews?: Set<string>
) => void;

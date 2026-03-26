import type { DungeonOutcomeNode } from '../../dungeon/domain/outcome';
import type { RenderCache } from '../../dungeon/helpers/renderCache';
import type {
  DungeonAction,
  DungeonRenderNode,
  DungeonRollSource,
  DungeonTablePreview,
} from '../../types/dungeon';

export type FeedItem = {
  id: string;
  sequence: number;
  action: DungeonAction;
  roll: number;
  level: number;
  outcome?: DungeonOutcomeNode;
  renderCache: RenderCache;
  messages: DungeonRenderNode[];
  pendingCount: number;
};

export type PreviewResolutionEntry = {
  feedStep: number;
  tableId: string;
  targetId: string;
  title: string;
  roll: number;
  rollSource: DungeonRollSource;
};

export type PreviewResolutionRequest = {
  preview: DungeonTablePreview;
  feedItemId: string;
  shouldRoll: boolean;
  feedSequence?: number;
  feedItem?: FeedItem;
};

export type PreviewInteractionController = {
  overrides: Record<string, number | undefined>;
  collapsed: Record<string, boolean>;
  resolved: Record<string, boolean>;
  onOverrideChange: (targetKey: string, value: number | undefined) => void;
  onResolvePreview: (request: PreviewResolutionRequest) => void;
  onToggleCollapse?: (
    feedItemId: string,
    targetKey: string,
    nextCollapsed: boolean
  ) => void;
};

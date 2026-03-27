import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useState } from 'react';
import type { DungeonRandomSession } from '../../dungeon/helpers/dungeonRandom';
import { resolveDungeonFeedPreview } from './dungeonFeedController';
import type {
  FeedItem,
  PreviewInteractionController,
  PreviewResolutionEntry,
  PreviewResolutionRequest,
} from './feedTypes';

export function useDungeonPreviewState(options: {
  sessionRef: MutableRefObject<DungeonRandomSession>;
  setFeed: Dispatch<SetStateAction<FeedItem[]>>;
  onInteraction?: () => void;
  onResolved?: (entry: PreviewResolutionEntry) => void;
}) {
  const [overrides, setOverrides] = useState<
    Record<string, number | undefined>
  >({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [resolved, setResolved] = useState<Record<string, boolean>>({});

  const handlePreviewOverrideChange = (
    targetKey: string,
    value: number | undefined
  ) => {
    setOverrides((prev) => ({ ...prev, [targetKey]: value }));
  };

  const handlePreviewCollapseToggle = (
    feedItemId: string,
    targetKey: string,
    nextCollapsed: boolean
  ) => {
    setCollapsed((prev) => ({
      ...prev,
      [`${feedItemId}:${targetKey}`]: nextCollapsed,
    }));
  };

  const handlePreviewResolve = (request: PreviewResolutionRequest) => {
    options.onInteraction?.();
    resolveDungeonFeedPreview({
      preview: request.preview,
      feedItemId: request.feedItemId,
      shouldRoll: request.shouldRoll,
      explicitRoll: request.explicitRoll,
      feedSequence: request.feedSequence,
      feedItem: request.feedItem,
      session: options.sessionRef.current,
      overrides,
      setOverrides,
      setFeed: options.setFeed,
      setCollapsed,
      setResolved,
      onResolved: options.onResolved,
    });
  };

  const resetPreviewState = () => {
    setOverrides({});
    setCollapsed({});
    setResolved({});
  };

  const previewController: PreviewInteractionController = {
    overrides,
    collapsed,
    resolved,
    onOverrideChange: handlePreviewOverrideChange,
    onResolvePreview: handlePreviewResolve,
    onToggleCollapse: handlePreviewCollapseToggle,
  };

  return {
    previewController,
    resetPreviewState,
  };
}

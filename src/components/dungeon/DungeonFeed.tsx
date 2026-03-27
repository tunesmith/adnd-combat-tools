import type { Dispatch, SetStateAction } from 'react';
import { DungeonFeedItem } from './DungeonFeedItem';
import { renderNode } from './DungeonFeedNode';
import { DungeonTablePreviewCard } from './DungeonTablePreviewCard';
import type {
  FeedItem,
  PreviewInteractionController,
  PreviewScrollTarget,
} from './feedTypes';
import type { RootDungeonTablePreview } from '../../types/dungeon';
import styles from '../../pages/dungeon/dungeon.module.css';

type DungeonFeedProps = {
  detailMode: boolean;
  rootPreviewNodes: RootDungeonTablePreview[];
  feed: FeedItem[];
  setDetailMode: Dispatch<SetStateAction<boolean>>;
  previewController: PreviewInteractionController;
  onRootPreviewSelect: (roll: number) => void;
  scrollTarget?: PreviewScrollTarget | null;
  onOpenPendingDetail: (
    item: FeedItem,
    target: PreviewScrollTarget | null
  ) => void;
  onPreviewScrollComplete: (target: PreviewScrollTarget) => void;
};

const DungeonFeed = ({
  detailMode,
  rootPreviewNodes,
  feed,
  setDetailMode,
  previewController,
  onRootPreviewSelect,
  scrollTarget,
  onOpenPendingDetail,
  onPreviewScrollComplete,
}: DungeonFeedProps) => {
  const rootPreviewStack = renderRootPreviewStack(
    detailMode,
    rootPreviewNodes,
    feed.length === 0,
    onRootPreviewSelect
  );

  if (feed.length === 0) {
    return detailMode ? (
      rootPreviewStack
    ) : (
      <div className={styles['placeholder']}>
        Click AutoRoll or enter a d20 value.
      </div>
    );
  }

  return (
    <>
      {rootPreviewStack}
      {feed.map((item) => (
        <DungeonFeedItem
          key={item.id}
          detailMode={detailMode}
          item={item}
          setDetailMode={setDetailMode}
          previewController={previewController}
          scrollTarget={scrollTarget}
          onOpenPendingDetail={onOpenPendingDetail}
          onPreviewScrollComplete={onPreviewScrollComplete}
        />
      ))}
    </>
  );
};

function renderRootPreviewStack(
  detailMode: boolean,
  rootPreviewNodes: RootDungeonTablePreview[],
  isEmptyFeed: boolean,
  onRootPreviewSelect: (roll: number) => void
) {
  if (!detailMode) return null;

  return (
    <div className={styles['initialPreviewStack']}>
      {rootPreviewNodes.map((node, index) => (
        <DungeonTablePreviewCard
          key={`${node.id}:${index}`}
          preview={node}
          enablePreviewControls={false}
          statusLabelOverride={isEmptyFeed ? 'Start' : undefined}
          statusToneOverride={isEmptyFeed ? 'pending' : 'reference'}
          onEntrySelect={onRootPreviewSelect}
        />
      ))}
    </div>
  );
}

export { DungeonFeed, renderNode };

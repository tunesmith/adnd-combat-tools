import type { Dispatch, SetStateAction } from 'react';
import { DungeonFeedItem } from './DungeonFeedItem';
import { renderNode } from './DungeonFeedNode';
import { DungeonTablePreviewCard } from './DungeonTablePreviewCard';
import type { FeedItem, PreviewInteractionController } from './feedTypes';
import type { RootDungeonTablePreview } from '../../types/dungeon';
import styles from '../../pages/dungeon/dungeon.module.css';

type DungeonFeedProps = {
  detailMode: boolean;
  rootPreviewNodes: RootDungeonTablePreview[];
  feed: FeedItem[];
  setDetailMode: Dispatch<SetStateAction<boolean>>;
  previewController: PreviewInteractionController;
};

const DungeonFeed = ({
  detailMode,
  rootPreviewNodes,
  feed,
  setDetailMode,
  previewController,
}: DungeonFeedProps) => {
  const rootPreviewStack = renderRootPreviewStack(
    detailMode,
    rootPreviewNodes,
    feed.length === 0
  );

  if (feed.length === 0) {
    return detailMode ? (
      rootPreviewStack
    ) : (
      <div className={styles['placeholder']}>
        Make a selection, enter 1–20 or click AutoRoll.
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
        />
      ))}
    </>
  );
};

function renderRootPreviewStack(
  detailMode: boolean,
  rootPreviewNodes: RootDungeonTablePreview[],
  isEmptyFeed: boolean
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
        />
      ))}
    </div>
  );
}

export { DungeonFeed, renderNode };

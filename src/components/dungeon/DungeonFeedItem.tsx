import type { Dispatch, SetStateAction } from 'react';
import { collectPendingTargetIds } from './dungeonFeedController';
import { renderNode } from './DungeonFeedNode';
import type { FeedItem, PreviewInteractionController } from './feedTypes';
import { selectMessagesForMode } from '../../dungeon/helpers/renderCache';
import styles from '../../pages/dungeon/dungeon.module.css';

type DungeonFeedItemProps = {
  detailMode: boolean;
  item: FeedItem;
  setDetailMode: Dispatch<SetStateAction<boolean>>;
  previewController: PreviewInteractionController;
};

const DungeonFeedItem = ({
  detailMode,
  item,
  setDetailMode,
  previewController,
}: DungeonFeedItemProps) => {
  const pendingTargetIds = collectPendingTargetIds(item.outcome);
  const renderedNodes = selectMessagesForMode(
    item.action,
    detailMode,
    item.renderCache,
    item.messages
  );

  return (
    <div className={styles['feedItem']}>
      <div className={styles['itemHeader']}>
        <span
          className={`${styles['chip']} ${
            item.action === 'passage'
              ? styles['chipPassage']
              : styles['chipDoor']
          }`}
        >
          {item.action}
        </span>
        {item.pendingCount > 0 && (
          <span className={styles['pendingBadge']}>
            {formatPendingBadge(item.pendingCount)}
          </span>
        )}
        {!detailMode && (
          <span className={styles['roll']}>(roll: {item.roll})</span>
        )}
      </div>
      {!detailMode && item.pendingCount > 0 && (
        <div className={styles['compactPendingNotice']}>
          <div className={styles['compactPendingCopy']}>
            <div className={styles['compactPendingTitle']}>
              {formatPendingTitle(item.pendingCount)}
            </div>
            <div className={styles['compactPendingText']}>
              This result is partial. Switch to detail mode to resolve the
              remaining subtables and rerolls.
            </div>
          </div>
          <button
            type="button"
            className={`${styles['button']} ${styles['compactPendingButton']}`}
            onClick={() => setDetailMode(true)}
          >
            Open detail mode
          </button>
        </div>
      )}
      <div className={styles['messages']}>
        {renderedNodes.map((node, index) =>
          renderNode(
            node,
            index,
            item.id,
            previewController,
            true,
            pendingTargetIds,
            item.sequence,
            item
          )
        )}
      </div>
    </div>
  );
};

function formatPendingBadge(pendingCount: number): string {
  return `${pendingCount} pending ${pendingCount === 1 ? 'step' : 'steps'}`;
}

function formatPendingTitle(pendingCount: number): string {
  return `${pendingCount} ${
    pendingCount === 1 ? 'step is' : 'steps are'
  } still pending.`;
}

export { DungeonFeedItem };

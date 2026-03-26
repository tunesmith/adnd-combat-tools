import type { Dispatch, SetStateAction } from 'react';
import { CharacterPartyCompact } from './CharacterPartyCompact';
import { CharacterPartyDetail } from './CharacterPartyDetail';
import { DungeonTablePreviewCard } from './DungeonTablePreviewCard';
import { IounStonesCompact } from './IounStonesCompact';
import { IounStonesDetail } from './IounStonesDetail';
import { PrayerBeadsCompact } from './PrayerBeadsCompact';
import { PrayerBeadsDetail } from './PrayerBeadsDetail';
import { RobeOfUsefulItemsCompact } from './RobeOfUsefulItemsCompact';
import { RobeOfUsefulItemsDetail } from './RobeOfUsefulItemsDetail';
import { collectPendingTargetIds } from './dungeonFeedController';
import type { FeedItem, PreviewInteractionController } from './feedTypes';
import type {
  DungeonRenderNode,
  DungeonRollTrace,
  RollTraceItem,
} from '../../types/dungeon';
import { selectMessagesForMode } from '../../dungeon/helpers/renderCache';
import styles from '../../pages/dungeon/dungeon.module.css';

type DungeonFeedProps = {
  detailMode: boolean;
  rootPreviewNodes: DungeonRenderNode[];
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
  const rootPreviewStack = detailMode ? (
    <div className={styles['initialPreviewStack']}>
      {rootPreviewNodes.map((node, index) => {
        if (node.kind !== 'table-preview') return null;
        return (
          <DungeonTablePreviewCard
            key={`${node.id}:${index}`}
            preview={node}
            enablePreviewControls={false}
            statusLabelOverride={feed.length === 0 ? 'Start' : undefined}
            statusToneOverride={feed.length === 0 ? 'pending' : 'reference'}
          />
        );
      })}
    </div>
  ) : null;

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
        <div className={styles['feedItem']} key={item.id}>
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
            {(() => {
              const pendingTargetIds = collectPendingTargetIds(item.outcome);
              const renderedNodes = [
                ...selectMessagesForMode(
                  item.action,
                  detailMode,
                  item.renderCache,
                  item.messages
                ).map((node) => ({
                  node,
                  enablePreviewControls: true,
                })),
              ];
              return renderedNodes.map(
                ({ node, enablePreviewControls }, index) =>
                  renderNode(
                    node,
                    index,
                    item.id,
                    previewController,
                    enablePreviewControls,
                    pendingTargetIds,
                    item.sequence,
                    item
                  )
              );
            })()}
          </div>
        </div>
      ))}
    </>
  );
};

function renderNode(
  node: DungeonRenderNode,
  key: number,
  feedItemId: string,
  previewController?: PreviewInteractionController,
  enablePreviewControls = true,
  pendingTargetIds?: ReadonlySet<string>,
  feedSequence?: number,
  feedItem?: FeedItem
): JSX.Element {
  switch (node.kind) {
    case 'heading':
      return (
        <p key={key} style={{ fontWeight: 700 }}>
          {node.text}
        </p>
      );
    case 'bullet-list':
      return (
        <ul key={key} style={{ marginLeft: '1.25rem' }}>
          {node.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    case 'character-party':
      return node.display === 'compact' ? (
        <CharacterPartyCompact key={key} summary={node.summary} />
      ) : (
        <CharacterPartyDetail key={key} summary={node.summary} />
      );
    case 'ioun-stones':
      return node.display === 'compact' ? (
        <IounStonesCompact key={key} summary={node.summary} />
      ) : (
        <IounStonesDetail key={key} summary={node.summary} />
      );
    case 'prayer-beads':
      return node.display === 'compact' ? (
        <PrayerBeadsCompact key={key} summary={node.summary} />
      ) : (
        <PrayerBeadsDetail key={key} summary={node.summary} />
      );
    case 'robe-of-useful-items':
      return node.display === 'compact' ? (
        <RobeOfUsefulItemsCompact key={key} summary={node.summary} />
      ) : (
        <RobeOfUsefulItemsDetail key={key} summary={node.summary} />
      );
    case 'table-preview': {
      const targetKey = node.targetId ?? node.id;
      const keyId = `${feedItemId}:${targetKey}`;
      const isPending = pendingTargetIds?.has(targetKey) ?? false;
      const defaultCollapsed =
        node.autoCollapse === true || (enablePreviewControls && !isPending);
      const collapsedState = previewController?.collapsed[keyId];
      const isCollapsed =
        collapsedState !== undefined ? collapsedState : defaultCollapsed;
      const hasResolved =
        !!previewController?.resolved[keyId] || defaultCollapsed || !isPending;
      return (
        <DungeonTablePreviewCard
          key={key}
          preview={node}
          enablePreviewControls={enablePreviewControls}
          overrideValue={previewController?.overrides[targetKey]}
          onOverrideChange={
            previewController
              ? (value) => previewController.onOverrideChange(targetKey, value)
              : undefined
          }
          onUseOverride={() =>
            previewController?.onResolvePreview({
              preview: node,
              feedItemId,
              shouldRoll: false,
              feedSequence,
              feedItem,
            })
          }
          onAutoRoll={() =>
            previewController?.onResolvePreview({
              preview: node,
              feedItemId,
              shouldRoll: true,
              feedSequence,
              feedItem,
            })
          }
          isCollapsed={isCollapsed}
          hasResolved={hasResolved}
          onToggleCollapse={
            previewController?.onToggleCollapse && hasResolved
              ? () =>
                  previewController.onToggleCollapse?.(
                    feedItemId,
                    targetKey,
                    !isCollapsed
                  )
              : undefined
          }
        />
      );
    }
    case 'roll-trace':
      return (
        <div key={key} style={{ opacity: 0.9 }}>
          {renderTraceList(node)}
        </div>
      );
    case 'paragraph':
    default:
      return <p key={key}>{node.text}</p>;
  }
}

function renderTraceList(trace: DungeonRollTrace) {
  const renderItem = (item: RollTraceItem, index: number): JSX.Element => (
    <li key={index}>
      <code>{item.table}</code>: roll {item.roll} → {item.result}
      {item.children && item.children.length > 0 && (
        <ul style={{ marginLeft: '1rem' }}>
          {item.children.map((child, childIndex) =>
            renderItem(child, childIndex)
          )}
        </ul>
      )}
    </li>
  );
  return (
    <div>
      <div style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>
        Roll trace
      </div>
      <ul style={{ marginLeft: '1.25rem' }}>
        {trace.items.map((item, index) => renderItem(item, index))}
      </ul>
    </div>
  );
}

function formatPendingBadge(pendingCount: number): string {
  return `${pendingCount} pending ${pendingCount === 1 ? 'step' : 'steps'}`;
}

function formatPendingTitle(pendingCount: number): string {
  return `${pendingCount} ${
    pendingCount === 1 ? 'step is' : 'steps are'
  } still pending.`;
}

export { DungeonFeed, renderNode };

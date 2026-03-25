import type { Dispatch, SetStateAction } from 'react';
import { rollDice } from '../../dungeon/helpers/dungeonLookup';
import { doorBeyondMessages } from '../../dungeon/services/doorBeyondMessages';
import { passageMessages } from '../../dungeon/services/passageMessages';
import { resolveViaRegistry } from '../../dungeon/helpers/registry';
import { CharacterPartyCompact } from './CharacterPartyCompact';
import { CharacterPartyDetail } from './CharacterPartyDetail';
import { DungeonTablePreviewCard } from './DungeonTablePreviewCard';
import { IounStonesCompact } from './IounStonesCompact';
import { IounStonesDetail } from './IounStonesDetail';
import { PrayerBeadsCompact } from './PrayerBeadsCompact';
import { PrayerBeadsDetail } from './PrayerBeadsDetail';
import { RobeOfUsefulItemsCompact } from './RobeOfUsefulItemsCompact';
import { RobeOfUsefulItemsDetail } from './RobeOfUsefulItemsDetail';
import type {
  DungeonAction,
  DungeonRenderNode,
  DungeonRollTrace,
  DungeonTablePreview,
  RollTraceItem,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../../dungeon/domain/outcome';
import { selectMessagesForMode } from '../../dungeon/helpers/renderCache';
import type { FeedItem } from './useDungeonPageState';
import styles from '../../pages/dungeon/dungeon.module.css';

type DungeonFeedProps = {
  action: DungeonAction;
  detailMode: boolean;
  dungeonLevel: number;
  feed: FeedItem[];
  setDetailMode: Dispatch<SetStateAction<boolean>>;
  overrides: Record<string, number | undefined>;
  setOverrides: Dispatch<SetStateAction<Record<string, number | undefined>>>;
  setFeed: Dispatch<SetStateAction<FeedItem[]>>;
  collapsed: Record<string, boolean>;
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>;
  resolved: Record<string, boolean>;
  setResolved: Dispatch<SetStateAction<Record<string, boolean>>>;
};

const DungeonFeed = ({
  action,
  detailMode,
  dungeonLevel,
  feed,
  setDetailMode,
  overrides,
  setOverrides,
  setFeed,
  collapsed,
  setCollapsed,
  resolved,
  setResolved,
}: DungeonFeedProps) => {
  if (feed.length === 0) {
    return detailMode ? (
      <div className={styles['initialPreviewStack']}>
        {getRootPreviewNodes(action, dungeonLevel).map((node, index) => {
          if (node.kind !== 'table-preview') return null;
          return (
            <DungeonTablePreviewCard
              key={`${action}:${dungeonLevel}:${node.id}:${index}`}
              preview={node}
              enablePreviewControls={false}
              statusLabelOverride="Start"
              statusToneOverride="pending"
            />
          );
        })}
      </div>
    ) : (
      <div className={styles['placeholder']}>
        Make a selection, enter 1–20 or click AutoRoll.
      </div>
    );
  }

  return (
    <>
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
                ...(detailMode
                  ? getRootPreviewNodes(item.action, item.level).map(
                      (node) => ({
                        node:
                          node.kind === 'table-preview'
                            ? { ...node, autoCollapse: true }
                            : node,
                        enablePreviewControls: false,
                      })
                    )
                  : []),
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
                    overrides,
                    setOverrides,
                    setFeed,
                    enablePreviewControls,
                    collapsed,
                    setCollapsed,
                    resolved,
                    setResolved,
                    pendingTargetIds
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
  overrides: Record<string, number | undefined>,
  setOverrides: Dispatch<SetStateAction<Record<string, number | undefined>>>,
  setFeed: Dispatch<SetStateAction<FeedItem[]>>,
  enablePreviewControls = true,
  collapsed?: Record<string, boolean>,
  setCollapsed?: Dispatch<SetStateAction<Record<string, boolean>>>,
  resolved?: Record<string, boolean>,
  setResolved?: Dispatch<SetStateAction<Record<string, boolean>>>,
  pendingTargetIds?: ReadonlySet<string>
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
      const collapsedState = collapsed ? collapsed[keyId] : undefined;
      const isCollapsed =
        collapsedState !== undefined ? collapsedState : defaultCollapsed;
      const hasResolved =
        !!(resolved && resolved[keyId]) || defaultCollapsed || !isPending;
      return (
        <DungeonTablePreviewCard
          key={key}
          preview={node}
          enablePreviewControls={enablePreviewControls}
          overrideValue={overrides[targetKey]}
          onOverrideChange={(value) =>
            setOverrides((prev) => ({ ...prev, [targetKey]: value }))
          }
          onUseOverride={() =>
            resolvePreview(
              node,
              feedItemId,
              overrides,
              setOverrides,
              setFeed,
              false,
              setCollapsed,
              setResolved
            )
          }
          onAutoRoll={() =>
            resolvePreview(
              node,
              feedItemId,
              overrides,
              setOverrides,
              setFeed,
              true,
              setCollapsed,
              setResolved
            )
          }
          isCollapsed={isCollapsed}
          hasResolved={hasResolved}
          onToggleCollapse={
            setCollapsed && hasResolved
              ? () =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [keyId]: !isCollapsed,
                  }))
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

function resolvePreview(
  preview: DungeonTablePreview,
  feedItemId: string,
  overrides: Record<string, number | undefined>,
  setOverrides: Dispatch<SetStateAction<Record<string, number | undefined>>>,
  setFeed: Dispatch<SetStateAction<FeedItem[]>>,
  shouldRoll: boolean,
  setCollapsed?: Dispatch<SetStateAction<Record<string, boolean>>>,
  setResolved?: Dispatch<SetStateAction<Record<string, boolean>>>
) {
  const targetKey = preview.targetId ?? preview.id;
  let usedRoll: number | undefined = overrides[targetKey];
  if (!shouldRoll && usedRoll === undefined) return;
  if (shouldRoll && usedRoll === undefined) {
    usedRoll = rollDice(preview.sides);
  }
  if (overrides[targetKey] !== undefined) {
    setOverrides((prev) => ({ ...prev, [targetKey]: undefined }));
  }
  resolveViaRegistry(
    preview,
    feedItemId,
    usedRoll,
    setFeed,
    setCollapsed,
    setResolved
  );
}

function getRootPreviewNodes(
  action: DungeonAction,
  dungeonLevel: number
): DungeonRenderNode[] {
  if (action === 'door') {
    const { messages } = doorBeyondMessages({ detailMode: true });
    return messages.filter((message) => message.kind === 'table-preview');
  }
  const { messages } = passageMessages({
    detailMode: true,
    level: dungeonLevel,
  });
  return messages.filter((message) => message.kind === 'table-preview');
}

function formatPendingBadge(pendingCount: number): string {
  return `${pendingCount} pending ${pendingCount === 1 ? 'step' : 'steps'}`;
}

function formatPendingTitle(pendingCount: number): string {
  return `${pendingCount} ${
    pendingCount === 1 ? 'step is' : 'steps are'
  } still pending.`;
}

function collectPendingTargetIds(
  node?: DungeonOutcomeNode
): ReadonlySet<string> {
  const targets = new Set<string>();

  const walk = (current?: DungeonOutcomeNode) => {
    if (!current) return;
    if (current.type === 'pending-roll') {
      targets.add(current.id ?? current.table);
      return;
    }
    current.children?.forEach((child) => walk(child));
  };

  walk(node);
  return targets;
}

export { DungeonFeed, renderNode };

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
  FeedItem,
  PreviewInteractionController,
  PreviewScrollTarget,
} from './feedTypes';
import type {
  DungeonRenderNode,
  DungeonRollTrace,
  RollTraceItem,
} from '../../types/dungeon';
import {
  getDungeonTablePreviewTargetKey,
  isTargetedDungeonTablePreview,
} from '../../types/dungeon';

export function renderNode(
  node: DungeonRenderNode,
  key: number,
  feedItemId: string,
  previewController?: PreviewInteractionController,
  enablePreviewControls = true,
  pendingTargetIds?: ReadonlySet<string>,
  feedSequence?: number,
  feedItem?: FeedItem,
  scrollTarget?: PreviewScrollTarget | null,
  onPreviewScrollComplete?: (target: PreviewScrollTarget) => void
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
      const targetedPreview = isTargetedDungeonTablePreview(node)
        ? node
        : undefined;
      const targetKey = getDungeonTablePreviewTargetKey(node);
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
          onUseOverride={() => {
            if (!targetedPreview) return;
            previewController?.onResolvePreview({
              preview: targetedPreview,
              feedItemId,
              shouldRoll: false,
              feedSequence,
              feedItem,
            });
          }}
          onAutoRoll={() => {
            if (!targetedPreview) return;
            previewController?.onResolvePreview({
              preview: targetedPreview,
              feedItemId,
              shouldRoll: true,
              feedSequence,
              feedItem,
            });
          }}
          onEntrySelect={(value) => {
            if (!targetedPreview) return;
            previewController?.onResolvePreview({
              preview: targetedPreview,
              feedItemId,
              shouldRoll: false,
              explicitRoll: value,
              feedSequence,
              feedItem,
            });
          }}
          isCollapsed={isCollapsed}
          hasResolved={hasResolved}
          shouldScrollIntoView={
            scrollTarget?.feedItemId === feedItemId &&
            scrollTarget.targetKey === targetKey
          }
          onScrollIntoView={
            scrollTarget?.feedItemId === feedItemId &&
            scrollTarget.targetKey === targetKey
              ? () => onPreviewScrollComplete?.(scrollTarget)
              : undefined
          }
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

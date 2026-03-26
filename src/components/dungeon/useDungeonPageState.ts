import type { KeyboardEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import packageJson from '../../../package.json';
import {
  getRootPreviewNodes,
  resolveDungeonFeedPreview,
} from './dungeonFeedController';
import type {
  FeedItem,
  PreviewInteractionController,
  PreviewResolutionEntry,
  PreviewResolutionRequest,
} from './feedTypes';
import { runDungeonStep } from '../../dungeon/services/adapters';
import { rollDice } from '../../dungeon/helpers/dungeonLookup';
import {
  createDungeonRandomSession,
  withDungeonRandomSession,
} from '../../dungeon/helpers/dungeonRandom';
import {
  buildRenderCache,
  selectMessagesForMode,
} from '../../dungeon/helpers/renderCache';
import { countPendingNodes } from '../../dungeon/helpers/outcomeTree';
import type {
  DungeonAction,
  DungeonReplayInfo,
  DungeonReplayItem,
  DungeonRollSource,
} from '../../types/dungeon';

function createFeedItemId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useDungeonPageState() {
  const sessionRef = useRef(createDungeonRandomSession());
  const nextFeedSequenceRef = useRef(1);
  const replayItemsRef = useRef<DungeonReplayItem[]>([]);
  const runSeedRef = useRef<string>(sessionRef.current.seed);
  const [action, setAction] = useState<DungeonAction>('passage');
  const [rollInput, setRollInput] = useState<string>('');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [detailMode, setDetailMode] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<
    Record<string, number | undefined>
  >({});
  const [dungeonLevel, setDungeonLevel] = useState<number>(1);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [replayItems, setReplayItems] = useState<DungeonReplayItem[]>([]);
  const [replayStatus, setReplayStatus] = useState<string | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  const parsedRoll = useMemo(() => {
    const value = Number(rollInput);
    if (!Number.isInteger(value)) return undefined;
    return value;
  }, [rollInput]);

  const isValid = useMemo(() => {
    return parsedRoll !== undefined && parsedRoll >= 1 && parsedRoll <= 20;
  }, [parsedRoll]);

  const appendReplayItem = (item: DungeonReplayItem) => {
    const nextReplayItems = [...replayItemsRef.current, item];
    replayItemsRef.current = nextReplayItems;
    setReplayItems(nextReplayItems);
  };

  const addToFeed = (
    nextAction: DungeonAction,
    roll: number,
    rollSource: DungeonRollSource
  ) => {
    const sequence = nextFeedSequenceRef.current;
    nextFeedSequenceRef.current += 1;

    const step = runDungeonStep(nextAction, {
      roll,
      detailMode,
      level: dungeonLevel,
      session: sessionRef.current,
    });
    const renderCache = step.renderCache ?? buildRenderCache(step.outcome);
    const pendingCount = step.pendingCount ?? countPendingNodes(step.outcome);
    const messages = selectMessagesForMode(
      nextAction,
      detailMode,
      renderCache,
      step.messages
    );
    const item: FeedItem = {
      id: createFeedItemId(),
      sequence,
      action: nextAction,
      roll,
      level: dungeonLevel,
      outcome: step.outcome,
      renderCache,
      messages,
      pendingCount,
    };

    setReplayStatus(null);
    appendReplayItem({
      kind: 'root-step',
      feedStep: sequence,
      action: nextAction,
      roll,
      rollSource,
      detailMode,
      level: dungeonLevel,
    });
    setFeed((prev) => [item, ...prev]);
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `${nextAction} roll: ${roll}`;
    }
  };

  const submitManualRoll = () => {
    if (!isValid || parsedRoll === undefined) return;
    addToFeed(action, parsedRoll, 'manual');
  };

  const handleRoll = () => {
    const roll = withDungeonRandomSession(sessionRef.current, () =>
      rollDice(20)
    );
    setRollInput(String(roll));
    addToFeed(action, roll, 'auto');
  };

  const handleRollInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    submitManualRoll();
  };

  const recordPreviewResolution = (entry: PreviewResolutionEntry) => {
    setReplayStatus(null);
    appendReplayItem({
      kind: 'preview-resolution',
      feedStep: entry.feedStep,
      tableId: entry.tableId,
      targetId: entry.targetId,
      title: entry.title,
      roll: entry.roll,
      rollSource: entry.rollSource,
    });
  };

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
    setReplayStatus(null);
    resolveDungeonFeedPreview({
      preview: request.preview,
      feedItemId: request.feedItemId,
      shouldRoll: request.shouldRoll,
      feedSequence: request.feedSequence,
      feedItem: request.feedItem,
      session: sessionRef.current,
      overrides,
      setOverrides,
      setFeed,
      setCollapsed,
      setResolved,
      onResolved: recordPreviewResolution,
    });
  };

  const clearFeed = () => {
    const nextSession = createDungeonRandomSession();
    sessionRef.current = nextSession;
    nextFeedSequenceRef.current = 1;
    replayItemsRef.current = [];
    runSeedRef.current = nextSession.seed;
    setFeed([]);
    setRollInput('');
    setOverrides({});
    setCollapsed({});
    setResolved({});
    setReplayItems([]);
    setReplayStatus(null);
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = 'Dungeon feed cleared.';
    }
  };

  const copyReplayInfo = async () => {
    if (replayItemsRef.current.length === 0) return;

    const replayInfo: DungeonReplayInfo = {
      app: 'adnd-combat-tools',
      page: 'dungeon',
      version: packageJson.version,
      seed: runSeedRef.current,
      items: replayItemsRef.current,
    };

    const replayPayload = JSON.stringify(replayInfo, null, 2);
    let status = 'Replay info copied.';

    try {
      await navigator.clipboard.writeText(replayPayload);
    } catch (_error) {
      if (
        typeof window !== 'undefined' &&
        typeof window.prompt === 'function'
      ) {
        window.prompt('Copy replay info', replayPayload);
        status = 'Replay info opened for copy.';
      } else {
        status = 'Replay info copy unavailable.';
      }
    }

    setReplayStatus(status);
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = status;
    }
  };

  const rootPreviewNodes = useMemo(
    () => (detailMode ? getRootPreviewNodes(action, dungeonLevel) : []),
    [action, detailMode, dungeonLevel]
  );

  const previewController: PreviewInteractionController = {
    overrides,
    collapsed,
    resolved,
    onOverrideChange: handlePreviewOverrideChange,
    onResolvePreview: handlePreviewResolve,
    onToggleCollapse: handlePreviewCollapseToggle,
  };

  return {
    action,
    setAction,
    rollInput,
    setRollInput,
    feed,
    clearFeed,
    detailMode,
    setDetailMode,
    dungeonLevel,
    setDungeonLevel,
    rootPreviewNodes,
    previewController,
    liveRegionRef,
    isValid,
    handleRoll,
    handleRollInputKeyDown,
    copyReplayInfo,
    replayStatus,
    hasReplayInfo: replayItems.length > 0,
  };
}

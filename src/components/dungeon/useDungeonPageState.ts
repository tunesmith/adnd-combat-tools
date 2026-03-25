import type { KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import packageJson from '../../../package.json';
import { runDungeonStep } from '../../dungeon/services/adapters';
import { rollDice } from '../../dungeon/helpers/dungeonLookup';
import {
  createDungeonRandomSession,
  setActiveDungeonRandomSession,
} from '../../dungeon/helpers/dungeonRandom';
import {
  buildRenderCache,
  selectMessagesForMode,
  type RenderCache,
} from '../../dungeon/helpers/renderCache';
import { countPendingNodes } from '../../dungeon/helpers/outcomeTree';
import type {
  DungeonAction,
  DungeonRenderNode,
  DungeonReplayInfo,
  DungeonReplayItem,
  DungeonRollSource,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../../dungeon/domain/outcome';

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

  useEffect(() => {
    setActiveDungeonRandomSession(sessionRef.current);
    return () => {
      setActiveDungeonRandomSession(undefined);
    };
  }, []);

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
    const roll = rollDice(20);
    setRollInput(String(roll));
    addToFeed(action, roll, 'auto');
  };

  const handleRollInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    submitManualRoll();
  };

  const recordPreviewResolution = (entry: {
    feedStep: number;
    tableId: string;
    targetId: string;
    title: string;
    roll: number;
    rollSource: DungeonRollSource;
  }) => {
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

  const clearFeed = () => {
    const nextSession = createDungeonRandomSession();
    sessionRef.current = nextSession;
    nextFeedSequenceRef.current = 1;
    replayItemsRef.current = [];
    runSeedRef.current = nextSession.seed;
    setActiveDungeonRandomSession(nextSession);
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

  return {
    action,
    setAction,
    rollInput,
    setRollInput,
    feed,
    setFeed,
    clearFeed,
    detailMode,
    setDetailMode,
    overrides,
    setOverrides,
    dungeonLevel,
    setDungeonLevel,
    collapsed,
    setCollapsed,
    resolved,
    setResolved,
    liveRegionRef,
    isValid,
    handleRoll,
    handleRollInputKeyDown,
    copyReplayInfo,
    replayStatus,
    hasReplayInfo: replayItems.length > 0,
    recordPreviewResolution,
  };
}

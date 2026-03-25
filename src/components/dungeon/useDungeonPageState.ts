import type { KeyboardEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { runDungeonStep } from '../../dungeon/services/adapters';
import { rollDice } from '../../dungeon/helpers/dungeonLookup';
import {
  buildRenderCache,
  selectMessagesForMode,
  type RenderCache,
} from '../../dungeon/helpers/renderCache';
import { countPendingNodes } from '../../dungeon/helpers/outcomeTree';
import type { DungeonAction, DungeonRenderNode } from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../../dungeon/domain/outcome';

export type FeedItem = {
  id: string;
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
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  const parsedRoll = useMemo(() => {
    const value = Number(rollInput);
    if (!Number.isInteger(value)) return undefined;
    return value;
  }, [rollInput]);

  const isValid = useMemo(() => {
    return parsedRoll !== undefined && parsedRoll >= 1 && parsedRoll <= 20;
  }, [parsedRoll]);

  const addToFeed = (nextAction: DungeonAction, roll: number) => {
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
      action: nextAction,
      roll,
      level: dungeonLevel,
      outcome: step.outcome,
      renderCache,
      messages,
      pendingCount,
    };
    setFeed((prev) => [item, ...prev]);
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `${nextAction} roll: ${roll}`;
    }
  };

  const submitManualRoll = () => {
    if (!isValid || parsedRoll === undefined) return;
    addToFeed(action, parsedRoll);
  };

  const handleRoll = () => {
    const roll = rollDice(20);
    setRollInput(String(roll));
    addToFeed(action, roll);
  };

  const handleRollInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    submitManualRoll();
  };

  return {
    action,
    setAction,
    rollInput,
    setRollInput,
    feed,
    setFeed,
    clearFeed: () => setFeed([]),
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
  };
}

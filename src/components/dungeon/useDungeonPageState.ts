import type { KeyboardEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { getRootPreviewNodes } from './dungeonFeedController';
import { executeDungeonRootStep } from './dungeonStepController';
import type { FeedItem } from './feedTypes';
import { useDungeonPreviewState } from './useDungeonPreviewState';
import { useDungeonReplayState } from './useDungeonReplayState';
import { rollDice } from '../../dungeon/helpers/dungeonLookup';
import {
  createDungeonRandomSession,
  withDungeonRandomSession,
} from '../../dungeon/helpers/dungeonRandom';
import type { DungeonAction, DungeonRollSource } from '../../types/dungeon';

export function useDungeonPageState() {
  const sessionRef = useRef(createDungeonRandomSession());
  const nextFeedSequenceRef = useRef(1);
  const [action, setAction] = useState<DungeonAction>('passage');
  const [rollInput, setRollInput] = useState<string>('');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [detailMode, setDetailMode] = useState<boolean>(false);
  const [dungeonLevel, setDungeonLevel] = useState<number>(1);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  const announce = (message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  };

  const {
    replayStatus,
    hasReplayInfo,
    clearReplayStatus,
    recordRootStep,
    recordPreviewResolution,
    resetReplay,
    copyReplayInfo,
  } = useDungeonReplayState({
    initialSeed: sessionRef.current.seed,
    announce,
  });

  const { previewController, resetPreviewState } = useDungeonPreviewState({
    sessionRef,
    setFeed,
    onInteraction: clearReplayStatus,
    onResolved: recordPreviewResolution,
  });

  const parsedRoll = useMemo(() => {
    const value = Number(rollInput);
    if (!Number.isInteger(value)) return undefined;
    return value;
  }, [rollInput]);

  const isValid = useMemo(() => {
    return parsedRoll !== undefined && parsedRoll >= 1 && parsedRoll <= 20;
  }, [parsedRoll]);

  const addToFeed = (
    nextAction: DungeonAction,
    roll: number,
    rollSource: DungeonRollSource
  ) => {
    const sequence = nextFeedSequenceRef.current;
    nextFeedSequenceRef.current += 1;

    const { feedItem, replayItem, announcement } = executeDungeonRootStep({
      action: nextAction,
      roll,
      sequence,
      rollSource,
      detailMode,
      level: dungeonLevel,
      session: sessionRef.current,
    });

    recordRootStep(replayItem);
    setFeed((prev) => [feedItem, ...prev]);
    announce(announcement);
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

  const clearFeed = () => {
    const nextSession = createDungeonRandomSession();
    sessionRef.current = nextSession;
    nextFeedSequenceRef.current = 1;
    setFeed([]);
    setRollInput('');
    resetPreviewState();
    resetReplay(nextSession.seed);
    announce('Dungeon feed cleared.');
  };

  const rootPreviewNodes = useMemo(
    () => (detailMode ? getRootPreviewNodes(action, dungeonLevel) : []),
    [action, detailMode, dungeonLevel]
  );

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
    hasReplayInfo,
  };
}

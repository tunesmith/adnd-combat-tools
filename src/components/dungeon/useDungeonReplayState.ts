import { useRef, useState } from 'react';
import packageJson from '../../../package.json';
import type { DungeonReplayInfo, DungeonReplayItem } from '../../types/dungeon';
import type { PreviewResolutionEntry } from './feedTypes';

type RootStepReplayItem = Extract<DungeonReplayItem, { kind: 'root-step' }>;

export function useDungeonReplayState(options: {
  initialSeed: string;
  announce?: (message: string) => void;
}) {
  const replayItemsRef = useRef<DungeonReplayItem[]>([]);
  const runSeedRef = useRef<string>(options.initialSeed);
  const [replayItems, setReplayItems] = useState<DungeonReplayItem[]>([]);
  const [replayStatus, setReplayStatus] = useState<string | null>(null);

  const appendReplayItem = (item: DungeonReplayItem) => {
    const nextReplayItems = [...replayItemsRef.current, item];
    replayItemsRef.current = nextReplayItems;
    setReplayItems(nextReplayItems);
  };

  const clearReplayStatus = () => {
    setReplayStatus(null);
  };

  const recordRootStep = (item: Omit<RootStepReplayItem, 'kind'>) => {
    setReplayStatus(null);
    appendReplayItem({
      kind: 'root-step',
      ...item,
    });
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

  const resetReplay = (seed: string) => {
    replayItemsRef.current = [];
    runSeedRef.current = seed;
    setReplayItems([]);
    setReplayStatus(null);
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
    options.announce?.(status);
  };

  return {
    replayStatus,
    hasReplayInfo: replayItems.length > 0,
    clearReplayStatus,
    recordRootStep,
    recordPreviewResolution,
    resetReplay,
    copyReplayInfo,
  };
}

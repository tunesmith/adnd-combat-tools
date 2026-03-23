import { passageMessages } from './passageMessages';
import { doorBeyondMessages } from './doorBeyondMessages';
import type { DungeonAction, DungeonStep } from '../../types/dungeon';

export function runDungeonStep(
  action: DungeonAction,
  options?: {
    roll?: number;
    doorAhead?: boolean;
    detailMode?: boolean;
    level?: number;
  }
): DungeonStep {
  switch (action) {
    case 'passage': {
      const { messages, outcome, renderCache, pendingCount } = passageMessages({
        roll: options?.roll,
        detailMode: options?.detailMode,
        level: options?.level,
      });
      return {
        action,
        roll: options?.roll,
        outcome,
        messages,
        renderCache,
        pendingCount,
      };
    }
    case 'door': {
      const { messages, outcome, renderCache, pendingCount } =
        doorBeyondMessages({
          roll: options?.roll,
          doorAhead: options?.doorAhead,
          detailMode: options?.detailMode,
          level: options?.level,
        });
      return {
        action,
        roll: options?.roll,
        outcome,
        messages,
        renderCache,
        pendingCount,
      };
    }
  }
}

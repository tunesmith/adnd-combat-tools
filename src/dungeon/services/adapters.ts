import { passageMessages } from './passage';
import { doorBeyondMessages } from './doorBeyondResult';
import type { DungeonAction, DungeonStep } from '../../types/dungeon';

export function runDungeonStep(
  action: DungeonAction,
  options?: {
    roll?: number;
    doorAhead?: boolean;
    detailMode?: boolean;
    level?: number;
    takeOverride?: (tableId: string) => number | undefined;
  }
): DungeonStep {
  switch (action) {
    case 'passage': {
      const { messages, outcome } = passageMessages({
        roll: options?.roll,
        detailMode: options?.detailMode,
        level: options?.level,
      });
      return { action, roll: options?.roll, outcome, messages };
    }
    case 'door': {
      const { messages, outcome } = doorBeyondMessages({
        roll: options?.roll,
        doorAhead: options?.doorAhead,
        detailMode: options?.detailMode,
        takeOverride: options?.takeOverride,
      });
      return { action, roll: options?.roll, outcome, messages };
    }
  }
}

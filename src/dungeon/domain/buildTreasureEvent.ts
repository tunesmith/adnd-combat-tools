import type { OutcomeEvent } from './outcome';
import type { Command } from '../../tables/dungeon/dungeonTypes';

type TreasureSubtableOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function buildTreasureEvent(
  kind: OutcomeEvent['kind'],
  command: Command,
  roll: number,
  options?: TreasureSubtableOptions
): OutcomeEvent {
  return {
    kind,
    result: command,
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? roll,
    rollIndex: options?.rollIndex,
  } as OutcomeEvent;
}

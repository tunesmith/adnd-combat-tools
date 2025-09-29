import type { Table } from './dungeonTypes';

export enum TreasureRingElementalCommand {
  Air,
  Earth,
  Fire,
  Water,
}

export const treasureRingElementalCommand: Table<TreasureRingElementalCommand> =
  {
    sides: 4,
    entries: [
      { range: [1], command: TreasureRingElementalCommand.Air },
      { range: [2], command: TreasureRingElementalCommand.Earth },
      { range: [3], command: TreasureRingElementalCommand.Fire },
      { range: [4], command: TreasureRingElementalCommand.Water },
    ],
  };

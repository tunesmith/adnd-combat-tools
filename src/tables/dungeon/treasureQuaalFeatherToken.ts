import type { Table } from './dungeonTypes';

export enum TreasureQuaalFeatherToken {
  Anchor,
  Bird,
  Fan,
  SwanBoat,
  Tree,
  Whip,
}

export const treasureQuaalFeatherToken: Table<TreasureQuaalFeatherToken> = {
  sides: 20,
  entries: [
    { range: [1, 4], command: TreasureQuaalFeatherToken.Anchor },
    { range: [5, 7], command: TreasureQuaalFeatherToken.Bird },
    { range: [8, 10], command: TreasureQuaalFeatherToken.Fan },
    { range: [11, 13], command: TreasureQuaalFeatherToken.SwanBoat },
    { range: [14, 18], command: TreasureQuaalFeatherToken.Tree },
    { range: [19, 20], command: TreasureQuaalFeatherToken.Whip },
  ],
};

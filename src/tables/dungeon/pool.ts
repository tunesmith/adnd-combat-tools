import { Table } from "./dungeonTypes";

export enum Pool {
  NoPool,
  PoolNoMonster,
  PoolMonster,
  PoolMonsterTreasure,
  MagicPool,
}

export const pool: Table = {
  sides: 20,
  entries: [
    { range: [1, 8], command: Pool.NoPool },
    { range: [9, 10], command: Pool.PoolNoMonster },
    { range: [11, 12], command: Pool.PoolMonster },
    { range: [13, 18], command: Pool.PoolMonsterTreasure },
    { range: [19, 20], command: Pool.MagicPool },
  ],
};

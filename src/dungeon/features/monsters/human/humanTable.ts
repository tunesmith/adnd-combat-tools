import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum Human {
  Bandit_5to15,
  Berserker_3to9,
  Brigand_5to15,
  Character,
}

export const human: Table<Human> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: Human.Bandit_5to15 },
    { range: [26, 30], command: Human.Berserker_3to9 },
    { range: [31, 45], command: Human.Brigand_5to15 },
    { range: [46, 100], command: Human.Character },
  ],
};

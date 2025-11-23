import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum Stairs {
  DownOne,
  DownTwo,
  DownThree,
  UpOne,
  UpDead,
  DownDead,
  ChimneyUpOne,
  ChimneyUpTwo,
  ChimneyDownTwo,
  TrapDoorDownOne,
  TrapDownDownTwo,
  UpOneDownTwo,
}

export const stairs: Table<Stairs> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: Stairs.DownOne },
    { range: [6], command: Stairs.DownTwo },
    { range: [7], command: Stairs.DownThree },
    { range: [8], command: Stairs.UpOne },
    { range: [9], command: Stairs.UpDead },
    { range: [10], command: Stairs.DownDead },
    { range: [11], command: Stairs.ChimneyUpOne },
    { range: [12], command: Stairs.ChimneyUpTwo },
    { range: [13], command: Stairs.ChimneyDownTwo },
    { range: [14, 16], command: Stairs.TrapDoorDownOne },
    { range: [17], command: Stairs.TrapDownDownTwo },
    { range: [18, 20], command: Stairs.UpOneDownTwo },
  ],
};

export enum Egress {
  Closed,
  Open,
}

export const egressOne: Table<Egress> = {
  sides: 20,
  entries: [
    { range: [1], command: Egress.Closed },
    { range: [2, 20], command: Egress.Open },
  ],
};

export const egressTwo: Table<Egress> = {
  sides: 20,
  entries: [
    { range: [1, 2], command: Egress.Closed },
    { range: [3, 20], command: Egress.Open },
  ],
};

export const egressThree: Table<Egress> = {
  sides: 20,
  entries: [
    { range: [1, 3], command: Egress.Closed },
    { range: [4, 20], command: Egress.Open },
  ],
};

export enum Chute {
  Exists,
  DoesNotExist,
}

export const chute: Table<Chute> = {
  sides: 6,
  entries: [
    { range: [1], command: Chute.Exists },
    { range: [2, 6], command: Chute.DoesNotExist },
  ],
};

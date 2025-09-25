import type { Table } from './dungeonTypes';

export enum IllusoryWallNature {
  Pit,
  Chute,
  Chamber,
}

export const illusoryWallNature: Table<IllusoryWallNature> = {
  sides: 20,
  entries: [
    { range: [1, 6], command: IllusoryWallNature.Pit },
    { range: [7, 10], command: IllusoryWallNature.Chute },
    { range: [11, 20], command: IllusoryWallNature.Chamber },
  ],
};

import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum IllusionaryWallNature {
  Pit,
  Chute,
  Chamber,
}

export const illusionaryWallNature: Table<IllusionaryWallNature> = {
  sides: 20,
  entries: [
    { range: [1, 6], command: IllusionaryWallNature.Pit },
    { range: [7, 10], command: IllusionaryWallNature.Chute },
    { range: [11, 20], command: IllusionaryWallNature.Chamber },
  ],
};

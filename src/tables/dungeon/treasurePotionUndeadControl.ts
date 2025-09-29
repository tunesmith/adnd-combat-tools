import type { Table } from './dungeonTypes';

export enum TreasurePotionUndeadControl {
  Ghasts,
  Ghosts,
  Ghouls,
  Shadows,
  Skeletons,
  Spectres,
  Wights,
  Wraiths,
  Vampires,
  Zombies,
}

export const treasurePotionUndeadControl: Table<TreasurePotionUndeadControl> = {
  sides: 10,
  entries: [
    { range: [1], command: TreasurePotionUndeadControl.Ghasts },
    { range: [2], command: TreasurePotionUndeadControl.Ghosts },
    { range: [3], command: TreasurePotionUndeadControl.Ghouls },
    { range: [4], command: TreasurePotionUndeadControl.Shadows },
    { range: [5], command: TreasurePotionUndeadControl.Skeletons },
    { range: [6], command: TreasurePotionUndeadControl.Spectres },
    { range: [7], command: TreasurePotionUndeadControl.Wights },
    { range: [8], command: TreasurePotionUndeadControl.Wraiths },
    { range: [9], command: TreasurePotionUndeadControl.Vampires },
    { range: [10], command: TreasurePotionUndeadControl.Zombies },
  ],
};

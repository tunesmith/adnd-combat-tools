import type { Table } from './dungeonTypes';

export enum TreasureRingContrariness {
  Flying,
  Invisibility,
  Levitation,
  ShockingGrasp,
  SpellTurning,
  Strength,
}

export const treasureRingContrariness: Table<TreasureRingContrariness> = {
  sides: 100,
  entries: [
    { range: [1, 20], command: TreasureRingContrariness.Flying },
    { range: [21, 40], command: TreasureRingContrariness.Invisibility },
    { range: [41, 60], command: TreasureRingContrariness.Levitation },
    { range: [61, 70], command: TreasureRingContrariness.ShockingGrasp },
    { range: [71, 80], command: TreasureRingContrariness.SpellTurning },
    { range: [81, 100], command: TreasureRingContrariness.Strength },
  ],
};

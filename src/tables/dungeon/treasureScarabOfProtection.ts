import type { Table } from './dungeonTypes';

export enum TreasureScarabOfProtectionCurse {
  Normal,
  Cursed,
}

export enum TreasureScarabOfProtectionCurseResolution {
  Permanent,
  Removable,
}

export const treasureScarabOfProtectionCurse: Table<TreasureScarabOfProtectionCurse> =
  {
    sides: 20,
    entries: [
      { range: [1], command: TreasureScarabOfProtectionCurse.Cursed },
      { range: [2, 20], command: TreasureScarabOfProtectionCurse.Normal },
    ],
  };

export const treasureScarabOfProtectionCursedResolution: Table<TreasureScarabOfProtectionCurseResolution> =
  {
    sides: 5,
    entries: [
      {
        range: [1],
        command: TreasureScarabOfProtectionCurseResolution.Removable,
      },
      {
        range: [2, 5],
        command: TreasureScarabOfProtectionCurseResolution.Permanent,
      },
    ],
  };

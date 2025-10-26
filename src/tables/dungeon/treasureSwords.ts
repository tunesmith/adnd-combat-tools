import type { Table } from './dungeonTypes';

export enum TreasureSword {
  SwordPlus1,
  SwordPlus1Plus2VsMagicUsers,
  SwordPlus1Plus3VsLycanthropes,
  SwordPlus1Plus3VsRegenerating,
  SwordPlus1Plus4VsReptiles,
  SwordPlus1FlameTongue,
  SwordPlus1LuckBlade,
  SwordPlus2,
  SwordPlus2GiantSlayer,
  SwordPlus2DragonSlayer,
  SwordPlus2NineLivesStealer,
  SwordPlus3,
  SwordPlus3FrostBrand,
  SwordPlus4,
  SwordPlus4Defender,
  SwordPlus5,
  SwordPlus5Defender,
  SwordPlus5HolyAvenger,
  SwordOfDancing,
  SwordOfWounding,
  SwordOfLifeStealing,
  SwordOfSharpness,
  SwordVorpalWeapon,
  SwordPlus1Cursed,
  SwordMinus2Cursed,
  SwordCursedBerserking,
}

export enum TreasureSwordKind {
  Longsword,
  Broadsword,
  ShortSword,
  BastardSword,
  TwoHandedSword,
}

export enum TreasureSwordUnusual {
  Normal,
}

export const treasureSwords: Table<TreasureSword> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasureSword.SwordPlus1 },
    { range: [26, 30], command: TreasureSword.SwordPlus1Plus2VsMagicUsers },
    { range: [31, 35], command: TreasureSword.SwordPlus1Plus3VsLycanthropes },
    { range: [36, 40], command: TreasureSword.SwordPlus1Plus3VsRegenerating },
    { range: [41, 45], command: TreasureSword.SwordPlus1Plus4VsReptiles },
    { range: [46, 49], command: TreasureSword.SwordPlus1FlameTongue },
    { range: [50], command: TreasureSword.SwordPlus1LuckBlade },
    { range: [51, 58], command: TreasureSword.SwordPlus2 },
    { range: [59, 62], command: TreasureSword.SwordPlus2GiantSlayer },
    { range: [63, 66], command: TreasureSword.SwordPlus2DragonSlayer },
    { range: [67], command: TreasureSword.SwordPlus2NineLivesStealer },
    { range: [68, 71], command: TreasureSword.SwordPlus3 },
    { range: [72, 74], command: TreasureSword.SwordPlus3FrostBrand },
    { range: [75, 76], command: TreasureSword.SwordPlus4 },
    { range: [77], command: TreasureSword.SwordPlus4Defender },
    { range: [78], command: TreasureSword.SwordPlus5 },
    { range: [79], command: TreasureSword.SwordPlus5Defender },
    { range: [80], command: TreasureSword.SwordPlus5HolyAvenger },
    { range: [81], command: TreasureSword.SwordOfDancing },
    { range: [82], command: TreasureSword.SwordOfWounding },
    { range: [83], command: TreasureSword.SwordOfLifeStealing },
    { range: [84], command: TreasureSword.SwordOfSharpness },
    { range: [85], command: TreasureSword.SwordVorpalWeapon },
    { range: [86, 90], command: TreasureSword.SwordPlus1Cursed },
    { range: [91, 95], command: TreasureSword.SwordMinus2Cursed },
    { range: [96, 100], command: TreasureSword.SwordCursedBerserking },
  ],
};

export const treasureSwordKind: Table<TreasureSwordKind> = {
  sides: 100,
  entries: [
    { range: [1, 70], command: TreasureSwordKind.Longsword },
    { range: [71, 90], command: TreasureSwordKind.Broadsword },
    { range: [91, 95], command: TreasureSwordKind.ShortSword },
    { range: [96, 99], command: TreasureSwordKind.BastardSword },
    { range: [100], command: TreasureSwordKind.TwoHandedSword },
  ],
};

export const treasureSwordUnusual: Table<TreasureSwordUnusual> = {
  sides: 100,
  entries: [
    { range: [1, 100], command: TreasureSwordUnusual.Normal },
  ],
};

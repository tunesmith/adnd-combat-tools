import type { Table, Entry } from './dungeonTypes';
import {
  TreasureSwordAlignment,
  SWORD_ALIGNMENT_DETAILS,
} from './treasureSwordAlignment';

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

export enum TreasureSwordDragonSlayerColor {
  Black,
  Blue,
  Brass,
  Bronze,
  Copper,
  Gold,
  Green,
  Red,
  Silver,
  White,
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
  Intelligence12,
  Intelligence13,
  Intelligence14,
  Intelligence15,
  Intelligence16,
  Intelligence17,
}

export enum TreasureSwordPrimaryAbility {
  DetectShiftingRooms,
  DetectSlopingPassages,
  DetectLargeTraps,
  DetectAlignment,
  DetectPreciousMetals,
  DetectGems,
  DetectMagic,
  DetectSecretDoors,
  DetectInvisibleObjects,
  LocateObject,
  ExtraordinaryPower,
}

export enum TreasureSwordPrimaryAbilityCommand {
  DetectShiftingRooms,
  DetectSlopingPassages,
  DetectLargeTraps,
  DetectAlignment,
  DetectPreciousMetals,
  DetectGems,
  DetectMagic,
  DetectSecretDoors,
  DetectInvisibleObjects,
  LocateObject,
  RollTwice,
  ExtraordinaryPower,
}

export enum TreasureSwordExtraordinaryPower {
  CharmPersonOnContact,
  Clairaudience,
  Clairvoyance,
  DetermineDirectionsAndDepth,
  Esp,
  Flying,
  Heal,
  Illusion,
  Levitation,
  Strength,
  Telekinesis,
  Telepathy,
  Teleportation,
  XRayVision,
  ChooseAny,
  ChooseAnyAndSpecialPurpose,
}

export enum TreasureSwordExtraordinaryPowerCommand {
  CharmPersonOnContact,
  Clairaudience,
  Clairvoyance,
  DetermineDirectionsAndDepth,
  Esp,
  Flying,
  Heal,
  Illusion,
  Levitation,
  Strength,
  Telekinesis,
  Telepathy,
  Teleportation,
  XRayVision,
  RollTwice,
  ChooseAny,
  ChooseAnyAndSpecialPurpose,
}

export enum TreasureSwordSpecialPurpose {
  DefeatOpposedAlignment,
  KillClerics,
  KillFighters,
  KillMagicUsers,
  KillThieves,
  KillBardsOrMonks,
  OverthrowLawOrChaos,
  SlayGoodOrEvil,
  SlayNonHumanMonsters,
}

export enum TreasureSwordSpecialPurposeCommand {
  DefeatOpposedAlignment,
  KillClerics,
  KillFighters,
  KillMagicUsers,
  KillThieves,
  KillBardsOrMonks,
  OverthrowLawOrChaos,
  SlayGoodOrEvil,
  SlayNonHumanMonsters,
}

export enum TreasureSwordSpecialPurposePower {
  Blindness,
  Confusion,
  Disintegrate,
  Fear,
  Insanity,
  Paralysis,
  SavingThrowBonus,
}

export enum TreasureSwordSpecialPurposePowerCommand {
  Blindness,
  Confusion,
  Disintegrate,
  Fear,
  Insanity,
  Paralysis,
  SavingThrowBonus,
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
    { range: [1, 75], command: TreasureSwordUnusual.Normal },
    { range: [76, 83], command: TreasureSwordUnusual.Intelligence12 },
    { range: [84, 89], command: TreasureSwordUnusual.Intelligence13 },
    { range: [90, 94], command: TreasureSwordUnusual.Intelligence14 },
    { range: [95, 97], command: TreasureSwordUnusual.Intelligence15 },
    { range: [98, 99], command: TreasureSwordUnusual.Intelligence16 },
    { range: [100], command: TreasureSwordUnusual.Intelligence17 },
  ],
};

type SwordCommunicationMode =
  | 'none'
  | 'semi-empathy'
  | 'empathy'
  | 'speech'
  | 'speech and telepathy';

type SwordLanguageCapability = 'none' | 'mundane' | 'magical';

type SwordUnusualDetails = {
  label: string;
  category: 'normal' | 'intelligent';
  intelligence?: number;
  primaryAbilityCount: number;
  communication: SwordCommunicationMode;
  communicationNotes?: string;
  languageCapability: SwordLanguageCapability;
  extraordinaryPower: boolean;
  requiresAlignment: boolean;
  languagesKnown?: number;
};

export type TreasureSwordUnusualResult = SwordUnusualDetails & {
  variant: TreasureSwordUnusual;
  languagesKnown?: number;
};

type DragonSlayerColorDetail = {
  label: string;
  alignment: TreasureSwordAlignment;
};

export const SWORD_UNUSUAL_DETAILS: Record<
  TreasureSwordUnusual,
  SwordUnusualDetails
> = {
  [TreasureSwordUnusual.Normal]: {
    label: 'Not unusual',
    category: 'normal',
    primaryAbilityCount: 0,
    communication: 'none',
    languageCapability: 'none',
    extraordinaryPower: false,
    requiresAlignment: false,
  },
  [TreasureSwordUnusual.Intelligence12]: {
    label: 'Intelligence 12 (1 primary ability, semi-empathy)',
    category: 'intelligent',
    intelligence: 12,
    primaryAbilityCount: 1,
    communication: 'semi-empathy',
    communicationNotes:
      'The possessor senses urges when its ability functions.',
    languageCapability: 'none',
    extraordinaryPower: false,
    requiresAlignment: true,
  },
  [TreasureSwordUnusual.Intelligence13]: {
    label: 'Intelligence 13 (2 primary abilities, empathy)',
    category: 'intelligent',
    intelligence: 13,
    primaryAbilityCount: 2,
    communication: 'empathy',
    languageCapability: 'none',
    extraordinaryPower: false,
    requiresAlignment: true,
  },
  [TreasureSwordUnusual.Intelligence14]: {
    label: 'Intelligence 14 (2 primary abilities, speech)',
    category: 'intelligent',
    intelligence: 14,
    primaryAbilityCount: 2,
    communication: 'speech',
    languageCapability: 'none',
    extraordinaryPower: false,
    requiresAlignment: true,
  },
  [TreasureSwordUnusual.Intelligence15]: {
    label:
      'Intelligence 15 (3 primary abilities, speech, reads languages/maps)',
    category: 'intelligent',
    intelligence: 15,
    primaryAbilityCount: 3,
    communication: 'speech',
    languageCapability: 'mundane',
    extraordinaryPower: false,
    requiresAlignment: true,
  },
  [TreasureSwordUnusual.Intelligence16]: {
    label:
      'Intelligence 16 (3 primary abilities, speech, reads magical writings)',
    category: 'intelligent',
    intelligence: 16,
    primaryAbilityCount: 3,
    communication: 'speech',
    languageCapability: 'magical',
    extraordinaryPower: false,
    requiresAlignment: true,
  },
  [TreasureSwordUnusual.Intelligence17]: {
    label:
      'Intelligence 17 (3 primary abilities, extraordinary power, speech & telepathy)',
    category: 'intelligent',
    intelligence: 17,
    primaryAbilityCount: 3,
    communication: 'speech and telepathy',
    communicationNotes: 'Speaks and can communicate telepathically at will.',
    languageCapability: 'magical',
    extraordinaryPower: true,
    requiresAlignment: true,
  },
};

const DRAGON_SLAYER_COLOR_ORDER: TreasureSwordDragonSlayerColor[] = [
  TreasureSwordDragonSlayerColor.Black,
  TreasureSwordDragonSlayerColor.Blue,
  TreasureSwordDragonSlayerColor.Brass,
  TreasureSwordDragonSlayerColor.Bronze,
  TreasureSwordDragonSlayerColor.Copper,
  TreasureSwordDragonSlayerColor.Gold,
  TreasureSwordDragonSlayerColor.Green,
  TreasureSwordDragonSlayerColor.Red,
  TreasureSwordDragonSlayerColor.Silver,
  TreasureSwordDragonSlayerColor.White,
];

export const DRAGON_SLAYER_COLOR_DETAILS: Record<
  TreasureSwordDragonSlayerColor,
  DragonSlayerColorDetail
> = {
  [TreasureSwordDragonSlayerColor.Black]: {
    label: 'Black',
    alignment: TreasureSwordAlignment.ChaoticEvil,
  },
  [TreasureSwordDragonSlayerColor.Blue]: {
    label: 'Blue',
    alignment: TreasureSwordAlignment.LawfulEvil,
  },
  [TreasureSwordDragonSlayerColor.Brass]: {
    label: 'Brass',
    alignment: TreasureSwordAlignment.ChaoticGood,
  },
  [TreasureSwordDragonSlayerColor.Bronze]: {
    label: 'Bronze',
    alignment: TreasureSwordAlignment.LawfulGood,
  },
  [TreasureSwordDragonSlayerColor.Copper]: {
    label: 'Copper',
    alignment: TreasureSwordAlignment.ChaoticGood,
  },
  [TreasureSwordDragonSlayerColor.Gold]: {
    label: 'Gold',
    alignment: TreasureSwordAlignment.LawfulGood,
  },
  [TreasureSwordDragonSlayerColor.Green]: {
    label: 'Green',
    alignment: TreasureSwordAlignment.LawfulEvil,
  },
  [TreasureSwordDragonSlayerColor.Red]: {
    label: 'Red',
    alignment: TreasureSwordAlignment.ChaoticEvil,
  },
  [TreasureSwordDragonSlayerColor.Silver]: {
    label: 'Silver',
    alignment: TreasureSwordAlignment.LawfulGood,
  },
  [TreasureSwordDragonSlayerColor.White]: {
    label: 'White',
    alignment: TreasureSwordAlignment.ChaoticEvil,
  },
};

function buildDragonSlayerColorTable(
  colors: TreasureSwordDragonSlayerColor[]
): Table<TreasureSwordDragonSlayerColor> {
  const entries = colors.map((color, index) => ({
    range: [index + 1],
    command: color,
  })) as Entry<TreasureSwordDragonSlayerColor>[];
  if (entries.length === 0) {
    throw new Error(
      'Dragon slayer color table must contain at least one entry'
    );
  }
  return {
    sides: colors.length,
    entries: entries as [
      Entry<TreasureSwordDragonSlayerColor>,
      ...Entry<TreasureSwordDragonSlayerColor>[]
    ],
  };
}

const treasureSwordDragonSlayerColor: Table<TreasureSwordDragonSlayerColor> =
  buildDragonSlayerColorTable(DRAGON_SLAYER_COLOR_ORDER);

const treasureSwordDragonSlayerColorLawfulGood = buildDragonSlayerColorTable(
  DRAGON_SLAYER_COLOR_ORDER.filter(
    (color) =>
      DRAGON_SLAYER_COLOR_DETAILS[color].alignment !==
      TreasureSwordAlignment.LawfulGood
  )
);

const treasureSwordDragonSlayerColorChaoticGood = buildDragonSlayerColorTable(
  DRAGON_SLAYER_COLOR_ORDER.filter(
    (color) =>
      DRAGON_SLAYER_COLOR_DETAILS[color].alignment !==
      TreasureSwordAlignment.ChaoticGood
  )
);

const treasureSwordDragonSlayerColorLawfulEvil = buildDragonSlayerColorTable(
  DRAGON_SLAYER_COLOR_ORDER.filter(
    (color) =>
      DRAGON_SLAYER_COLOR_DETAILS[color].alignment !==
      TreasureSwordAlignment.LawfulEvil
  )
);

const treasureSwordDragonSlayerColorChaoticEvil = buildDragonSlayerColorTable(
  DRAGON_SLAYER_COLOR_ORDER.filter(
    (color) =>
      DRAGON_SLAYER_COLOR_DETAILS[color].alignment !==
      TreasureSwordAlignment.ChaoticEvil
  )
);

export function dragonSlayerColorTableForAlignment(
  alignment?: TreasureSwordAlignment
): Table<TreasureSwordDragonSlayerColor> {
  switch (alignment) {
    case TreasureSwordAlignment.LawfulGood:
      return treasureSwordDragonSlayerColorLawfulGood;
    case TreasureSwordAlignment.ChaoticGood:
      return treasureSwordDragonSlayerColorChaoticGood;
    case TreasureSwordAlignment.LawfulEvil:
      return treasureSwordDragonSlayerColorLawfulEvil;
    case TreasureSwordAlignment.ChaoticEvil:
      return treasureSwordDragonSlayerColorChaoticEvil;
    default:
      return treasureSwordDragonSlayerColor;
  }
}

export const treasureSwordPrimaryAbility: Table<TreasureSwordPrimaryAbilityCommand> =
  {
    sides: 100,
    entries: [
      {
        range: [1, 11],
        command: TreasureSwordPrimaryAbilityCommand.DetectShiftingRooms,
      },
      {
        range: [12, 22],
        command: TreasureSwordPrimaryAbilityCommand.DetectSlopingPassages,
      },
      {
        range: [23, 33],
        command: TreasureSwordPrimaryAbilityCommand.DetectLargeTraps,
      },
      {
        range: [34, 44],
        command: TreasureSwordPrimaryAbilityCommand.DetectAlignment,
      },
      {
        range: [45, 55],
        command: TreasureSwordPrimaryAbilityCommand.DetectPreciousMetals,
      },
      {
        range: [56, 66],
        command: TreasureSwordPrimaryAbilityCommand.DetectGems,
      },
      {
        range: [67, 77],
        command: TreasureSwordPrimaryAbilityCommand.DetectMagic,
      },
      {
        range: [78, 82],
        command: TreasureSwordPrimaryAbilityCommand.DetectSecretDoors,
      },
      {
        range: [83, 87],
        command: TreasureSwordPrimaryAbilityCommand.DetectInvisibleObjects,
      },
      {
        range: [88, 92],
        command: TreasureSwordPrimaryAbilityCommand.LocateObject,
      },
      {
        range: [93, 98],
        command: TreasureSwordPrimaryAbilityCommand.RollTwice,
      },
      {
        range: [99, 100],
        command: TreasureSwordPrimaryAbilityCommand.ExtraordinaryPower,
      },
    ],
  };

type PrimaryAbilityEntry = typeof treasureSwordPrimaryAbility.entries[number];

const PRIMARY_ABILITY_RESTRICTED_ENTRIES =
  treasureSwordPrimaryAbility.entries.filter(({ range }) => range[0] <= 92) as [
    PrimaryAbilityEntry,
    ...PrimaryAbilityEntry[]
  ];

export const treasureSwordPrimaryAbilityRestricted: Table<TreasureSwordPrimaryAbilityCommand> =
  {
    sides: 92,
    entries: PRIMARY_ABILITY_RESTRICTED_ENTRIES,
  };

export const treasureSwordExtraordinaryPower: Table<TreasureSwordExtraordinaryPowerCommand> =
  {
    sides: 100,
    entries: [
      {
        range: [1, 7],
        command: TreasureSwordExtraordinaryPowerCommand.CharmPersonOnContact,
      },
      {
        range: [8, 15],
        command: TreasureSwordExtraordinaryPowerCommand.Clairaudience,
      },
      {
        range: [16, 22],
        command: TreasureSwordExtraordinaryPowerCommand.Clairvoyance,
      },
      {
        range: [23, 28],
        command:
          TreasureSwordExtraordinaryPowerCommand.DetermineDirectionsAndDepth,
      },
      {
        range: [29, 34],
        command: TreasureSwordExtraordinaryPowerCommand.Esp,
      },
      {
        range: [35, 41],
        command: TreasureSwordExtraordinaryPowerCommand.Flying,
      },
      {
        range: [42, 47],
        command: TreasureSwordExtraordinaryPowerCommand.Heal,
      },
      {
        range: [48, 54],
        command: TreasureSwordExtraordinaryPowerCommand.Illusion,
      },
      {
        range: [55, 61],
        command: TreasureSwordExtraordinaryPowerCommand.Levitation,
      },
      {
        range: [62, 67],
        command: TreasureSwordExtraordinaryPowerCommand.Strength,
      },
      {
        range: [68, 75],
        command: TreasureSwordExtraordinaryPowerCommand.Telekinesis,
      },
      {
        range: [76, 81],
        command: TreasureSwordExtraordinaryPowerCommand.Telepathy,
      },
      {
        range: [82, 88],
        command: TreasureSwordExtraordinaryPowerCommand.Teleportation,
      },
      {
        range: [89, 94],
        command: TreasureSwordExtraordinaryPowerCommand.XRayVision,
      },
      {
        range: [95, 97],
        command: TreasureSwordExtraordinaryPowerCommand.RollTwice,
      },
      {
        range: [98, 99],
        command: TreasureSwordExtraordinaryPowerCommand.ChooseAny,
      },
      {
        range: [100],
        command:
          TreasureSwordExtraordinaryPowerCommand.ChooseAnyAndSpecialPurpose,
      },
    ],
  };

type ExtraordinaryEntry =
  typeof treasureSwordExtraordinaryPower.entries[number];

const EXTRAORDINARY_RESTRICTED_ENTRIES = treasureSwordExtraordinaryPower.entries
  .filter(({ range }) => range[0] <= 94)
  .concat([
    {
      range: [95, 96],
      command: TreasureSwordExtraordinaryPowerCommand.ChooseAny,
    },
    {
      range: [97],
      command:
        TreasureSwordExtraordinaryPowerCommand.ChooseAnyAndSpecialPurpose,
    },
  ]) as [ExtraordinaryEntry, ...ExtraordinaryEntry[]];

export const treasureSwordExtraordinaryPowerRestricted: Table<TreasureSwordExtraordinaryPowerCommand> =
  {
    sides: 97,
    entries: EXTRAORDINARY_RESTRICTED_ENTRIES,
  };

export const treasureSwordSpecialPurpose: Table<TreasureSwordSpecialPurposeCommand> =
  {
    sides: 100,
    entries: [
      {
        range: [1, 10],
        command: TreasureSwordSpecialPurposeCommand.DefeatOpposedAlignment,
      },
      {
        range: [11, 20],
        command: TreasureSwordSpecialPurposeCommand.KillClerics,
      },
      {
        range: [21, 30],
        command: TreasureSwordSpecialPurposeCommand.KillFighters,
      },
      {
        range: [31, 40],
        command: TreasureSwordSpecialPurposeCommand.KillMagicUsers,
      },
      {
        range: [41, 50],
        command: TreasureSwordSpecialPurposeCommand.KillThieves,
      },
      {
        range: [51, 55],
        command: TreasureSwordSpecialPurposeCommand.KillBardsOrMonks,
      },
      {
        range: [56, 65],
        command: TreasureSwordSpecialPurposeCommand.OverthrowLawOrChaos,
      },
      {
        range: [66, 75],
        command: TreasureSwordSpecialPurposeCommand.SlayGoodOrEvil,
      },
      {
        range: [76, 100],
        command: TreasureSwordSpecialPurposeCommand.SlayNonHumanMonsters,
      },
    ],
  };

export const treasureSwordSpecialPurposePower: Table<TreasureSwordSpecialPurposePowerCommand> =
  {
    sides: 100,
    entries: [
      {
        range: [1, 10],
        command: TreasureSwordSpecialPurposePowerCommand.Blindness,
      },
      {
        range: [11, 20],
        command: TreasureSwordSpecialPurposePowerCommand.Confusion,
      },
      {
        range: [21, 25],
        command: TreasureSwordSpecialPurposePowerCommand.Disintegrate,
      },
      {
        range: [26, 55],
        command: TreasureSwordSpecialPurposePowerCommand.Fear,
      },
      {
        range: [56, 65],
        command: TreasureSwordSpecialPurposePowerCommand.Insanity,
      },
      {
        range: [66, 80],
        command: TreasureSwordSpecialPurposePowerCommand.Paralysis,
      },
      {
        range: [81, 100],
        command: TreasureSwordSpecialPurposePowerCommand.SavingThrowBonus,
      },
    ],
  };

type SwordPrimaryAbilityDetail =
  | {
      type: 'radius';
      template: string;
      baseRadius: number;
    }
  | {
      type: 'extraordinary';
      template: string;
    };

export type TreasureSwordPrimaryAbilityResult =
  | {
      kind: 'ability';
      ability: TreasureSwordPrimaryAbility;
      rolls: number[];
      multiplier: number;
      description: string;
      tableVariant: 'standard' | 'restricted';
    }
  | {
      kind: 'instruction';
      instruction: 'rollTwice' | 'extraordinaryPower';
      roll: number;
      note: string;
      tableVariant: 'standard' | 'restricted';
    };

export type TreasureSwordExtraordinaryPowerResult =
  | {
      kind: 'power';
      power: TreasureSwordExtraordinaryPower;
      rolls: number[];
      multiplier: number;
      description: string;
      tableVariant: 'standard' | 'restricted';
      alignmentRequired?: boolean;
    }
  | {
      kind: 'instruction';
      instruction: 'rollTwice';
      roll: number;
      note: string;
      tableVariant: 'standard';
    };

export type TreasureSwordSpecialPurposeResult = {
  kind: 'purpose';
  purpose: TreasureSwordSpecialPurpose;
  rolls: number[];
  description: string;
  alignment?: TreasureSwordAlignment;
  slotKey?: string;
  parentSlotKey?: string;
};

export type TreasureSwordSpecialPurposePowerResult = {
  kind: 'specialPurposePower';
  power: TreasureSwordSpecialPurposePower;
  rolls: number[];
  description: string;
  slotKey?: string;
  parentSlotKey?: string;
};

export type TreasureSwordDragonSlayerColorResult = {
  kind: 'dragonSlayerColor';
  color: TreasureSwordDragonSlayerColor;
  rolls: number[];
  label: string;
  alignment: TreasureSwordAlignment;
};

const SWORD_PRIMARY_ABILITY_DETAILS: Record<
  TreasureSwordPrimaryAbility,
  SwordPrimaryAbilityDetail
> = {
  [TreasureSwordPrimaryAbility.DetectShiftingRooms]: {
    type: 'radius',
    template: 'detect "elevator"/shifting rooms/walls in a {RADIUS} radius',
    baseRadius: 1,
  },
  [TreasureSwordPrimaryAbility.DetectSlopingPassages]: {
    type: 'radius',
    template: 'detect sloping passages in a {RADIUS} radius',
    baseRadius: 1,
  },
  [TreasureSwordPrimaryAbility.DetectLargeTraps]: {
    type: 'radius',
    template: 'detect traps of large size in a {RADIUS} radius',
    baseRadius: 1,
  },
  [TreasureSwordPrimaryAbility.DetectAlignment]: {
    type: 'radius',
    template: 'detect evil/good in a {RADIUS} radius',
    baseRadius: 1,
  },
  [TreasureSwordPrimaryAbility.DetectPreciousMetals]: {
    type: 'radius',
    template: 'detect precious metals, kind, and amount in a {RADIUS} radius',
    baseRadius: 2,
  },
  [TreasureSwordPrimaryAbility.DetectGems]: {
    type: 'radius',
    template: 'detect gems, kind, and number in a {RADIUS} radius',
    baseRadius: 0.5,
  },
  [TreasureSwordPrimaryAbility.DetectMagic]: {
    type: 'radius',
    template: 'detect magic in a {RADIUS} radius',
    baseRadius: 1,
  },
  [TreasureSwordPrimaryAbility.DetectSecretDoors]: {
    type: 'radius',
    template: 'detect secret doors in a {RADIUS} radius',
    baseRadius: 0.5,
  },
  [TreasureSwordPrimaryAbility.DetectInvisibleObjects]: {
    type: 'radius',
    template: 'detect invisible objects in a {RADIUS} radius',
    baseRadius: 1,
  },
  [TreasureSwordPrimaryAbility.LocateObject]: {
    type: 'radius',
    template: 'locate object in a {RADIUS} radius',
    baseRadius: 12,
  },
  [TreasureSwordPrimaryAbility.ExtraordinaryPower]: {
    type: 'extraordinary',
    template: 'manifest an extraordinary power (roll separately)',
  },
};

function formatSwordPrimaryAbilityRadius(radiusInches: number): string {
  const halfInches = Math.round(radiusInches * 2);
  const wholeInches = Math.floor(halfInches / 2);
  const hasHalf = halfInches % 2 === 1;
  if (!hasHalf) {
    return `${wholeInches}"`;
  }
  if (wholeInches === 0) {
    return '1/2"';
  }
  return `${wholeInches} 1/2"`;
}

export function describeSwordPrimaryAbility(
  ability: TreasureSwordPrimaryAbility,
  multiplier = 1
): string {
  const detail = SWORD_PRIMARY_ABILITY_DETAILS[ability];
  if (detail.type === 'radius') {
    const radiusLabel = formatSwordPrimaryAbilityRadius(
      detail.baseRadius * multiplier
    );
    return detail.template.replace('{RADIUS}', radiusLabel);
  }
  if (multiplier <= 1) {
    return detail.template;
  }
  return detail.template.replace(
    'an extraordinary power',
    `${multiplier} extraordinary powers`
  );
}

type SwordExtraordinaryPowerDetail =
  | {
      type: 'timesPerDay';
      template: string;
      baseUses: number;
    }
  | {
      type: 'hoursPerDay';
      template: string;
      baseHours: number;
    }
  | {
      type: 'fixed';
      template: (multiplier: number) => string;
    };

const SWORD_EXTRAORDINARY_POWER_DETAILS: Record<
  TreasureSwordExtraordinaryPower,
  SwordExtraordinaryPowerDetail
> = {
  [TreasureSwordExtraordinaryPower.CharmPersonOnContact]: {
    type: 'timesPerDay',
    template: 'charm person on contact — {USES}',
    baseUses: 3,
  },
  [TreasureSwordExtraordinaryPower.Clairaudience]: {
    type: 'timesPerDay',
    template: 'clairaudience, 3" range — {USES}, 1 round per use',
    baseUses: 3,
  },
  [TreasureSwordExtraordinaryPower.Clairvoyance]: {
    type: 'timesPerDay',
    template: 'clairvoyance, 3" range — {USES}, 1 round per use',
    baseUses: 3,
  },
  [TreasureSwordExtraordinaryPower.DetermineDirectionsAndDepth]: {
    type: 'timesPerDay',
    template: 'determine directions and depth — {USES}',
    baseUses: 2,
  },
  [TreasureSwordExtraordinaryPower.Esp]: {
    type: 'timesPerDay',
    template: 'ESP, 3" range — {USES}, 1 round per use',
    baseUses: 3,
  },
  [TreasureSwordExtraordinaryPower.Flying]: {
    type: 'hoursPerDay',
    template: 'flying, 12" movement — {HOURS}',
    baseHours: 1,
  },
  [TreasureSwordExtraordinaryPower.Heal]: {
    type: 'timesPerDay',
    template: 'heal — {USES}',
    baseUses: 1,
  },
  [TreasureSwordExtraordinaryPower.Illusion]: {
    type: 'timesPerDay',
    template: 'illusion, 12" range — {USES}, as the wand',
    baseUses: 2,
  },
  [TreasureSwordExtraordinaryPower.Levitation]: {
    type: 'timesPerDay',
    template:
      'levitation, 1 turn duration — {USES}, at 6th level of magic use ability',
    baseUses: 3,
  },
  [TreasureSwordExtraordinaryPower.Strength]: {
    type: 'timesPerDay',
    template: 'strength — {USES} (upon wielder only)',
    baseUses: 1,
  },
  [TreasureSwordExtraordinaryPower.Telekinesis]: {
    type: 'timesPerDay',
    template: 'telekinesis, 2,500 g.p. wt. maximum — {USES}, 1 round each use',
    baseUses: 2,
  },
  [TreasureSwordExtraordinaryPower.Telepathy]: {
    type: 'timesPerDay',
    template: 'telepathy, 6" range — {USES}',
    baseUses: 2,
  },
  [TreasureSwordExtraordinaryPower.Teleportation]: {
    type: 'timesPerDay',
    template:
      'teleportation — {USES}, 6,000 g.p. wt. maximum, 2 segments to activate',
    baseUses: 1,
  },
  [TreasureSwordExtraordinaryPower.XRayVision]: {
    type: 'timesPerDay',
    template: 'X-ray vision, 4" range — {USES}, 1 turn per use',
    baseUses: 2,
  },
  [TreasureSwordExtraordinaryPower.ChooseAny]: {
    type: 'fixed',
    template: (multiplier) =>
      multiplier === 1
        ? 'choose 1 extraordinary power from this table'
        : `choose ${multiplier} extraordinary powers from this table`,
  },
  [TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose]: {
    type: 'fixed',
    template: (multiplier) =>
      multiplier === 1
        ? 'choose 1 extraordinary power from this table, then roll for a special purpose and its power'
        : `choose ${multiplier} extraordinary powers from this table, then roll for a special purpose and power for each`,
  },
};

function formatTimesPerDayDetail(uses: number, template: string): string {
  const replacement = uses === 1 ? '1 time/day' : `${uses} times/day`;
  return template.replace('{USES}', replacement);
}

function formatHoursPerDayDetail(hours: number, template: string): string {
  const replacement = hours === 1 ? '1 hour/day' : `${hours} hours/day`;
  return template.replace('{HOURS}', replacement);
}

export function describeSwordExtraordinaryPower(
  power: TreasureSwordExtraordinaryPower,
  multiplier = 1
): string {
  const detail = SWORD_EXTRAORDINARY_POWER_DETAILS[power];
  switch (detail.type) {
    case 'timesPerDay': {
      const uses = detail.baseUses * Math.max(1, multiplier);
      return formatTimesPerDayDetail(uses, detail.template);
    }
    case 'hoursPerDay': {
      const hours = detail.baseHours * Math.max(1, multiplier);
      return formatHoursPerDayDetail(hours, detail.template);
    }
    case 'fixed':
      return detail.template(Math.max(1, multiplier));
    default:
      return '';
  }
}

const DIAMETRICAL_OPPOSITION: Partial<
  Record<TreasureSwordAlignment, TreasureSwordAlignment>
> = {
  [TreasureSwordAlignment.LawfulGood]: TreasureSwordAlignment.ChaoticEvil,
  [TreasureSwordAlignment.LawfulNeutral]: TreasureSwordAlignment.ChaoticNeutral,
  [TreasureSwordAlignment.LawfulEvil]: TreasureSwordAlignment.ChaoticGood,
  [TreasureSwordAlignment.NeutralGood]: TreasureSwordAlignment.NeutralEvil,
  [TreasureSwordAlignment.NeutralEvil]: TreasureSwordAlignment.NeutralGood,
  [TreasureSwordAlignment.ChaoticGood]: TreasureSwordAlignment.LawfulEvil,
  [TreasureSwordAlignment.ChaoticNeutral]: TreasureSwordAlignment.LawfulNeutral,
  [TreasureSwordAlignment.ChaoticEvil]: TreasureSwordAlignment.LawfulGood,
};

function isGoodAlignment(alignment: TreasureSwordAlignment): boolean {
  return (
    alignment === TreasureSwordAlignment.LawfulGood ||
    alignment === TreasureSwordAlignment.NeutralGood ||
    alignment === TreasureSwordAlignment.ChaoticGood
  );
}

function isEvilAlignment(alignment: TreasureSwordAlignment): boolean {
  return (
    alignment === TreasureSwordAlignment.LawfulEvil ||
    alignment === TreasureSwordAlignment.NeutralEvil ||
    alignment === TreasureSwordAlignment.ChaoticEvil
  );
}

function alignmentLabel(alignment: TreasureSwordAlignment): string {
  return SWORD_ALIGNMENT_DETAILS[alignment].label;
}

export function describeSwordSpecialPurpose(
  purpose: TreasureSwordSpecialPurpose,
  options?: { alignment?: TreasureSwordAlignment }
): string {
  const alignment = options?.alignment;
  switch (purpose) {
    case TreasureSwordSpecialPurpose.DefeatOpposedAlignment: {
      if (alignment === undefined) {
        return 'defeat/slay diametrically opposed alignment';
      }
      if (alignment === TreasureSwordAlignment.NeutralAbsolute) {
        return 'defeat/slay extreme alignments';
      }
      const opposed = DIAMETRICAL_OPPOSITION[alignment];
      if (!opposed) {
        return 'defeat/slay diametrically opposed alignment';
      }
      return `defeat/slay ${alignmentLabel(opposed)}`;
    }
    case TreasureSwordSpecialPurpose.KillClerics:
      return 'kill clerics';
    case TreasureSwordSpecialPurpose.KillFighters:
      return 'kill fighters';
    case TreasureSwordSpecialPurpose.KillMagicUsers:
      return 'kill magic-users';
    case TreasureSwordSpecialPurpose.KillThieves:
      return 'kill thieves';
    case TreasureSwordSpecialPurpose.KillBardsOrMonks:
      return 'kill bards/monks';
    case TreasureSwordSpecialPurpose.OverthrowLawOrChaos:
      return 'overthrow law and/or chaos';
    case TreasureSwordSpecialPurpose.SlayGoodOrEvil: {
      if (alignment === undefined) {
        return 'slay good and/or evil';
      }
      if (isGoodAlignment(alignment)) {
        return 'slay neutral or evil';
      }
      if (isEvilAlignment(alignment)) {
        return 'slay good or neutral';
      }
      return 'slay good or evil';
    }
    case TreasureSwordSpecialPurpose.SlayNonHumanMonsters:
      return 'slay non-human monsters';
    default:
      return '';
  }
}

export function describeSwordSpecialPurposePower(
  power: TreasureSwordSpecialPurposePower
): string {
  switch (power) {
    case TreasureSwordSpecialPurposePower.Blindness:
      return 'cause blindness for 2-12 rounds';
    case TreasureSwordSpecialPurposePower.Confusion:
      return 'cause confusion for 2-12 rounds';
    case TreasureSwordSpecialPurposePower.Disintegrate:
      return 'disintegrate the target';
    case TreasureSwordSpecialPurposePower.Fear:
      return 'cause fear for 1-4 rounds';
    case TreasureSwordSpecialPurposePower.Insanity:
      return 'induce insanity for 1-4 rounds';
    case TreasureSwordSpecialPurposePower.Paralysis:
      return 'inflict paralysis for 1-4 rounds';
    case TreasureSwordSpecialPurposePower.SavingThrowBonus:
      return 'grant +2 on all saving throws and reduce damage by 1 per die';
    default:
      return '';
  }
}

export function describeDragonSlayerColor(
  color: TreasureSwordDragonSlayerColor
): string {
  return DRAGON_SLAYER_COLOR_DETAILS[color].label;
}

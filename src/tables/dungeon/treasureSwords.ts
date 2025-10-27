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

export type SwordCommunicationMode =
  | 'none'
  | 'semi-empathy'
  | 'empathy'
  | 'speech'
  | 'speech and telepathy';

export type SwordLanguageCapability = 'none' | 'mundane' | 'magical';

export type SwordUnusualDetails = {
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
    label: 'Intelligence 15 (3 primary abilities, speech, reads languages/maps)',
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
    communicationNotes:
      'Speaks and can communicate telepathically at will.',
    languageCapability: 'magical',
    extraordinaryPower: true,
    requiresAlignment: true,
  },
};

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

type PrimaryAbilityEntry =
  (typeof treasureSwordPrimaryAbility.entries)[number];

const PRIMARY_ABILITY_RESTRICTED_ENTRIES =
  treasureSwordPrimaryAbility.entries.filter(
    ({ range }) => range[0] <= 92
  ) as [PrimaryAbilityEntry, ...PrimaryAbilityEntry[]];

export const treasureSwordPrimaryAbilityRestricted: Table<TreasureSwordPrimaryAbilityCommand> =
  {
    sides: 92,
    entries: PRIMARY_ABILITY_RESTRICTED_ENTRIES,
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
      instruction: 'rollTwice';
      roll: number;
      note: string;
      tableVariant: 'standard';
    };

export const SWORD_PRIMARY_ABILITY_DETAILS: Record<
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
    template:
      'detect precious metals, kind, and amount in a {RADIUS} radius',
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

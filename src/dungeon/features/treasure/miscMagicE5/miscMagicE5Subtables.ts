import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum TreasureRobeOfTheArchmagi {
  Good,
  Neutral,
  Evil,
}

export const treasureRobeOfTheArchmagi: Table<TreasureRobeOfTheArchmagi> = {
  sides: 100,
  entries: [
    { range: [1, 45], command: TreasureRobeOfTheArchmagi.Good },
    { range: [46, 75], command: TreasureRobeOfTheArchmagi.Neutral },
    { range: [76, 100], command: TreasureRobeOfTheArchmagi.Evil },
  ],
};

export enum RobeOfUsefulItemsExtraPatch {
  BagOfGoldPieces,
  CofferSilver,
  DoorIron,
  Gems,
  LadderWooden,
  MuleWithSaddlebags,
  Pit,
  PotionExtraHealing,
  Rowboat,
  ScrollOfOneSpell,
  WarDogsPair,
  Window,
  RollTwiceMore,
}

export type RobeOfUsefulItemsBasePatchType =
  | 'dagger'
  | 'lantern'
  | 'mirror'
  | 'pole'
  | 'rope'
  | 'sack';

type RobeOfUsefulItemsBasePatchDefinition = {
  type: RobeOfUsefulItemsBasePatchType;
  label: string;
  count: number;
};

export const ROBE_OF_USEFUL_ITEMS_BASE_PATCHES: readonly RobeOfUsefulItemsBasePatchDefinition[] =
  [
    { type: 'dagger', label: 'Dagger', count: 2 },
    { type: 'lantern', label: 'Lantern (filled and lit)', count: 2 },
    { type: 'mirror', label: 'Mirror (large)', count: 2 },
    { type: 'pole', label: "Pole (10')", count: 2 },
    { type: 'rope', label: "Rope (50' coil)", count: 2 },
    { type: 'sack', label: 'Sack (large)', count: 2 },
  ] as const;

const EXTRA_PATCH_DEFINITIONS: Record<
  Exclude<
    RobeOfUsefulItemsExtraPatch,
    RobeOfUsefulItemsExtraPatch.RollTwiceMore
  >,
  { label: string }
> = {
  [RobeOfUsefulItemsExtraPatch.BagOfGoldPieces]: {
    label: 'Bag of 100 gold pieces',
  },
  [RobeOfUsefulItemsExtraPatch.CofferSilver]: {
    label: "Coffer (½' × ½' × 1'), silver (500 g.p. value)",
  },
  [RobeOfUsefulItemsExtraPatch.DoorIron]: {
    label: 'Door, iron (up to 10′ wide and 10′ high, barred on one side)',
  },
  [RobeOfUsefulItemsExtraPatch.Gems]: {
    label: 'Gems (10 × 100 g.p. each)',
  },
  [RobeOfUsefulItemsExtraPatch.LadderWooden]: {
    label: "Ladder, wooden (24')",
  },
  [RobeOfUsefulItemsExtraPatch.MuleWithSaddlebags]: {
    label: 'Mule (with saddle bags)',
  },
  [RobeOfUsefulItemsExtraPatch.Pit]: {
    label: 'Pit (10 cubic feet, open)',
  },
  [RobeOfUsefulItemsExtraPatch.PotionExtraHealing]: {
    label: 'Potion of extra healing',
  },
  [RobeOfUsefulItemsExtraPatch.Rowboat]: {
    label: "Rowboat (12' long)",
  },
  [RobeOfUsefulItemsExtraPatch.ScrollOfOneSpell]: {
    label: 'Scroll of 1 spell',
  },
  [RobeOfUsefulItemsExtraPatch.WarDogsPair]: {
    label: 'War dogs, pair',
  },
  [RobeOfUsefulItemsExtraPatch.Window]: {
    label: "Window (2' × 4', up to 2' deep)",
  },
};

export function robeOfUsefulItemsExtraLabel(
  patch: Exclude<
    RobeOfUsefulItemsExtraPatch,
    RobeOfUsefulItemsExtraPatch.RollTwiceMore
  >
): string {
  return EXTRA_PATCH_DEFINITIONS[patch].label;
}

export const treasureRobeOfUsefulItems: Table<RobeOfUsefulItemsExtraPatch> = {
  sides: 100,
  entries: [
    { range: [1, 8], command: RobeOfUsefulItemsExtraPatch.BagOfGoldPieces },
    { range: [9, 15], command: RobeOfUsefulItemsExtraPatch.CofferSilver },
    { range: [16, 22], command: RobeOfUsefulItemsExtraPatch.DoorIron },
    { range: [23, 30], command: RobeOfUsefulItemsExtraPatch.Gems },
    { range: [31, 44], command: RobeOfUsefulItemsExtraPatch.LadderWooden },
    {
      range: [45, 51],
      command: RobeOfUsefulItemsExtraPatch.MuleWithSaddlebags,
    },
    { range: [52, 59], command: RobeOfUsefulItemsExtraPatch.Pit },
    {
      range: [60, 68],
      command: RobeOfUsefulItemsExtraPatch.PotionExtraHealing,
    },
    { range: [69, 75], command: RobeOfUsefulItemsExtraPatch.Rowboat },
    {
      range: [76, 83],
      command: RobeOfUsefulItemsExtraPatch.ScrollOfOneSpell,
    },
    { range: [84, 90], command: RobeOfUsefulItemsExtraPatch.WarDogsPair },
    { range: [91, 96], command: RobeOfUsefulItemsExtraPatch.Window },
    { range: [97, 100], command: RobeOfUsefulItemsExtraPatch.RollTwiceMore },
  ],
};

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

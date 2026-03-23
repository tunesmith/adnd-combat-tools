import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum TreasureFigurineOfWondrousPower {
  EbonyFly,
  GoldenLions,
  IvoryGoats,
  MarbleElephant,
  ObsidianSteed,
  OnyxDog,
  SerpentineOwl,
}

export const treasureFigurineOfWondrousPower: Table<TreasureFigurineOfWondrousPower> =
  {
    sides: 100,
    entries: [
      { range: [1, 15], command: TreasureFigurineOfWondrousPower.EbonyFly },
      { range: [16, 30], command: TreasureFigurineOfWondrousPower.GoldenLions },
      { range: [31, 40], command: TreasureFigurineOfWondrousPower.IvoryGoats },
      {
        range: [41, 55],
        command: TreasureFigurineOfWondrousPower.MarbleElephant,
      },
      {
        range: [56, 65],
        command: TreasureFigurineOfWondrousPower.ObsidianSteed,
      },
      { range: [66, 85], command: TreasureFigurineOfWondrousPower.OnyxDog },
      {
        range: [86, 100],
        command: TreasureFigurineOfWondrousPower.SerpentineOwl,
      },
    ],
  };

export enum TreasureFigurineMarbleElephant {
  Asiatic,
  African,
  PrehistoricMammoth,
  PrehistoricMastodon,
}

export const treasureFigurineMarbleElephant: Table<TreasureFigurineMarbleElephant> =
  {
    sides: 100,
    entries: [
      { range: [1, 50], command: TreasureFigurineMarbleElephant.Asiatic },
      { range: [51, 90], command: TreasureFigurineMarbleElephant.African },
      {
        range: [91, 93],
        command: TreasureFigurineMarbleElephant.PrehistoricMammoth,
      },
      {
        range: [94, 100],
        command: TreasureFigurineMarbleElephant.PrehistoricMastodon,
      },
    ],
  };

export enum TreasureGirdleOfGiantStrength {
  Hill,
  Stone,
  Frost,
  Fire,
  Cloud,
  Storm,
}

export const treasureGirdleOfGiantStrength: Table<TreasureGirdleOfGiantStrength> =
  {
    sides: 100,
    entries: [
      { range: [1, 30], command: TreasureGirdleOfGiantStrength.Hill },
      { range: [31, 50], command: TreasureGirdleOfGiantStrength.Stone },
      { range: [51, 70], command: TreasureGirdleOfGiantStrength.Frost },
      { range: [71, 85], command: TreasureGirdleOfGiantStrength.Fire },
      { range: [86, 95], command: TreasureGirdleOfGiantStrength.Cloud },
      { range: [96, 100], command: TreasureGirdleOfGiantStrength.Storm },
    ],
  };

export enum TreasureInstrumentOfTheBards {
  FochlucanBandore,
  MacFuirmidhCittern,
  DossLute,
  CanaithMandolin,
  CliLyre,
  AnstruthHarp,
  OllamhHarp,
}

export const treasureInstrumentOfTheBards: Table<TreasureInstrumentOfTheBards> =
  {
    sides: 20,
    entries: [
      { range: [1, 5], command: TreasureInstrumentOfTheBards.FochlucanBandore },
      {
        range: [6, 9],
        command: TreasureInstrumentOfTheBards.MacFuirmidhCittern,
      },
      { range: [10, 12], command: TreasureInstrumentOfTheBards.DossLute },
      {
        range: [13, 15],
        command: TreasureInstrumentOfTheBards.CanaithMandolin,
      },
      { range: [16, 17], command: TreasureInstrumentOfTheBards.CliLyre },
      { range: [18, 19], command: TreasureInstrumentOfTheBards.AnstruthHarp },
      { range: [20], command: TreasureInstrumentOfTheBards.OllamhHarp },
    ],
  };

export enum TreasureIronFlaskContent {
  Empty,
  AirElemental,
  DemonTypeIToIII,
  DemonTypeIVToVI,
  DevilLesser,
  DevilGreater,
  Djinni,
  EarthElemental,
  Efreeti,
  FireElemental,
  InvisibleStalker,
  Mezzodaemon,
  NightHag,
  Nycadaemon,
  Rakshasa,
  Salamander,
  WaterElemental,
  WindWalker,
  Xorn,
}

export const treasureIronFlask: Table<TreasureIronFlaskContent> = {
  sides: 100,
  entries: [
    { range: [1, 50], command: TreasureIronFlaskContent.Empty },
    { range: [51, 54], command: TreasureIronFlaskContent.AirElemental },
    { range: [55, 56], command: TreasureIronFlaskContent.DemonTypeIToIII },
    { range: [57], command: TreasureIronFlaskContent.DemonTypeIVToVI },
    { range: [58, 59], command: TreasureIronFlaskContent.DevilLesser },
    { range: [60], command: TreasureIronFlaskContent.DevilGreater },
    { range: [61, 65], command: TreasureIronFlaskContent.Djinni },
    { range: [66, 69], command: TreasureIronFlaskContent.EarthElemental },
    { range: [70, 72], command: TreasureIronFlaskContent.Efreeti },
    { range: [73, 76], command: TreasureIronFlaskContent.FireElemental },
    {
      range: [77, 81],
      command: TreasureIronFlaskContent.InvisibleStalker,
    },
    { range: [82, 83], command: TreasureIronFlaskContent.Mezzodaemon },
    { range: [84, 85], command: TreasureIronFlaskContent.NightHag },
    { range: [86], command: TreasureIronFlaskContent.Nycadaemon },
    { range: [87, 89], command: TreasureIronFlaskContent.Rakshasa },
    { range: [90, 93], command: TreasureIronFlaskContent.Salamander },
    { range: [94, 97], command: TreasureIronFlaskContent.WaterElemental },
    { range: [98, 99], command: TreasureIronFlaskContent.WindWalker },
    { range: [100], command: TreasureIronFlaskContent.Xorn },
  ],
};

export enum TreasureHornOfValhallaType {
  Silver,
  Brass,
  Bronze,
  Iron,
}

export const treasureHornOfValhallaType: Table<TreasureHornOfValhallaType> = {
  sides: 20,
  entries: [
    { range: [1, 8], command: TreasureHornOfValhallaType.Silver },
    { range: [9, 15], command: TreasureHornOfValhallaType.Brass },
    { range: [16, 18], command: TreasureHornOfValhallaType.Bronze },
    { range: [19, 20], command: TreasureHornOfValhallaType.Iron },
  ],
};

export enum TreasureHornOfValhallaAttunement {
  NonAligned,
  Aligned,
}

export const treasureHornOfValhallaAttunement: Table<TreasureHornOfValhallaAttunement> =
  {
    sides: 100,
    entries: [
      { range: [1, 50], command: TreasureHornOfValhallaAttunement.NonAligned },
      { range: [51, 100], command: TreasureHornOfValhallaAttunement.Aligned },
    ],
  };

export enum TreasureHornOfValhallaAlignment {
  LawfulGood,
  LawfulNeutral,
  LawfulEvil,
  NeutralEvil,
  ChaoticEvil,
  ChaoticNeutral,
  ChaoticGood,
  NeutralGood,
  Neutral,
}

export const treasureHornOfValhallaAlignment: Table<TreasureHornOfValhallaAlignment> =
  {
    sides: 10,
    entries: [
      { range: [1], command: TreasureHornOfValhallaAlignment.LawfulGood },
      { range: [2], command: TreasureHornOfValhallaAlignment.LawfulNeutral },
      { range: [3], command: TreasureHornOfValhallaAlignment.LawfulEvil },
      { range: [4], command: TreasureHornOfValhallaAlignment.NeutralEvil },
      { range: [5], command: TreasureHornOfValhallaAlignment.ChaoticEvil },
      {
        range: [6],
        command: TreasureHornOfValhallaAlignment.ChaoticNeutral,
      },
      { range: [7], command: TreasureHornOfValhallaAlignment.ChaoticGood },
      { range: [8], command: TreasureHornOfValhallaAlignment.NeutralGood },
      { range: [9, 10], command: TreasureHornOfValhallaAlignment.Neutral },
    ],
  };

export enum TreasureIounStoneType {
  PaleBlue,
  ScarletAndBlue,
  IncandescentBlue,
  DeepRed,
  Pink,
  PinkAndGreen,
  PaleGreen,
  Clear,
  Iridescent,
  PearlyWhite,
  PaleLavender,
  LavenderAndGreen,
  VibrantPurple,
  DustyRose,
  DullGray,
}

export const treasureIounStones: Table<TreasureIounStoneType> = {
  sides: 20,
  entries: [
    { range: [1], command: TreasureIounStoneType.PaleBlue },
    { range: [2], command: TreasureIounStoneType.ScarletAndBlue },
    { range: [3], command: TreasureIounStoneType.IncandescentBlue },
    { range: [4], command: TreasureIounStoneType.DeepRed },
    { range: [5], command: TreasureIounStoneType.Pink },
    { range: [6], command: TreasureIounStoneType.PinkAndGreen },
    { range: [7], command: TreasureIounStoneType.PaleGreen },
    { range: [8], command: TreasureIounStoneType.Clear },
    { range: [9], command: TreasureIounStoneType.Iridescent },
    { range: [10], command: TreasureIounStoneType.PearlyWhite },
    { range: [11], command: TreasureIounStoneType.PaleLavender },
    { range: [12], command: TreasureIounStoneType.LavenderAndGreen },
    { range: [13], command: TreasureIounStoneType.VibrantPurple },
    { range: [14], command: TreasureIounStoneType.DustyRose },
    { range: [15, 20], command: TreasureIounStoneType.DullGray },
  ],
};

type IounStoneDefinition = {
  color: string;
  shape: string;
  effect: string;
};

export const IOUN_STONE_DEFINITIONS: Record<
  TreasureIounStoneType,
  IounStoneDefinition
> = {
  [TreasureIounStoneType.PaleBlue]: {
    color: 'pale blue',
    shape: 'rhomboid',
    effect: 'adds 1 point to strength (18 maximum)',
  },
  [TreasureIounStoneType.ScarletAndBlue]: {
    color: 'scarlet & blue',
    shape: 'sphere',
    effect: 'adds 1 point to intelligence (18 maximum)',
  },
  [TreasureIounStoneType.IncandescentBlue]: {
    color: 'incandescent blue',
    shape: 'sphere',
    effect: 'adds 1 point to wisdom (18 maximum)',
  },
  [TreasureIounStoneType.DeepRed]: {
    color: 'deep red',
    shape: 'sphere',
    effect: 'adds 1 point to dexterity (18 maximum)',
  },
  [TreasureIounStoneType.Pink]: {
    color: 'pink',
    shape: 'rhomboid',
    effect: 'adds 1 point to constitution (18 maximum)',
  },
  [TreasureIounStoneType.PinkAndGreen]: {
    color: 'pink & green',
    shape: 'sphere',
    effect: 'adds 1 point to charisma (18 maximum)',
  },
  [TreasureIounStoneType.PaleGreen]: {
    color: 'pale green',
    shape: 'prism',
    effect: 'adds 1 level of experience',
  },
  [TreasureIounStoneType.Clear]: {
    color: 'clear',
    shape: 'spindle',
    effect: 'sustains person without food or water',
  },
  [TreasureIounStoneType.Iridescent]: {
    color: 'iridescent',
    shape: 'spindle',
    effect: 'sustains person without air',
  },
  [TreasureIounStoneType.PearlyWhite]: {
    color: 'pearly white',
    shape: 'spindle',
    effect: 'regenerates 1 h.p. of damage each turn',
  },
  [TreasureIounStoneType.PaleLavender]: {
    color: 'pale lavender',
    shape: 'ellipsoid',
    effect: 'absorbs spells up to 4th level',
  },
  [TreasureIounStoneType.LavenderAndGreen]: {
    color: 'lavender & green',
    shape: 'ellipsoid',
    effect: 'absorbs spells up to 8th level',
  },
  [TreasureIounStoneType.VibrantPurple]: {
    color: 'vibrant purple',
    shape: 'prism',
    effect: 'stores 2-12 levels of spells',
  },
  [TreasureIounStoneType.DustyRose]: {
    color: 'dusty rose',
    shape: 'prism',
    effect: 'gives +1 protection',
  },
  [TreasureIounStoneType.DullGray]: {
    color: 'dull gray',
    shape: 'any',
    effect: 'burned out, "dead" stone',
  },
};

import type { Table } from './dungeonTypes';

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

export type IounStoneDefinition = {
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

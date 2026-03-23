import type { Table } from '../../../../tables/dungeon/tableTypes';

export enum TreasureSwordAlignment {
  ChaoticGood,
  ChaoticNeutral,
  ChaoticEvil,
  NeutralEvil,
  LawfulEvil,
  LawfulGood,
  LawfulNeutral,
  NeutralAbsolute,
  NeutralGood,
}

type SwordAlignmentDetail = {
  label: string;
  requiresLanguageTable: boolean;
};

export const SWORD_ALIGNMENT_DETAILS: Record<
  TreasureSwordAlignment,
  SwordAlignmentDetail
> = {
  [TreasureSwordAlignment.ChaoticGood]: {
    label: 'Chaotic Good',
    requiresLanguageTable: false,
  },
  [TreasureSwordAlignment.ChaoticNeutral]: {
    label: 'Chaotic Neutral',
    requiresLanguageTable: true,
  },
  [TreasureSwordAlignment.ChaoticEvil]: {
    label: 'Chaotic Evil',
    requiresLanguageTable: false,
  },
  [TreasureSwordAlignment.NeutralEvil]: {
    label: 'Neutral Evil',
    requiresLanguageTable: true,
  },
  [TreasureSwordAlignment.LawfulEvil]: {
    label: 'Lawful Evil',
    requiresLanguageTable: false,
  },
  [TreasureSwordAlignment.LawfulGood]: {
    label: 'Lawful Good',
    requiresLanguageTable: false,
  },
  [TreasureSwordAlignment.LawfulNeutral]: {
    label: 'Lawful Neutral',
    requiresLanguageTable: true,
  },
  [TreasureSwordAlignment.NeutralAbsolute]: {
    label: 'True Neutral',
    requiresLanguageTable: false,
  },
  [TreasureSwordAlignment.NeutralGood]: {
    label: 'Neutral Good',
    requiresLanguageTable: true,
  },
};

export const treasureSwordAlignment: Table<TreasureSwordAlignment> = {
  sides: 100,
  entries: [
    { range: [1, 5], command: TreasureSwordAlignment.ChaoticGood },
    { range: [6, 15], command: TreasureSwordAlignment.ChaoticNeutral },
    { range: [16, 20], command: TreasureSwordAlignment.ChaoticEvil },
    { range: [21, 25], command: TreasureSwordAlignment.NeutralEvil },
    { range: [26, 30], command: TreasureSwordAlignment.LawfulEvil },
    { range: [31, 55], command: TreasureSwordAlignment.LawfulGood },
    { range: [56, 60], command: TreasureSwordAlignment.LawfulNeutral },
    { range: [61, 80], command: TreasureSwordAlignment.NeutralAbsolute },
    { range: [81, 100], command: TreasureSwordAlignment.NeutralGood },
  ],
};

export const treasureSwordAlignmentChaotic: Table<TreasureSwordAlignment> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: TreasureSwordAlignment.ChaoticGood },
    { range: [6, 16], command: TreasureSwordAlignment.ChaoticNeutral },
    { range: [17, 20], command: TreasureSwordAlignment.ChaoticEvil },
  ],
};

export const treasureSwordAlignmentLawful: Table<TreasureSwordAlignment> = {
  sides: 35,
  entries: [
    { range: [1, 5], command: TreasureSwordAlignment.LawfulEvil },
    { range: [6, 30], command: TreasureSwordAlignment.LawfulGood },
    { range: [31, 35], command: TreasureSwordAlignment.LawfulNeutral },
  ],
};

export type TreasureSwordAlignmentResult = {
  alignment: TreasureSwordAlignment;
  label: string;
  source: 'standard' | 'chaotic' | 'lawful' | 'fixed';
  requiresLanguageTable: boolean;
};

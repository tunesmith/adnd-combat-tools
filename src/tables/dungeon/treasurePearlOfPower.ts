import type { Table } from './dungeonTypes';

export enum TreasurePearlOfPowerEffect {
  Forgetting,
  Recall,
}

export enum TreasurePearlOfPowerRecall {
  Recall1stLevel,
  Recall2ndLevel,
  Recall3rdLevel,
  Recall4thLevel,
  Recall5thLevel,
  Recall6thLevel,
  Recall7thLevel,
  Recall8thLevel,
  Recall9thLevel,
  RecallTwoByDie,
}

export type TreasurePearlOfPowerRecallResult =
  | { type: 'single'; level: number }
  | { type: 'double'; level: number };

export const treasurePearlOfPowerEffect: Table<TreasurePearlOfPowerEffect> = {
  sides: 20,
  entries: [
    { range: [1], command: TreasurePearlOfPowerEffect.Forgetting },
    { range: [2, 20], command: TreasurePearlOfPowerEffect.Recall },
  ],
};

export const treasurePearlOfPowerRecall: Table<TreasurePearlOfPowerRecall> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasurePearlOfPowerRecall.Recall1stLevel },
    { range: [26, 45], command: TreasurePearlOfPowerRecall.Recall2ndLevel },
    { range: [46, 60], command: TreasurePearlOfPowerRecall.Recall3rdLevel },
    { range: [61, 75], command: TreasurePearlOfPowerRecall.Recall4thLevel },
    { range: [76, 85], command: TreasurePearlOfPowerRecall.Recall5thLevel },
    { range: [86, 92], command: TreasurePearlOfPowerRecall.Recall6thLevel },
    { range: [93, 96], command: TreasurePearlOfPowerRecall.Recall7thLevel },
    { range: [97, 98], command: TreasurePearlOfPowerRecall.Recall8thLevel },
    { range: [99], command: TreasurePearlOfPowerRecall.Recall9thLevel },
    { range: [100], command: TreasurePearlOfPowerRecall.RecallTwoByDie },
  ],
};

export function resolvePearlRecallResult(
  command: TreasurePearlOfPowerRecall,
  rollD6: () => number
): TreasurePearlOfPowerRecallResult {
  switch (command) {
    case TreasurePearlOfPowerRecall.Recall1stLevel:
      return { type: 'single', level: 1 };
    case TreasurePearlOfPowerRecall.Recall2ndLevel:
      return { type: 'single', level: 2 };
    case TreasurePearlOfPowerRecall.Recall3rdLevel:
      return { type: 'single', level: 3 };
    case TreasurePearlOfPowerRecall.Recall4thLevel:
      return { type: 'single', level: 4 };
    case TreasurePearlOfPowerRecall.Recall5thLevel:
      return { type: 'single', level: 5 };
    case TreasurePearlOfPowerRecall.Recall6thLevel:
      return { type: 'single', level: 6 };
    case TreasurePearlOfPowerRecall.Recall7thLevel:
      return { type: 'single', level: 7 };
    case TreasurePearlOfPowerRecall.Recall8thLevel:
      return { type: 'single', level: 8 };
    case TreasurePearlOfPowerRecall.Recall9thLevel:
      return { type: 'single', level: 9 };
    case TreasurePearlOfPowerRecall.RecallTwoByDie: {
      const level = Math.max(1, Math.min(6, rollD6()));
      return { type: 'double', level };
    }
    default:
      return { type: 'single', level: 1 };
  }
}

import { Table } from "./dungeonTypes";

export enum MagicPool {
  TransmuteGold,
  AlterCharacteristic,
  WishOrDamage,
  Transporter,
}

export const magicPool: Table<MagicPool> = {
  sides: 20,
  entries: [
    { range: [1, 8], command: MagicPool.TransmuteGold },
    { range: [9, 15], command: MagicPool.AlterCharacteristic },
    { range: [16, 17], command: MagicPool.WishOrDamage },
    { range: [18, 20], command: MagicPool.Transporter },
  ],
};

export enum TransmuteType {
  GoldToPlatinum,
  GoldToLead,
}

export const transmuteType: Table<TransmuteType> = {
  sides: 20,
  entries: [
    { range: [1, 11], command: TransmuteType.GoldToPlatinum },
    { range: [2, 20], command: TransmuteType.GoldToLead },
  ],
};

export enum PoolAlignment {
  LawfulGood,
  LawfulEvil,
  ChaoticGood,
  ChaoticEvil,
  Neutral,
}

export const poolAlignment: Table<PoolAlignment> = {
  sides: 20,
  entries: [
    { range: [1, 6], command: PoolAlignment.LawfulGood },
    { range: [7, 9], command: PoolAlignment.LawfulEvil },
    { range: [10, 12], command: PoolAlignment.ChaoticGood },
    { range: [13, 17], command: PoolAlignment.ChaoticEvil },
    { range: [18, 20], command: PoolAlignment.Neutral },
  ],
};

export enum TransporterLocation {
  Surface,
  SameLevelElsewhere,
  OneLevelDown,
  Away100Miles,
}

export const transporterLocation: Table<TransporterLocation> = {
  sides: 20,
  entries: [
    { range: [1, 7], command: TransporterLocation.Surface },
    { range: [8, 12], command: TransporterLocation.SameLevelElsewhere },
    { range: [13, 16], command: TransporterLocation.OneLevelDown },
    { range: [17, 20], command: TransporterLocation.Away100Miles },
  ],
};

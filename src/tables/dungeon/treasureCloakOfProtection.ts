import type { Table } from './dungeonTypes';

export enum TreasureCloakOfProtection {
  PlusOne = '+1',
  PlusTwo = '+2',
  PlusThree = '+3',
  PlusFour = '+4',
  PlusFive = '+5',
}

export const treasureCloakOfProtection: Table<TreasureCloakOfProtection> = {
  sides: 100,
  entries: [
    { range: [1, 35], command: TreasureCloakOfProtection.PlusOne },
    { range: [36, 65], command: TreasureCloakOfProtection.PlusTwo },
    { range: [66, 85], command: TreasureCloakOfProtection.PlusThree },
    { range: [86, 95], command: TreasureCloakOfProtection.PlusFour },
    { range: [96, 100], command: TreasureCloakOfProtection.PlusFive },
  ],
};

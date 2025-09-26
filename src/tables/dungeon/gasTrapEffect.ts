import type { Table } from './dungeonTypes';

export enum GasTrapEffect {
  ObscuringGas,
  BlindingGas,
  FearGas,
  SleepGas,
  StrengthGas,
  SicknessGas,
  PoisonGas,
}

export const gasTrapEffect: Table<GasTrapEffect> = {
  sides: 20,
  entries: [
    { range: [1, 7], command: GasTrapEffect.ObscuringGas },
    { range: [8, 9], command: GasTrapEffect.BlindingGas },
    { range: [10, 12], command: GasTrapEffect.FearGas },
    { range: [13], command: GasTrapEffect.SleepGas },
    { range: [14, 18], command: GasTrapEffect.StrengthGas },
    { range: [19], command: GasTrapEffect.SicknessGas },
    { range: [20], command: GasTrapEffect.PoisonGas },
  ],
};

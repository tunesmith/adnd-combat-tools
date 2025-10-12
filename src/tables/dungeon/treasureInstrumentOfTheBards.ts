import type { Table } from './dungeonTypes';

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

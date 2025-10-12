import type { Table } from './dungeonTypes';

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

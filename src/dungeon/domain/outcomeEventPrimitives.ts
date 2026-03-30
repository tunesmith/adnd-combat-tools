export type ResultOutcomeEvent<Kind extends string, TResult> = {
  kind: Kind;
  result: TResult;
};

export type DungeonLevelResultOutcomeEvent<
  Kind extends string,
  TResult
> = ResultOutcomeEvent<Kind, TResult> & {
  dungeonLevel: number;
};

export type TreasureRollOutcomeEvent<
  Kind extends string,
  TResult
> = ResultOutcomeEvent<Kind, TResult> & {
  level: number;
  treasureRoll: number;
  rollIndex?: number;
};

export type OptionalTreasureRollOutcomeEvent<
  Kind extends string,
  TResult
> = ResultOutcomeEvent<Kind, TResult> & {
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

import {
  PeriodicCheck,
} from "../../tables/dungeon/periodicCheck";
import { DoorBeyond } from "../../tables/dungeon/doorBeyond";

// Domain outcome event kinds cover high-level tables we resolve.
export type OutcomeEvent =
  | { kind: "periodicCheck"; result: PeriodicCheck; level: number; avoidMonster?: boolean }
  | { kind: "doorBeyond"; result: DoorBeyond; doorAhead?: boolean };

export type PendingRoll = {
  type: "pending-roll";
  table: string;
  // optional context used by the UI to thread chains like door locations
  context?: unknown;
};

export type OutcomeEventNode = {
  type: "event";
  event: OutcomeEvent;
  roll: number;
  children?: DungeonOutcomeNode[];
};

export type DungeonOutcomeNode = OutcomeEventNode | PendingRoll;


import { PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import { DoorBeyond } from "../../tables/dungeon/doorBeyond";
import { SidePassages } from "../../tables/dungeon/sidePassages";
import { PassageTurns } from "../../tables/dungeon/passageTurns";
import { Stairs } from "../../tables/dungeon/stairs";
import { SpecialPassage } from "../../tables/dungeon/specialPassage";

// Domain outcome event kinds cover high-level tables we resolve.
export type OutcomeEvent =
  | { kind: "periodicCheck"; result: PeriodicCheck; level: number; avoidMonster?: boolean }
  | { kind: "doorBeyond"; result: DoorBeyond; doorAhead?: boolean }
  | { kind: "sidePassages"; result: SidePassages }
  | { kind: "passageTurns"; result: PassageTurns }
  | { kind: "stairs"; result: Stairs }
  | { kind: "specialPassage"; result: SpecialPassage };

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

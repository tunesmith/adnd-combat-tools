import type { PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import type { DoorBeyond } from "../../tables/dungeon/doorBeyond";
import type { SidePassages } from "../../tables/dungeon/sidePassages";
import type { PassageTurns } from "../../tables/dungeon/passageTurns";
import type { Stairs, Egress } from "../../tables/dungeon/stairs";
import type { SpecialPassage } from "../../tables/dungeon/specialPassage";
import type { PassageWidth } from "../../tables/dungeon/passageWidth";
import type { RoomDimensions, ChamberDimensions } from "../../tables/dungeon/chambersRooms";
import type { NumberOfExits } from "../../tables/dungeon/numberOfExits";

// Domain outcome event kinds cover high-level tables we resolve.
export type OutcomeEvent =
  | { kind: "periodicCheck"; result: PeriodicCheck; level: number; avoidMonster?: boolean }
  | { kind: "doorBeyond"; result: DoorBeyond; doorAhead?: boolean }
  | { kind: "sidePassages"; result: SidePassages }
  | { kind: "passageTurns"; result: PassageTurns }
  | { kind: "stairs"; result: Stairs }
  | { kind: "specialPassage"; result: SpecialPassage }
  | { kind: "passageWidth"; result: PassageWidth }
  | { kind: "roomDimensions"; result: RoomDimensions }
  | { kind: "chamberDimensions"; result: ChamberDimensions }
  | { kind: "egress"; result: Egress; which: "one" | "two" | "three" }
  | { kind: "chute"; result: number }
  | { kind: "numberOfExits"; result: NumberOfExits; context: { length: number; width: number; isRoom: boolean } };

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

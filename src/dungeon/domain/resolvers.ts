import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { periodicCheck, PeriodicCheck } from "../../tables/dungeon/periodicCheck";
import { doorBeyond } from "../../tables/dungeon/doorBeyond";
import type { DungeonOutcomeNode, OutcomeEvent } from "./outcome";
import { sidePassages } from "../../tables/dungeon/sidePassages";
import { passageTurns } from "../../tables/dungeon/passageTurns";
import { stairs, Stairs } from "../../tables/dungeon/stairs";
import { specialPassage, SpecialPassage } from "../../tables/dungeon/specialPassage";
import { passageWidth, PassageWidth } from "../../tables/dungeon/passageWidth";
import { roomDimensions, RoomDimensions, chamberDimensions, ChamberDimensions } from "../../tables/dungeon/chambersRooms";

export function resolvePeriodicCheck(options?: {
  roll?: number;
  level?: number;
  avoidMonster?: boolean;
}): DungeonOutcomeNode {
  const level = options?.level ?? 1;
  const usedRoll = options?.roll ?? rollDice(periodicCheck.sides);
  const command = getTableEntry(usedRoll, periodicCheck);
  const children: DungeonOutcomeNode[] = [];
  switch (command) {
    case PeriodicCheck.Door:
      children.push({ type: "pending-roll", table: "doorLocation:0", context: { kind: "doorChain", existing: [] } });
      break;
    case PeriodicCheck.SidePassage:
      children.push({ type: "pending-roll", table: "sidePassages" });
      break;
    case PeriodicCheck.PassageTurn:
      children.push({ type: "pending-roll", table: "passageTurns" });
      break;
    case PeriodicCheck.Chamber:
      children.push({ type: "pending-roll", table: "chamberDimensions" });
      break;
    case PeriodicCheck.Stairs:
      children.push({ type: "pending-roll", table: "stairs" });
      break;
    case PeriodicCheck.TrickTrap:
      children.push({ type: "pending-roll", table: "trickTrap" });
      break;
    case PeriodicCheck.WanderingMonster:
      children.push({ type: "pending-roll", table: "wanderingWhereFrom" });
      children.push({ type: "pending-roll", table: `monsterLevel:${level}`, context: { kind: "wandering", level } });
      break;
  }
  return {
    type: "event",
    roll: usedRoll,
    event: { kind: "periodicCheck", result: command, level, avoidMonster: options?.avoidMonster },
    children: children.length ? children : undefined,
  };
}

export function resolveDoorBeyond(options?: {
  roll?: number;
  doorAhead?: boolean;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(doorBeyond.sides);
  const command = getTableEntry(usedRoll, doorBeyond);
  return {
    type: "event",
    roll: usedRoll,
    event: { kind: "doorBeyond", result: command, doorAhead: options?.doorAhead },
  };
}

export function resolveSidePassages(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(sidePassages.sides);
  const command = getTableEntry(usedRoll, sidePassages);
  const event: OutcomeEvent = { kind: "sidePassages", result: command } as OutcomeEvent;
  return { type: "event", roll: usedRoll, event };
}

export function resolvePassageTurns(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(passageTurns.sides);
  const command = getTableEntry(usedRoll, passageTurns);
  const event: OutcomeEvent = { kind: "passageTurns", result: command } as OutcomeEvent;
  // After a turn, determine passage width as a staged child in detail mode
  const children: DungeonOutcomeNode[] = [{ type: "pending-roll", table: "passageWidth" }];
  return { type: "event", roll: usedRoll, event, children };
}

export function resolveStairs(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(stairs.sides);
  const command = getTableEntry(usedRoll, stairs);
  const event: OutcomeEvent = { kind: "stairs", result: command } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === Stairs.DownOne) {
    children.push({ type: "pending-roll", table: "egress:one" });
  } else if (command === Stairs.DownTwo) {
    children.push({ type: "pending-roll", table: "egress:two" });
  } else if (command === Stairs.DownThree) {
    children.push({ type: "pending-roll", table: "egress:three" });
  } else if (command === Stairs.UpDead || command === Stairs.DownDead) {
    children.push({ type: "pending-roll", table: "chute" });
  } else if (command === Stairs.UpOneDownTwo) {
    children.push({ type: "pending-roll", table: "chamberDimensions" });
  }
  return { type: "event", roll: usedRoll, event, children: children.length ? children : undefined };
}

export function resolveSpecialPassage(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(specialPassage.sides);
  const command = getTableEntry(usedRoll, specialPassage);
  const event: OutcomeEvent = { kind: "specialPassage", result: command } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === SpecialPassage.FiftyFeetGalleries) {
    children.push({ type: "pending-roll", table: "galleryStairLocation" });
  } else if (command === SpecialPassage.TenFootStream) {
    children.push({ type: "pending-roll", table: "streamConstruction" });
  } else if (
    command === SpecialPassage.TwentyFootRiver ||
    command === SpecialPassage.FortyFootRiver ||
    command === SpecialPassage.SixtyFootRiver
  ) {
    children.push({ type: "pending-roll", table: "riverConstruction" });
  } else if (command === SpecialPassage.TwentyFootChasm) {
    children.push({ type: "pending-roll", table: "chasmDepth" });
    children.push({ type: "pending-roll", table: "chasmConstruction" });
  }
  return { type: "event", roll: usedRoll, event, children: children.length ? children : undefined };
}

export function resolvePassageWidth(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(passageWidth.sides);
  const command = getTableEntry(usedRoll, passageWidth);
  const event: OutcomeEvent = { kind: "passageWidth", result: command } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === PassageWidth.SpecialPassage) {
    children.push({ type: "pending-roll", table: "specialPassage" });
  }
  return { type: "event", roll: usedRoll, event, children: children.length ? children : undefined };
}

export function resolveRoomDimensions(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(roomDimensions.sides);
  const command = getTableEntry(usedRoll, roomDimensions);
  const event: OutcomeEvent = { kind: "roomDimensions", result: command } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  switch (command) {
    case RoomDimensions.Square10x10:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 10, width: 10, isRoom: true } });
      break;
    case RoomDimensions.Square20x20:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 20, width: 20, isRoom: true } });
      break;
    case RoomDimensions.Square30x30:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 30, width: 30, isRoom: true } });
      break;
    case RoomDimensions.Square40x40:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 40, width: 40, isRoom: true } });
      break;
    case RoomDimensions.Rectangular10x20:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 10, width: 20, isRoom: true } });
      break;
    case RoomDimensions.Rectangular20x30:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 20, width: 30, isRoom: true } });
      break;
    case RoomDimensions.Rectangular20x40:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 20, width: 40, isRoom: true } });
      break;
    case RoomDimensions.Rectangular30x40:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 30, width: 40, isRoom: true } });
      break;
    case RoomDimensions.Unusual:
      children.push({ type: "pending-roll", table: "unusualShape" });
      children.push({ type: "pending-roll", table: "unusualSize" });
      break;
  }
  return { type: "event", roll: usedRoll, event, children: children.length ? children : undefined };
}

export function resolveChamberDimensions(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chamberDimensions.sides);
  const command = getTableEntry(usedRoll, chamberDimensions);
  const event: OutcomeEvent = { kind: "chamberDimensions", result: command } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  switch (command) {
    case ChamberDimensions.Square20x20:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 20, width: 20, isRoom: false } });
      break;
    case ChamberDimensions.Square30x30:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 30, width: 30, isRoom: false } });
      break;
    case ChamberDimensions.Square40x40:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 40, width: 40, isRoom: false } });
      break;
    case ChamberDimensions.Rectangular20x30:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 20, width: 30, isRoom: false } });
      break;
    case ChamberDimensions.Rectangular30x50:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 30, width: 50, isRoom: false } });
      break;
    case ChamberDimensions.Rectangular40x60:
      children.push({ type: "pending-roll", table: "numberOfExits", context: { kind: "exits", length: 40, width: 60, isRoom: false } });
      break;
    case ChamberDimensions.Unusual:
      children.push({ type: "pending-roll", table: "unusualShape" });
      children.push({ type: "pending-roll", table: "unusualSize" });
      break;
  }
  return { type: "event", roll: usedRoll, event, children: children.length ? children : undefined };
}

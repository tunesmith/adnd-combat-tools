import {
  ChasmConstruction,
  ChasmDepth,
  GalleryStairLocation,
  GalleryStairOccurrence,
  JumpingPlaceWidth,
  RiverBoatBank,
  RiverConstruction,
  SpecialPassage,
  StreamConstruction,
} from "./specialPassage";
import { PassageWidth } from "./passageWidth";
import { SidePassages } from "./sidePassages";
import { DoorBeyond } from "./doorBeyond";
import { DoorLocation } from "./doorLocation";
import { PeriodicCheck } from "./periodicCheck";
import { PassageTurns } from "./passageTurns";
import { ChamberDimensions, RoomDimensions } from "./chambersRooms";
import { CircularContents, UnusualShape } from "./unusualShape";
import { UnusualSize } from "./unusualSize";
import { NumberOfExits, OneToFour } from "./numberOfExits";
import { ExitLocation, StrangeDoor } from "./exitLocation";
import { ExitDirection } from "./exitDirection";
import { Chute, Egress, Stairs } from "./stairs";
import { Pool } from "./pool";
import {
  MagicPool,
  PoolAlignment,
  TransmuteType,
  TransporterLocation,
} from "./magicPool";
import {
  Human,
  MonsterDistributionLevel,
  MonsterLevel,
  MonsterOne,
  MonsterTwo,
} from "./monsterLevel";

export type Table<T> = {
  sides: number;
  entries: [Entry<T>, ...Entry<T>[]];
};

// Define a non-empty range tuple
export type Range = [number, ...number[]];

export type Entry<T> = {
  range: Range;
  command: T;
};

export type Command =
  | PeriodicCheck
  | DoorLocation
  | DoorBeyond
  | SidePassages
  | PassageWidth
  | SpecialPassage
  | GalleryStairLocation
  | GalleryStairOccurrence
  | StreamConstruction
  | RiverConstruction
  | RiverBoatBank
  | ChasmDepth
  | ChasmConstruction
  | JumpingPlaceWidth
  | PassageTurns
  | ChamberDimensions
  | RoomDimensions
  | UnusualShape
  | CircularContents
  | UnusualSize
  | NumberOfExits
  | OneToFour
  | ExitLocation
  | StrangeDoor
  | ExitDirection
  | Stairs
  | Egress
  | Chute
  | Pool
  | MagicPool
  | TransmuteType
  | PoolAlignment
  | TransporterLocation
  | MonsterDistributionLevel
  | MonsterLevel
  | MonsterOne
  | Human
  | MonsterTwo;

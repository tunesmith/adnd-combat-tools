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
import { MonsterDistributionLevel, MonsterLevel } from "./monster/monsterLevel";
import { Human, MonsterOne } from "./monster/monsterOne";
import { MonsterTwo } from "./monster/monsterTwo";
import { DragonThree, MonsterThree } from "./monster/monsterThree";
import {
  DragonFourOlder,
  DragonFourYounger,
  MonsterFour,
} from "./monster/monsterFour";
import {
  DragonFiveOlder,
  DragonFiveYounger,
  MonsterFive,
} from "./monster/monsterFive";
import { DragonSix, MonsterSix } from "./monster/monsterSix";
import { DragonSeven, MonsterSeven } from "./monster/monsterSeven";
import { DragonEight, MonsterEight } from "./monster/monsterEight";
import { DragonNine, MonsterNine } from "./monster/monsterNine";
import { DragonTen, MonsterTen } from "./monster/monsterTen";

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
  | MonsterTwo
  | MonsterThree
  | MonsterFour
  | MonsterFive
  | MonsterSix
  | MonsterSeven
  | MonsterEight
  | MonsterNine
  | MonsterTen
  | DragonThree
  | DragonFourYounger
  | DragonFourOlder
  | DragonFiveYounger
  | DragonFiveOlder
  | DragonSix
  | DragonSeven
  | DragonEight
  | DragonNine
  | DragonTen;

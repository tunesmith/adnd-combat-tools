import type { PeriodicCheck } from '../../tables/dungeon/periodicCheck';
import type { DoorBeyond } from '../../tables/dungeon/doorBeyond';
import type { SidePassages } from '../../tables/dungeon/sidePassages';
import type { PassageTurns } from '../../tables/dungeon/passageTurns';
import type { Stairs, Egress } from '../../tables/dungeon/stairs';
import type { SpecialPassage } from '../../tables/dungeon/specialPassage';
import type { PassageWidth } from '../../tables/dungeon/passageWidth';
import type {
  RoomDimensions,
  ChamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import type { NumberOfExits } from '../../tables/dungeon/numberOfExits';
import type { UnusualShape } from '../../tables/dungeon/unusualShape';
import type { UnusualSize } from '../../tables/dungeon/unusualSize';
import type { DoorLocation } from '../../tables/dungeon/doorLocation';
import type { PeriodicCheckDoorOnly } from '../../tables/dungeon/periodicCheckDoorOnly';
import type {
  GalleryStairLocation,
  GalleryStairOccurrence,
  StreamConstruction,
  RiverConstruction,
  RiverBoatBank,
  ChasmDepth,
  ChasmConstruction,
  JumpingPlaceWidth,
} from '../../tables/dungeon/specialPassage';

export type DoorChainLaterality = 'Left' | 'Right';

// Domain outcome event kinds cover high-level tables we resolve.
export type OutcomeEvent =
  | {
      kind: 'periodicCheck';
      result: PeriodicCheck;
      level: number;
      avoidMonster?: boolean;
    }
  | { kind: 'doorBeyond'; result: DoorBeyond; doorAhead?: boolean }
  | {
      kind: 'doorLocation';
      result: DoorLocation;
      existingBefore: DoorChainLaterality[];
      existingAfter: DoorChainLaterality[];
      sequence: number;
    }
  | {
      kind: 'periodicDoorOnly';
      result: PeriodicCheckDoorOnly;
      existing: DoorChainLaterality[];
      sequence: number;
    }
  | { kind: 'sidePassages'; result: SidePassages }
  | { kind: 'passageTurns'; result: PassageTurns }
  | { kind: 'stairs'; result: Stairs }
  | { kind: 'specialPassage'; result: SpecialPassage }
  | { kind: 'passageWidth'; result: PassageWidth }
  | { kind: 'roomDimensions'; result: RoomDimensions }
  | { kind: 'chamberDimensions'; result: ChamberDimensions }
  | { kind: 'egress'; result: Egress; which: 'one' | 'two' | 'three' }
  | { kind: 'chute'; result: number }
  | {
      kind: 'numberOfExits';
      result: NumberOfExits;
      context: { length: number; width: number; isRoom: boolean };
    }
  | { kind: 'unusualShape'; result: UnusualShape }
  | { kind: 'unusualSize'; result: UnusualSize }
  | { kind: 'wanderingWhereFrom'; result: PeriodicCheck }
  | { kind: 'galleryStairLocation'; result: GalleryStairLocation }
  | { kind: 'galleryStairOccurrence'; result: GalleryStairOccurrence }
  | { kind: 'streamConstruction'; result: StreamConstruction }
  | { kind: 'riverConstruction'; result: RiverConstruction }
  | { kind: 'riverBoatBank'; result: RiverBoatBank }
  | { kind: 'chasmDepth'; result: ChasmDepth }
  | { kind: 'chasmConstruction'; result: ChasmConstruction }
  | { kind: 'jumpingPlaceWidth'; result: JumpingPlaceWidth };

export type PendingRoll = {
  type: 'pending-roll';
  table: string;
  // optional context used by the UI to thread chains like door locations
  context?: unknown;
};

export type OutcomeEventNode = {
  type: 'event';
  event: OutcomeEvent;
  roll: number;
  children?: DungeonOutcomeNode[];
};

export type DungeonOutcomeNode = OutcomeEventNode | PendingRoll;

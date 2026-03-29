import type {
  DoorBeyond,
  PeriodicCheck,
} from '../features/navigation/entry/entryTable';
import type { SidePassages } from '../features/navigation/sidePassage/sidePassageTable';
import type { PassageTurns } from '../features/navigation/passageTurn/passageTurnTable';
import type { Stairs, Egress } from '../features/navigation/exit/stairsTable';
import type { SpecialPassage } from '../features/navigation/specialPassage/specialPassageTable';
import type { PassageWidth } from '../features/navigation/passageWidth/passageWidthTable';
import type { NumberOfExits } from '../features/navigation/exit/numberOfExitsTable';
import type {
  DoorLocation,
  PeriodicCheckDoorOnly,
} from '../features/navigation/doorChain/doorChainTable';
import type {
  GalleryStairLocation,
  GalleryStairOccurrence,
  StreamConstruction,
  RiverConstruction,
  RiverBoatBank,
} from '../features/navigation/specialPassage/specialPassageTable';
import type {
  ChasmDepth,
  ChasmConstruction,
  JumpingPlaceWidth,
} from '../features/navigation/chasm/chasmTable';
import type {
  ExitAlternative,
  ExitDirection,
  ExitLocation,
} from '../features/navigation/exit/exitLocationsTable';
import type { ResultOutcomeEvent } from './outcomeEventPrimitives';

export type DoorChainLaterality = 'Left' | 'Right';

export type NavigationOutcomeEvent =
  | {
      kind: 'periodicCheck';
      result: PeriodicCheck;
      level: number;
      avoidMonster?: boolean;
    }
  | {
      kind: 'doorBeyond';
      result: DoorBeyond;
      doorAhead?: boolean;
      level?: number;
    }
  | {
      kind: 'doorLocation';
      result: DoorLocation;
      sequence: number;
      doorChain?: {
        existing: DoorChainLaterality[];
        repeated: boolean;
        added?: DoorChainLaterality;
      };
    }
  | {
      kind: 'periodicCheckDoorOnly';
      result: PeriodicCheckDoorOnly;
      sequence: number;
      doorChain?: {
        existing: DoorChainLaterality[];
      };
    }
  | ResultOutcomeEvent<'sidePassages', SidePassages>
  | ResultOutcomeEvent<'passageTurns', PassageTurns>
  | ResultOutcomeEvent<'stairs', Stairs>
  | ResultOutcomeEvent<'specialPassage', SpecialPassage>
  | ResultOutcomeEvent<'passageWidth', PassageWidth>
  | (ResultOutcomeEvent<'egress', Egress> & {
      which: 'one' | 'two' | 'three';
    })
  | ResultOutcomeEvent<'chute', number>
  | (ResultOutcomeEvent<'numberOfExits', NumberOfExits> & {
      context: { length: number; width: number; isRoom: boolean };
      count: number;
    })
  | (ResultOutcomeEvent<'passageExitLocation', ExitLocation> & {
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    })
  | (ResultOutcomeEvent<'doorExitLocation', ExitLocation> & {
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    })
  | (ResultOutcomeEvent<'exitDirection', ExitDirection> & {
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    })
  | (ResultOutcomeEvent<'exitAlternative', ExitAlternative> & {
      exitType?: 'door' | 'passage';
    })
  | ResultOutcomeEvent<'wanderingWhereFrom', PeriodicCheck>
  | ResultOutcomeEvent<'galleryStairLocation', GalleryStairLocation>
  | ResultOutcomeEvent<'galleryStairOccurrence', GalleryStairOccurrence>
  | ResultOutcomeEvent<'streamConstruction', StreamConstruction>
  | ResultOutcomeEvent<'riverConstruction', RiverConstruction>
  | ResultOutcomeEvent<'riverBoatBank', RiverBoatBank>
  | ResultOutcomeEvent<'chasmDepth', ChasmDepth>
  | ResultOutcomeEvent<'chasmConstruction', ChasmConstruction>
  | ResultOutcomeEvent<'jumpingPlaceWidth', JumpingPlaceWidth>;

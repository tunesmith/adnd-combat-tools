import type {
  RoomDimensions,
  ChamberDimensions,
  ChamberRoomContents,
  ChamberRoomStairs,
} from '../features/environment/roomsChambers/roomsChambersTable';
import type {
  CircularContents,
  Pool,
  MagicPool,
  TransmuteType,
  PoolAlignment,
  TransporterLocation,
} from '../features/environment/circularPools/circularPoolsTable';
import type {
  UnusualShape,
  UnusualSize,
} from '../features/environment/unusualSpace/unusualSpaceTable';
import type { ResultOutcomeEvent } from './outcomeEventPrimitives';

export type EnvironmentOutcomeEvent =
  | ResultOutcomeEvent<'roomDimensions', RoomDimensions>
  | ResultOutcomeEvent<'chamberDimensions', ChamberDimensions>
  | ResultOutcomeEvent<'unusualShape', UnusualShape>
  | ResultOutcomeEvent<'circularContents', CircularContents>
  | ResultOutcomeEvent<'circularPool', Pool>
  | ResultOutcomeEvent<'circularMagicPool', MagicPool>
  | ResultOutcomeEvent<'transmuteType', TransmuteType>
  | ResultOutcomeEvent<'poolAlignment', PoolAlignment>
  | ResultOutcomeEvent<'transporterLocation', TransporterLocation>
  | (ResultOutcomeEvent<'unusualSize', UnusualSize> & {
      extra: number;
      area?: number;
    })
  | (ResultOutcomeEvent<'chamberRoomContents', ChamberRoomContents> & {
      autoResolved?: boolean;
    })
  | ResultOutcomeEvent<'chamberRoomStairs', ChamberRoomStairs>;

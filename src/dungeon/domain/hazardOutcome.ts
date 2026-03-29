import type { IllusionaryWallNature } from '../features/hazards/illusionaryWall/illusionaryWallTable';
import type { GasTrapEffect } from '../features/hazards/gasTrap/gasTrapTable';
import type { TrickTrap } from '../features/hazards/trickTrap/trickTrapTable';
import type { ResultOutcomeEvent } from './outcomeEventPrimitives';

export type HazardOutcomeEvent =
  | ResultOutcomeEvent<'trickTrap', TrickTrap>
  | ResultOutcomeEvent<'illusionaryWallNature', IllusionaryWallNature>
  | ResultOutcomeEvent<'gasTrapEffect', GasTrapEffect>;

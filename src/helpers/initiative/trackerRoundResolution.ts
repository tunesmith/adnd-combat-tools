import {
  resolveInitiativeScenario,
  type InitiativeResolvedRound,
} from './resolvedRound';
import { buildInitiativeScenarioFromTrackerRound } from './trackerScenario';
import type { TrackerRound } from '../../types/tracker';

export const resolveTrackerRoundInitiative = (
  round: TrackerRound
): InitiativeResolvedRound =>
  resolveInitiativeScenario(buildInitiativeScenarioFromTrackerRound(round));

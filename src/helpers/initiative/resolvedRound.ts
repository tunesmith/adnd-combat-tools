import { buildInitiativeAttackGraph } from './attackGraph';
import { resolveInitiativeRound } from './roundResolution';
import {
  buildInitiativeRoundResolutionViewModel,
  type InitiativeRoundResolutionViewModel,
} from './roundResolutionViewModel';
import { buildInitiativeScenario } from './scenario';
import type {
  InitiativeAttackGraph,
  InitiativeRoundResolution,
  InitiativeScenario,
  InitiativeScenarioDraft,
} from '../../types/initiative';

export interface InitiativeResolvedRound {
  scenario: InitiativeScenario;
  resolution: InitiativeRoundResolution;
  attackGraph: InitiativeAttackGraph;
  viewModel: InitiativeRoundResolutionViewModel;
}

export const resolveInitiativeScenario = (
  scenario: InitiativeScenario
): InitiativeResolvedRound => {
  const resolution = resolveInitiativeRound(scenario);

  return {
    scenario,
    resolution,
    attackGraph: buildInitiativeAttackGraph(scenario, resolution),
    viewModel: buildInitiativeRoundResolutionViewModel(scenario, resolution),
  };
};

export const resolveInitiativeDraft = (
  draft: InitiativeScenarioDraft
): InitiativeResolvedRound =>
  resolveInitiativeScenario(buildInitiativeScenario(draft));

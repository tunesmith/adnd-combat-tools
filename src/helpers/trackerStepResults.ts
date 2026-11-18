import type { InitiativeResolvedRound } from './initiative/resolvedRound';
import type { TrackerRound, TrackerStepResult } from '../types/tracker';
import { buildInitiativeAttackGraphNodeDisplayById } from './initiative/attackGraphDisplay';
import { resolveTrackerRoundInitiative } from './initiative/trackerRoundResolution';

export type TrackerStep = Omit<TrackerStepResult, 'text' | 'stepKey'> & {
  stepKey: string;
};

export function buildTrackerSteps(
  round: TrackerRound,
  resolved: InitiativeResolvedRound,
  displays = buildInitiativeAttackGraphNodeDisplayById(resolved)
): Map<string, TrackerStep> {
  const actors = new Map(
    resolved.scenario.party
      .concat(resolved.scenario.enemies)
      .map((actor) => [actor.id, actor])
  );
  const steps = new Map<string, TrackerStep>();
  for (const node of resolved.attackGraph.nodes) {
    const actor = actors.get(node.combatantId);
    const display = displays[node.id];
    if (!actor || !display) continue;
    const actorKey = actor.ownerCombatantKey ?? actor.combatantKey;
    const targets = (node.targetId ? [node.targetId] : actor.targetIds).flatMap(
      (id) => {
        const target = actors.get(id);
        return target ? [target] : [];
      }
    );
    const candidateKeys = targets
      .map((target) => target.ownerCombatantKey ?? target.combatantKey)
      .sort((a, b) => a - b);
    // A single discharge or completion can cover an explicitly assigned set.
    // Grid cells shared by several actions are only candidates for that step.
    const isCollectiveStep =
      node.kind === 'spell-completion' ||
      actor.declaredAction === 'turn-undead' ||
      actor.declaredAction === 'magical-device';
    const declaration = round.actions?.find(
      (action) => action.id === actor.actionId
    );
    const confirmed =
      targets.length <= 1 ||
      (isCollectiveStep &&
        declaration &&
        targets.every((target) => {
          const cell =
            actor.side === 'party'
              ? round.cells[target.index]?.[actor.index]
              : round.cells[actor.index]?.[target.index];
          const assignments =
            actor.side === 'party'
              ? cell?.partyToEnemyActionIds
              : cell?.enemyToPartyActionIds;
          return (
            assignments?.includes(declaration.id) ||
            declaration.targetDeclarations.some(
              (t) =>
                t.targetCombatantKey ===
                (target.ownerCombatantKey ?? target.combatantKey)
            )
          );
        }));
    // Graph IDs for secondary declarations use their position in the list.
    // Persist the declaration ID and its occurrence within the routine instead.
    const stepKey = JSON.stringify([
      actor.side,
      actorKey,
      actor.actionId,
      actor.declaredAction,
      actor.actionLabel,
      ['open-melee', 'missile', 'charge', 'set-vs-charge'].includes(
        actor.declaredAction
      )
        ? actor.weaponId
        : null,
      node.kind,
      node.source,
      node.routineNumber,
      node.componentId,
      candidateKeys,
      Boolean(confirmed),
    ]);
    steps.set(node.id, {
      stepKey,
      side: actor.side,
      actorKey,
      actorName: actor.name,
      targetKeys: confirmed ? candidateKeys : [],
      targetLabel:
        confirmed && targets.length > 1
          ? targets.map((target) => target.name).join(', ')
          : display.targetLabel,
      stepLabel:
        node.routineNumber &&
        actor.attackRoutineCount > 1 &&
        actor.attackRoutine.components.length > 1
          ? `${display.actionLabel} (routine ${node.routineNumber})`
          : display.actionLabel,
    });
  }
  return steps;
}

export function setTrackerStepResult(
  round: TrackerRound,
  step: TrackerStep,
  text: string
): TrackerRound {
  const results = round.stepResults || [];
  if (!text)
    return {
      ...round,
      stepResults: results.filter((result) => result.stepKey !== step.stepKey),
    };
  const stepResults = results.slice();
  const index = results.findIndex((result) => result.stepKey === step.stepKey);
  const result = { ...step, text };
  if (index === -1) stepResults.push(result);
  else stepResults[index] = result;
  return { ...round, stepResults };
}

// Removing and then recreating even an identical declaration starts a fresh
// step. Keep the earlier note and its original recipients available for review.
export function retainPriorStepResults(round: TrackerRound): TrackerRound {
  if (!round.stepResults?.some((result) => result.stepKey !== null))
    return round;
  const steps = buildTrackerSteps(round, resolveTrackerRoundInitiative(round));
  const keys = new Set(Array.from(steps.values(), (step) => step.stepKey));
  return {
    ...round,
    stepResults: round.stepResults.map((result) =>
      result.stepKey !== null && !keys.has(result.stepKey)
        ? { ...result, stepKey: null }
        : result
    ),
  };
}

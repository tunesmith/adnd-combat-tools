import type { InitiativeResolvedRound } from './initiative/resolvedRound';
import type { TrackerRound, TrackerStepResult } from '../types/tracker';
import { buildInitiativeAttackGraphNodeDisplayById } from './initiative/attackGraphDisplay';
import { resolveTrackerRoundInitiative } from './initiative/trackerRoundResolution';

export type TrackerStep = Omit<
  TrackerStepResult,
  'text' | 'gridMark' | 'stepKey'
> & {
  stepKey: string;
  resultTargetOptions?: { key: number; name: string }[];
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
  const savedKeys = new Set(round.stepResults?.map((result) => result.stepKey));
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
    // These nodes represent one action affecting its declared set. For an
    // individual blow the same list can instead mean several possible targets.
    const collective =
      node.kind === 'spell-start' ||
      node.kind === 'spell-completion' ||
      actor.declaredAction === 'turn-undead' ||
      actor.declaredAction === 'magical-device';
    const confirmed = targets.length <= 1 || collective;
    // Graph IDs for secondary declarations use their position in the list.
    // Persist the declaration ID and its occurrence within the routine instead.
    const identity = [
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
    ];
    let stepKey = JSON.stringify([...identity, confirmed]);
    if (collective && targets.length > 1 && !savedKeys.has(stepKey)) {
      // Older trackers sometimes offered a single-target picker for this same
      // step. Keep its saved record attached, including its original recipients.
      const oldKey = JSON.stringify([...identity, false]);
      if (savedKeys.has(oldKey)) stepKey = oldKey;
    }
    steps.set(node.id, {
      stepKey,
      side: actor.side,
      actorKey,
      actorName: actor.name,
      targetKeys: confirmed ? candidateKeys : [],
      ...(!confirmed
        ? {
            resultTargetOptions: targets.map((target) => ({
              key: target.ownerCombatantKey ?? target.combatantKey,
              name: target.name,
            })),
          }
        : {}),
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

export function getTrackerResultTarget(
  step: TrackerStep,
  result?: TrackerStepResult
) {
  return step.resultTargetOptions?.find(
    (option) => option.key === result?.targetKeys[0]
  );
}

export function hasNarrowerSavedTargets(
  step: TrackerStep,
  result?: TrackerStepResult
) {
  return (
    !!result &&
    step.targetKeys.length > 1 &&
    step.targetKeys.some((key) => !result.targetKeys.includes(key))
  );
}

export type TrackerStepResultEdit =
  | string
  | { gridMark: string }
  | { targetKey: number | null }
  | { useDeclaredTargets: true };

export function setTrackerStepResult(
  round: TrackerRound,
  step: TrackerStep,
  edit: TrackerStepResultEdit
): TrackerRound {
  const results = round.stepResults || [];
  const index = results.findIndex((result) => result.stepKey === step.stepKey);
  const previous = results[index];
  const { resultTargetOptions, ...context } = step;
  let target = getTrackerResultTarget(step, previous);
  let text = previous?.text ?? '';
  let gridMark = previous?.gridMark;
  if (typeof edit === 'string') {
    text = edit;
  } else if ('gridMark' in edit) {
    gridMark = edit.gridMark;
  } else if ('targetKey' in edit) {
    if (!resultTargetOptions) return round;
    target = resultTargetOptions.find(
      (option) => option.key === edit.targetKey
    );
    if (edit.targetKey !== null && !target) return round;
  }
  const keepSavedTargets =
    hasNarrowerSavedTargets(step, previous) &&
    !(typeof edit === 'object' && 'useDeclaredTargets' in edit);
  if (
    !text &&
    !gridMark &&
    !target &&
    !(keepSavedTargets && previous?.targetKeys.length)
  ) {
    return {
      ...round,
      stepResults: results.filter((result) => result.stepKey !== step.stepKey),
    };
  }
  const stepResults = results.slice();
  const result = {
    ...context,
    ...(gridMark && { gridMark }),
    text,
    targetKeys:
      keepSavedTargets && previous
        ? previous.targetKeys
        : target
        ? [target.key]
        : step.targetKeys,
    targetLabel:
      keepSavedTargets && previous
        ? previous.targetLabel
        : target?.name ?? step.targetLabel,
  };
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
    stepResults: round.stepResults.flatMap((result) => {
      if (result.stepKey === null || keys.has(result.stepKey)) return [result];
      return result.text.trim() || result.gridMark?.trim()
        ? [{ ...result, stepKey: null }]
        : [];
    }),
  };
}

// This is a projection, never a source for declarations or the next round.
// Graph layers order marks even if the DM enters or revises them out of order.
export function compileTrackerGridMarks(
  layers: string[][],
  steps: Map<string, TrackerStep>,
  results: Map<string | null, TrackerStepResult>
) {
  const cells = new Map<string, string>();
  for (const nodeId of layers.flat()) {
    const step = steps.get(nodeId);
    if (!step) continue;
    const result = results.get(step.stepKey);
    const mark = result?.gridMark?.trim();
    if (!result || !mark) continue;
    const choice = getTrackerResultTarget(step, result);
    for (const targetKey of choice
      ? [choice.key]
      : step.targetKeys.filter((key) => result.targetKeys.includes(key))) {
      const key = `${step.side}:${step.actorKey}:${targetKey}`;
      const earlier = cells.get(key);
      cells.set(key, earlier ? `${earlier} · ${mark}` : mark);
    }
  }
  return cells;
}

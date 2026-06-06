import type {
  InitiativeRoundResolution,
  InitiativeScenario,
  InitiativeScenarioSide,
  InitiativeSimpleOrderStep,
  InitiativeTimingOverride,
} from '../../types/initiative';
import { getInitiativeTimingOverrideRank } from './initiativeTiming';

const getSimpleOrderStep = (
  combatantIds: string[],
  sides: InitiativeScenarioSide[],
  initiativeTiming?: InitiativeTimingOverride
): InitiativeSimpleOrderStep | undefined =>
  combatantIds.length > 0
    ? {
        combatantIds,
        sides,
        ...(initiativeTiming && initiativeTiming !== 'normal'
          ? { initiativeTiming }
          : {}),
      }
    : undefined;

const getTimingOverrideForRank = (
  timingRank: number
): InitiativeTimingOverride =>
  timingRank > 0
    ? 'wins-initiative'
    : timingRank < 0
    ? 'loses-initiative'
    : 'normal';

export const resolveInitiativeRound = (
  scenario: InitiativeScenario
): InitiativeRoundResolution => {
  const hasRoundAction = (combatant: InitiativeScenario['party'][number]) =>
    combatant.declaredAction !== 'none' || combatant.actionLabel !== undefined;
  const overriddenCombatantIds = Array.from(
    new Set(
      scenario.directMeleeEngagements.flatMap((engagement) => [
        engagement.partyCombatantId,
        engagement.enemyCombatantId,
      ])
    )
  );
  const simpleOrderPartyCombatantIds = scenario.party
    .filter(hasRoundAction)
    .map((combatant) => combatant.id);
  const simpleOrderEnemyCombatantIds = scenario.enemies
    .filter(hasRoundAction)
    .map((combatant) => combatant.id);
  const simpleOrderCombatants = scenario.party
    .concat(scenario.enemies)
    .filter(hasRoundAction);

  const getSideOrderedSteps = (
    partyCombatantIds: string[],
    enemyCombatantIds: string[],
    initiativeTiming: InitiativeTimingOverride
  ): InitiativeSimpleOrderStep[] => {
    if (scenario.simpleOrder === 'party-first') {
      return [
        getSimpleOrderStep(partyCombatantIds, ['party'], initiativeTiming),
        getSimpleOrderStep(enemyCombatantIds, ['enemy'], initiativeTiming),
      ].filter((step): step is InitiativeSimpleOrderStep => Boolean(step));
    }

    if (scenario.simpleOrder === 'enemy-first') {
      return [
        getSimpleOrderStep(enemyCombatantIds, ['enemy'], initiativeTiming),
        getSimpleOrderStep(partyCombatantIds, ['party'], initiativeTiming),
      ].filter((step): step is InitiativeSimpleOrderStep => Boolean(step));
    }

    const simultaneousCombatantIds = [
      ...partyCombatantIds,
      ...enemyCombatantIds,
    ];
    const simultaneousSides: InitiativeScenarioSide[] = [
      ...(partyCombatantIds.length > 0 ? (['party'] as const) : []),
      ...(enemyCombatantIds.length > 0 ? (['enemy'] as const) : []),
    ];

    return [
      getSimpleOrderStep(
        simultaneousCombatantIds,
        simultaneousSides,
        initiativeTiming
      ),
    ].filter((step): step is InitiativeSimpleOrderStep => Boolean(step));
  };

  const simpleOrderSteps = (() => {
    const timingRanks = [1, 0, -1];

    return timingRanks.flatMap((timingRank) => {
      const initiativeTiming = getTimingOverrideForRank(timingRank);
      const combatantIds = new Set(
        simpleOrderCombatants
          .filter(
            (combatant) =>
              getInitiativeTimingOverrideRank(combatant.initiativeTiming) ===
              timingRank
          )
          .map((combatant) => combatant.id)
      );

      return getSideOrderedSteps(
        simpleOrderPartyCombatantIds.filter((combatantId) =>
          combatantIds.has(combatantId)
        ),
        simpleOrderEnemyCombatantIds.filter((combatantId) =>
          combatantIds.has(combatantId)
        ),
        initiativeTiming
      );
    });
  })();

  const simpleOrderCombatantIds = simpleOrderSteps.flatMap(
    (step) => step.combatantIds
  );

  return {
    label: scenario.label,
    simpleOrder: scenario.simpleOrder,
    simpleOrderCombatantIds,
    simpleOrderSteps,
    overriddenCombatantIds,
    movementResolutions: scenario.movementResolutions,
    directMeleeEngagements: scenario.directMeleeEngagements,
    unresolvedMeleeCandidateIds: scenario.unresolvedMeleeCandidateIds,
  };
};

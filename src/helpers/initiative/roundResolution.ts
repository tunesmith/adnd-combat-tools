import type {
  InitiativeRoundResolution,
  InitiativeScenario,
  InitiativeScenarioSide,
  InitiativeSimpleOrderStep,
} from '../../types/initiative';

const getSimpleOrderStep = (
  combatantIds: string[],
  sides: InitiativeScenarioSide[]
): InitiativeSimpleOrderStep | undefined =>
  combatantIds.length > 0
    ? {
        combatantIds,
        sides,
      }
    : undefined;

export const resolveInitiativeRound = (
  scenario: InitiativeScenario
): InitiativeRoundResolution => {
  const overriddenCombatantIds = Array.from(
    new Set(
      scenario.directMeleeEngagements.flatMap((engagement) => [
        engagement.partyCombatantId,
        engagement.enemyCombatantId,
      ])
    )
  );
  const simpleOrderPartyCombatantIds = scenario.party.map(
    (combatant) => combatant.id
  );
  const simpleOrderEnemyCombatantIds = scenario.enemies.map(
    (combatant) => combatant.id
  );

  const simpleOrderSteps = (() => {
    if (scenario.simpleOrder === 'party-first') {
      return [
        getSimpleOrderStep(simpleOrderPartyCombatantIds, ['party']),
        getSimpleOrderStep(simpleOrderEnemyCombatantIds, ['enemy']),
      ].filter((step): step is InitiativeSimpleOrderStep => Boolean(step));
    }

    if (scenario.simpleOrder === 'enemy-first') {
      return [
        getSimpleOrderStep(simpleOrderEnemyCombatantIds, ['enemy']),
        getSimpleOrderStep(simpleOrderPartyCombatantIds, ['party']),
      ].filter((step): step is InitiativeSimpleOrderStep => Boolean(step));
    }

    const simultaneousCombatantIds = [
      ...simpleOrderPartyCombatantIds,
      ...simpleOrderEnemyCombatantIds,
    ];
    const simultaneousSides: InitiativeScenarioSide[] = [
      ...(simpleOrderPartyCombatantIds.length > 0 ? (['party'] as const) : []),
      ...(simpleOrderEnemyCombatantIds.length > 0 ? (['enemy'] as const) : []),
    ];

    return [
      getSimpleOrderStep(simultaneousCombatantIds, simultaneousSides),
    ].filter((step): step is InitiativeSimpleOrderStep => Boolean(step));
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
    directMeleeEngagements: scenario.directMeleeEngagements,
    unresolvedMeleeCandidateIds: scenario.unresolvedMeleeCandidateIds,
  };
};

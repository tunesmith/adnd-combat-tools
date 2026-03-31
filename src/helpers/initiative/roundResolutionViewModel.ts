import { getMultipleAttackThreshold } from './openMelee';
import type {
  DirectMeleeEngagement,
  InitiativeMovementResolution,
  InitiativeRoundResolution,
  InitiativeScenario,
  InitiativeScenarioCombatant,
  InitiativeSimpleOrderStep,
} from '../../types/initiative';

interface InitiativeResolutionStepViewModel {
  label: string;
  detail: string;
  combatantIds: string[];
}

interface InitiativeResolutionCardViewModel {
  id: string;
  kind: 'simple-order' | 'movement' | 'direct-melee' | 'unresolved';
  title: string;
  summary: string;
  combatantIds: string[];
  steps: InitiativeResolutionStepViewModel[];
}

interface InitiativeRoundResolutionViewModel {
  cards: InitiativeResolutionCardViewModel[];
  combatantNameById: Record<string, string>;
}

const formatInches = (value: number): string =>
  `${Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, '')}"`;

const formatNames = (
  combatantIds: string[],
  combatantNameById: Record<string, string>
): string =>
  combatantIds
    .map((combatantId) => combatantNameById[combatantId] || combatantId)
    .join(', ');

const buildCombatantNameById = (
  scenario: InitiativeScenario
): Record<string, string> =>
  Object.fromEntries(
    scenario.party
      .concat(scenario.enemies)
      .map((combatant) => [combatant.id, combatant.name])
  );

const buildCombatantById = (
  scenario: InitiativeScenario
): Map<string, InitiativeScenarioCombatant> =>
  new Map(
    scenario.party
      .concat(scenario.enemies)
      .map((combatant) => [combatant.id, combatant] as const)
  );

const getOrderedCombatantIds = (scenario: InitiativeScenario): string[] =>
  scenario.party.concat(scenario.enemies).map((combatant) => combatant.id);

const getSimpleOrderSummary = (
  scenario: InitiativeScenario,
  resolution: InitiativeRoundResolution
): string => {
  if (resolution.simpleOrder === 'party-first') {
    return `Party side won initiative ${scenario.partyInitiative} to ${scenario.enemyInitiative}. This is the baseline side-order for the round; narrower melee timing rules can still refine specific exchanges.`;
  }

  if (resolution.simpleOrder === 'enemy-first') {
    return `Enemy side won initiative ${scenario.enemyInitiative} to ${scenario.partyInitiative}. This is the baseline side-order for the round; narrower melee timing rules can still refine specific exchanges.`;
  }

  return `Both sides tied initiative at ${scenario.partyInitiative}. This leaves the baseline order simultaneous unless narrower melee timing rules create local precedence.`;
};

const getSimpleOrderStepLabel = (
  step: InitiativeSimpleOrderStep,
  resolution: InitiativeRoundResolution
): string => {
  if (resolution.simpleOrder === 'simultaneous') {
    return 'Simultaneous group';
  }

  if (step.sides.length === 1) {
    return step.sides[0] === 'party' ? 'Party side' : 'Enemy side';
  }

  return 'Mixed group';
};

const buildSimpleOrderCard = (
  scenario: InitiativeScenario,
  resolution: InitiativeRoundResolution,
  combatantNameById: Record<string, string>
): InitiativeResolutionCardViewModel | undefined => {
  if (resolution.simpleOrderSteps.length === 0) {
    return undefined;
  }

  return {
    id: 'simple-order',
    kind: 'simple-order',
    title: 'Simple Initiative Order',
    summary: getSimpleOrderSummary(scenario, resolution),
    combatantIds: resolution.simpleOrderCombatantIds,
    steps: resolution.simpleOrderSteps.map((step) => ({
      label: getSimpleOrderStepLabel(step, resolution),
      detail: formatNames(step.combatantIds, combatantNameById),
      combatantIds: step.combatantIds,
    })),
  };
};

const getFasterAndSlower = (
  left: InitiativeScenarioCombatant,
  right: InitiativeScenarioCombatant
) => {
  if (
    left.weaponSpeedFactor !== undefined &&
    right.weaponSpeedFactor !== undefined &&
    left.weaponSpeedFactor <= right.weaponSpeedFactor
  ) {
    return {
      faster: left,
      slower: right,
      difference: right.weaponSpeedFactor - left.weaponSpeedFactor,
    };
  }

  return {
    faster: right,
    slower: left,
    difference: (left.weaponSpeedFactor || 0) - (right.weaponSpeedFactor || 0),
  };
};

const getDirectMeleeSummary = (
  engagement: DirectMeleeEngagement,
  combatantById: Map<string, InitiativeScenarioCombatant>
): string => {
  const partyCombatant = combatantById.get(engagement.partyCombatantId);
  const enemyCombatant = combatantById.get(engagement.enemyCombatantId);

  if (!partyCombatant || !enemyCombatant) {
    return 'This direct melee engagement could not be fully explained because a combatant is missing.';
  }

  if (engagement.resolution.reason === 'initiative') {
    const winner =
      partyCombatant.initiative > enemyCombatant.initiative
        ? partyCombatant
        : enemyCombatant;
    const loser =
      winner.id === partyCombatant.id ? enemyCombatant : partyCombatant;

    return `${winner.name} acts before ${loser.name} because ${
      winner.side === 'party' ? 'party' : 'enemy'
    } side won initiative ${winner.initiative} to ${
      loser.initiative
    }. Weapon speed does not override non-tied initiative in this slice.`;
  }

  if (engagement.resolution.reason === 'simultaneous') {
    if (
      partyCombatant.weaponType === 'melee' &&
      enemyCombatant.weaponType === 'melee' &&
      partyCombatant.weaponSpeedFactor === enemyCombatant.weaponSpeedFactor
    ) {
      return `Both sides tied initiative at ${partyCombatant.initiative}, and both wield weapons with equal speed factor ${partyCombatant.weaponSpeedFactor}. Their first blows land simultaneously.`;
    }

    return `Both sides tied initiative at ${partyCombatant.initiative}. At least one combatant is not using a melee weapon with a speed factor, so this exchange remains simultaneous in the current rules slice.`;
  }

  const { faster, slower, difference } = getFasterAndSlower(
    partyCombatant,
    enemyCombatant
  );

  if (engagement.resolution.reason === 'weapon-speed') {
    return `Both sides tied initiative at ${partyCombatant.initiative}. ${faster.name} has the lower weapon speed factor (${faster.weaponSpeedFactor} vs ${slower.weaponSpeedFactor}), so ${faster.name} strikes first.`;
  }

  if (engagement.resolution.reason === 'weapon-speed-double') {
    const threshold = getMultipleAttackThreshold(faster.weaponSpeedFactor || 0);

    return `Both sides tied initiative at ${partyCombatant.initiative}. ${faster.name}'s weapon speed factor ${faster.weaponSpeedFactor} beats ${slower.name}'s ${slower.weaponSpeedFactor} by ${difference}, meeting the multiple-attack threshold of ${threshold}, so ${faster.name} gets two attacks before ${slower.name}'s first.`;
  }

  return `Both sides tied initiative at ${partyCombatant.initiative}. ${faster.name}'s weapon speed factor ${faster.weaponSpeedFactor} beats ${slower.name}'s ${slower.weaponSpeedFactor} by ${difference}, which is 10 or more, so the faster weapon gets a third attack simultaneous with the slower weapon's first.`;
};

const getStepDetail = (
  combatantIds: string[],
  combatantNameById: Record<string, string>
): string => {
  const names = combatantIds.map(
    (combatantId) => combatantNameById[combatantId] || combatantId
  );

  if (names.length <= 1) {
    return names[0] || '';
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names.slice(0, -1).join(', ')}, ${names[names.length - 1]}`;
};

const buildDirectMeleeCards = (
  resolution: InitiativeRoundResolution,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
): InitiativeResolutionCardViewModel[] =>
  resolution.directMeleeEngagements.map((engagement) => {
    const partyName =
      combatantNameById[engagement.partyCombatantId] ||
      engagement.partyCombatantId;
    const enemyName =
      combatantNameById[engagement.enemyCombatantId] ||
      engagement.enemyCombatantId;

    return {
      id: `direct-melee-${engagement.partyCombatantId}-${engagement.enemyCombatantId}`,
      kind: 'direct-melee',
      title: `${partyName} vs ${enemyName}`,
      summary: getDirectMeleeSummary(engagement, combatantById),
      combatantIds: [engagement.partyCombatantId, engagement.enemyCombatantId],
      steps: engagement.resolution.steps.map((step, index) => ({
        label: `Step ${index + 1}`,
        detail: step.attacks
          .map((attack) => {
            const combatantName =
              combatantNameById[attack.combatantId] || attack.combatantId;
            return `${combatantName} ${attack.label}`;
          })
          .join(step.attacks.length > 1 ? ' and ' : ''),
        combatantIds: step.attacks.map((attack) => attack.combatantId),
      })),
    };
  });

const getMovementSummary = (
  movementResolution: InitiativeMovementResolution,
  combatantNameById: Record<string, string>
): string => {
  const combatantName =
    combatantNameById[movementResolution.combatantId] ||
    movementResolution.combatantId;
  const targetName = movementResolution.targetId
    ? combatantNameById[movementResolution.targetId] ||
      movementResolution.targetId
    : 'the declared target';
  const actionLabel =
    movementResolution.action === 'open-melee'
      ? 'open melee'
      : movementResolution.action;

  if (movementResolution.reason === 'missing-target') {
    return `${combatantName} declared ${actionLabel}, but no single target was available to resolve.`;
  }

  if (movementResolution.reason === 'multiple-targets') {
    return `${combatantName} declared ${actionLabel} against multiple targets. The current scalar-distance model only resolves one moving target at a time.`;
  }

  if (movementResolution.reason === 'missing-distance') {
    return `${combatantName} declared ${actionLabel} toward ${targetName}, but no effective starting distance in inches was supplied.`;
  }

  if (movementResolution.reason === 'target-moving-elsewhere') {
    return `${combatantName} declared ${actionLabel} toward ${targetName}, but ${targetName} is also moving on a different line. This is where the tool deliberately falls back to table adjudication.`;
  }

  if (movementResolution.reason === 'no-contact') {
    return `${combatantName} cannot reach ${targetName} this round. The tool estimates that ${combatantName} ends ${formatInches(
      movementResolution.remainingDistanceInches || 0
    )} short of striking range.`;
  }

  if (movementResolution.action === 'charge') {
    if (movementResolution.firstStrike === 'attacker') {
      return `${combatantName} reaches ${targetName} on segment ${movementResolution.contactSegment} and can strike on the charge. The charging attacker currently has the longer reach, so ${combatantName} attacks first at contact.`;
    }

    if (movementResolution.firstStrike === 'target') {
      return `${combatantName} reaches ${targetName} on segment ${movementResolution.contactSegment} and can strike on the charge. ${targetName} currently has the longer reach, so ${targetName} attacks first at contact.`;
    }

    if (movementResolution.firstStrike === 'simultaneous') {
      return `${combatantName} reaches ${targetName} on segment ${movementResolution.contactSegment} and can strike on the charge. Reach is equal, so contact remains simultaneous in this slice.`;
    }

    return `${combatantName} reaches ${targetName} on segment ${movementResolution.contactSegment} and can strike on the charge, but reach does not currently settle who attacks first at contact.`;
  }

  return `${combatantName} reaches striking range of ${targetName} on segment ${movementResolution.contactSegment}. The current engine does not yet resolve the ensuing blows from a close action in the same round.`;
};

const buildMovementCards = (
  resolution: InitiativeRoundResolution,
  combatantNameById: Record<string, string>
): InitiativeResolutionCardViewModel[] =>
  resolution.movementResolutions.map((movementResolution) => {
    const combatantName =
      combatantNameById[movementResolution.combatantId] ||
      movementResolution.combatantId;
    const targetName = movementResolution.targetId
      ? combatantNameById[movementResolution.targetId] ||
        movementResolution.targetId
      : 'No target';

    return {
      id: `movement-${movementResolution.combatantId}`,
      kind: 'movement',
      title: `${combatantName} ${movementResolution.action}`,
      summary: getMovementSummary(movementResolution, combatantNameById),
      combatantIds: [
        movementResolution.combatantId,
        ...(movementResolution.targetId ? [movementResolution.targetId] : []),
      ],
      steps: [
        {
          label: 'Target',
          detail: targetName,
          combatantIds: movementResolution.targetId
            ? [movementResolution.combatantId, movementResolution.targetId]
            : [movementResolution.combatantId],
        },
        {
          label: 'Distance',
          detail:
            movementResolution.distanceInches !== undefined
              ? `${formatInches(
                  movementResolution.distanceInches
                )} effective start range`
              : 'Distance not supplied',
          combatantIds: movementResolution.targetId
            ? [movementResolution.combatantId, movementResolution.targetId]
            : [movementResolution.combatantId],
        },
        {
          label: 'Outcome',
          detail:
            movementResolution.reason === 'contact'
              ? movementResolution.action === 'charge'
                ? `Contact on segment ${
                    movementResolution.contactSegment
                  } at ${formatInches(
                    movementResolution.closingInchesPerSegment || 0
                  )} per segment; same-round charge attack applies.`
                : `Striking range reached on segment ${
                    movementResolution.contactSegment
                  } at ${formatInches(
                    movementResolution.closingInchesPerSegment || 0
                  )} per segment.`
              : movementResolution.reason === 'no-contact'
              ? `No contact this round; approximately ${formatInches(
                  movementResolution.remainingDistanceInches || 0
                )} remain.`
              : 'Needs table input or adjudication.',
          combatantIds: movementResolution.targetId
            ? [movementResolution.combatantId, movementResolution.targetId]
            : [movementResolution.combatantId],
        },
      ],
    };
  });

const buildUnresolvedCard = (
  scenario: InitiativeScenario,
  resolution: InitiativeRoundResolution,
  combatantNameById: Record<string, string>
): InitiativeResolutionCardViewModel | undefined => {
  if (resolution.unresolvedMeleeCandidateIds.length === 0) {
    return undefined;
  }

  const unresolvedCombatantIdSet = new Set(
    resolution.unresolvedMeleeCandidateIds
  );
  const orderedCombatantIds = getOrderedCombatantIds(scenario).filter(
    (combatantId) => unresolvedCombatantIdSet.has(combatantId)
  );

  return {
    id: 'unresolved-melee',
    kind: 'unresolved',
    title: 'Unresolved Melee Contact',
    summary:
      'These combatants are in mutual melee contact, but not in a clean one-to-one pairing. The current rules slice does not infer extra local precedence for them beyond the baseline initiative order.',
    combatantIds: resolution.unresolvedMeleeCandidateIds,
    steps: [
      {
        label: 'Held back for adjudication',
        detail: getStepDetail(orderedCombatantIds, combatantNameById),
        combatantIds: orderedCombatantIds,
      },
    ],
  };
};

export const buildInitiativeRoundResolutionViewModel = (
  scenario: InitiativeScenario,
  resolution: InitiativeRoundResolution
): InitiativeRoundResolutionViewModel => {
  const combatantNameById = buildCombatantNameById(scenario);
  const combatantById = buildCombatantById(scenario);
  const cards = [
    buildSimpleOrderCard(scenario, resolution, combatantNameById),
    ...buildMovementCards(resolution, combatantNameById),
    ...buildDirectMeleeCards(resolution, combatantNameById, combatantById),
    buildUnresolvedCard(scenario, resolution, combatantNameById),
  ].filter((card): card is InitiativeResolutionCardViewModel => Boolean(card));

  return {
    cards,
    combatantNameById,
  };
};

import { getMultipleAttackThreshold } from './openMelee';
import { compareCombatantInitiative } from './initiativeTiming';
import type {
  DirectMeleeEngagement,
  InitiativeDeclaredAction,
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
  kind:
    | 'simple-order'
    | 'movement'
    | 'direct-melee'
    | 'turn-undead'
    | 'magical-device'
    | 'spell-casting'
    | 'unresolved';
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

const formatDeclaredActionLabel = (action: InitiativeDeclaredAction): string =>
  action === 'open-melee'
    ? 'open melee'
    : action === 'set-vs-charge'
    ? 'set vs charge'
    : action === 'turn-undead'
    ? 'turn undead'
    : action === 'magical-device'
    ? 'magical device'
    : action === 'spell-casting'
    ? 'cast spell'
    : action;

const formatMovementActionLabel = (
  action: InitiativeMovementResolution['action']
): string => formatDeclaredActionLabel(action);

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

  if (engagement.resolution.reason === 'multiple-routines') {
    return `${partyCombatant.name} and ${enemyCombatant.name} are using more than one ordinary attack routine this round. The order follows the DMG multiple-routine rule, with initiative or tied-melee timing only breaking clashes at the same point in the round.`;
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

interface DirectMissileChargeContext {
  missileCombatant: InitiativeScenarioCombatant;
  chargeCombatant: InitiativeScenarioCombatant;
  missileAttackCount: number;
}

const getDirectMissileChargeContext = (
  movementResolution: InitiativeMovementResolution,
  combatantById: Map<string, InitiativeScenarioCombatant>
): DirectMissileChargeContext | undefined => {
  if (
    movementResolution.action !== 'charge' ||
    movementResolution.reason !== 'contact' ||
    movementResolution.targetId === undefined
  ) {
    return undefined;
  }

  const chargeCombatant = combatantById.get(movementResolution.combatantId);
  const missileCombatant = combatantById.get(movementResolution.targetId);

  if (
    !chargeCombatant ||
    !missileCombatant ||
    missileCombatant.declaredAction !== 'missile' ||
    missileCombatant.targetIds.length !== 1 ||
    missileCombatant.targetIds[0] !== chargeCombatant.id
  ) {
    return undefined;
  }

  return {
    missileCombatant,
    chargeCombatant,
    missileAttackCount: missileCombatant.attackRoutine.components.length,
  };
};

const getDirectMissileChargeSummary = (
  context: DirectMissileChargeContext,
  movementResolution: InitiativeMovementResolution
): string => {
  const { missileCombatant, chargeCombatant, missileAttackCount } = context;
  const laterShotText =
    missileAttackCount > 1
      ? 'Later missile shots are lost once melee contact is made.'
      : '';

  const initiativeComparison = compareCombatantInitiative(
    missileCombatant,
    chargeCombatant
  );

  if (initiativeComparison === 0) {
    return `${chargeCombatant.name} reaches ${missileCombatant.name} on segment ${movementResolution.contactSegment}. The first missile shot and the charge attack are simultaneous in this tied round, even if either would be a killing blow. ${laterShotText}`.trim();
  }

  if (initiativeComparison > 0) {
    return `${missileCombatant.name} gets one missile shot off before ${chargeCombatant.name} reaches contact on segment ${movementResolution.contactSegment}. ${laterShotText}`.trim();
  }

  return `${chargeCombatant.name} reaches ${missileCombatant.name} on segment ${movementResolution.contactSegment} before ordinary missile fire can be completed. Pending missile shots are lost once melee contact is made.`;
};

const getDirectMissileChargeOutcome = (
  context: DirectMissileChargeContext,
  movementResolution: InitiativeMovementResolution
): string => {
  const { missileCombatant, chargeCombatant, missileAttackCount } = context;
  const laterShotText =
    missileAttackCount > 1 ? '; later missile shots are lost at contact' : '';

  const initiativeComparison = compareCombatantInitiative(
    missileCombatant,
    chargeCombatant
  );

  if (initiativeComparison === 0) {
    return `Contact on segment ${movementResolution.contactSegment}; ${missileCombatant.name}'s first missile shot and the charge attack resolve simultaneously${laterShotText}.`;
  }

  if (initiativeComparison > 0) {
    return `Contact on segment ${movementResolution.contactSegment}; ${missileCombatant.name} gets one missile shot before contact${laterShotText}.`;
  }

  return `Contact on segment ${movementResolution.contactSegment}; the charge closes before ordinary missile fire, so pending missile shots are lost.`;
};

const getMovementSummary = (
  movementResolution: InitiativeMovementResolution,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
): string => {
  const combatantName =
    combatantNameById[movementResolution.combatantId] ||
    movementResolution.combatantId;
  const targetName = movementResolution.targetId
    ? combatantNameById[movementResolution.targetId] ||
      movementResolution.targetId
    : 'the declared target';
  const actionLabel = formatMovementActionLabel(movementResolution.action);

  if (movementResolution.reason === 'missing-target') {
    return `${combatantName} declared ${actionLabel}, but no single target was available to resolve.`;
  }

  if (movementResolution.reason === 'multiple-targets') {
    return `${combatantName} declared ${actionLabel} against multiple targets. The current scalar-distance model only resolves one moving target at a time.`;
  }

  if (movementResolution.reason === 'missing-distance') {
    return `${combatantName} declared ${actionLabel} toward ${targetName}, but no effective starting distance in inches was supplied.`;
  }

  if (movementResolution.reason === 'invalid-open-melee-target') {
    return `${combatantName} declared ${actionLabel} toward ${targetName}, but ${targetName} is already treating this as open melee against the same opponent. In this rules slice, open melee versus close is treated as an invalid declaration rather than reconciled automatically.`;
  }

  if (movementResolution.reason === 'set-not-triggered') {
    return `${combatantName} declared ${actionLabel} against ${targetName}, but ${targetName} did not charge into contact this round. The set weapon never triggers.`;
  }

  if (movementResolution.reason === 'target-moving-elsewhere') {
    return `${combatantName} declared ${actionLabel} toward ${targetName}, but ${targetName} is also moving on a different line. This is where the tool deliberately falls back to table adjudication.`;
  }

  if (movementResolution.reason === 'no-contact') {
    return `${combatantName} cannot reach ${targetName} this round. The tool estimates that ${combatantName} ends ${formatInches(
      movementResolution.remainingDistanceInches || 0
    )} short of striking range.`;
  }

  const directMissileChargeContext = getDirectMissileChargeContext(
    movementResolution,
    combatantById
  );

  if (directMissileChargeContext) {
    return getDirectMissileChargeSummary(
      directMissileChargeContext,
      movementResolution
    );
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

  if (movementResolution.action === 'set-vs-charge') {
    return `${combatantName} sets against ${targetName}'s charge. Because the target reaches contact on segment ${movementResolution.contactSegment}, the set weapon takes effect first and deals double normal damage if it hits.`;
  }

  if (movementResolution.sameRoundAttack) {
    return `${combatantName} reaches striking range of ${targetName} on segment ${movementResolution.contactSegment}. Because ${targetName} is charging into contact, this closer can also strike in the same round. The exact order is settled by the charge-end reach comparison.`;
  }

  return `${combatantName} reaches striking range of ${targetName} on segment ${movementResolution.contactSegment}. The current engine does not yet resolve the ensuing blows from a close action in the same round.`;
};

const buildMovementCards = (
  resolution: InitiativeRoundResolution,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
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
      title: `${combatantName} ${formatMovementActionLabel(
        movementResolution.action
      )}`,
      summary: getMovementSummary(
        movementResolution,
        combatantNameById,
        combatantById
      ),
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
              ? (() => {
                  const directMissileChargeContext =
                    getDirectMissileChargeContext(
                      movementResolution,
                      combatantById
                    );

                  if (directMissileChargeContext) {
                    return getDirectMissileChargeOutcome(
                      directMissileChargeContext,
                      movementResolution
                    );
                  }

                  return movementResolution.action === 'charge'
                    ? `Contact on segment ${
                        movementResolution.contactSegment
                      } at ${formatInches(
                        movementResolution.closingInchesPerSegment || 0
                      )} per segment; same-round charge attack applies.`
                    : movementResolution.action === 'set-vs-charge'
                    ? `Charge contact on segment ${
                        movementResolution.contactSegment
                      }; the set weapon strikes first and deals ${
                        movementResolution.damageMultiplier || 2
                      }x normal damage on a hit.`
                    : movementResolution.sameRoundAttack
                    ? `Striking range reached on segment ${
                        movementResolution.contactSegment
                      } at ${formatInches(
                        movementResolution.closingInchesPerSegment || 0
                      )} per segment; same-round return attack applies against the charger.`
                    : `Striking range reached on segment ${
                        movementResolution.contactSegment
                      } at ${formatInches(
                        movementResolution.closingInchesPerSegment || 0
                      )} per segment.`;
                })()
              : movementResolution.reason === 'no-contact'
              ? `No contact this round; approximately ${formatInches(
                  movementResolution.remainingDistanceInches || 0
                )} remain.`
              : movementResolution.reason === 'set-not-triggered'
              ? 'No charging contact occurred against the set weapon this round.'
              : movementResolution.reason === 'invalid-open-melee-target'
              ? 'Invalid direct pairing: open melee cannot oppose a close declaration in the same exchange.'
              : 'Needs table input or adjudication.',
          combatantIds: movementResolution.targetId
            ? [movementResolution.combatantId, movementResolution.targetId]
            : [movementResolution.combatantId],
        },
      ],
    };
  });

const getTurnUndeadSummary = (
  combatant: InitiativeScenarioCombatant,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
): string => {
  const targetNames = formatNames(combatant.targetIds, combatantNameById);

  if (combatant.targetIds.length !== 1) {
    return `${combatant.name} attempts to turn ${targetNames}. In this rules slice, turning is subject to initiative and is not spoiled by ordinary damage unless ${combatant.name} is killed or otherwise incapacitated before the attempt resolves.`;
  }

  const targetId = combatant.targetIds[0];
  if (!targetId) {
    return `${combatant.name} attempts to turn undead.`;
  }

  const target = combatantById.get(targetId);
  if (!target) {
    return `${combatant.name} attempts to turn ${targetNames}.`;
  }

  const initiativeComparison = compareCombatantInitiative(combatant, target);
  const targetActionLabel = formatDeclaredActionLabel(target.declaredAction);

  if (initiativeComparison > 0) {
    return `${combatant.name} attempts to turn ${target.name} before ${
      target.name
    }'s ${targetActionLabel.toLowerCase()} because ${
      combatant.side
    } side currently acts earlier in this exchange. Ordinary damage does not spoil turning in this slice unless ${
      combatant.name
    } is killed or otherwise incapacitated first.`;
  }

  if (initiativeComparison < 0) {
    return `${
      target.name
    }'s ${targetActionLabel.toLowerCase()} happens before ${
      combatant.name
    }'s turn attempt in this round. If ${
      combatant.name
    } survives and is not incapacitated, the turn attempt still resolves later because turning is not treated like spell casting for interruption here.`;
  }

  return `${combatant.name}'s turn attempt and ${
    target.name
  }'s ${targetActionLabel.toLowerCase()} are simultaneous in this tied round. Ordinary damage does not spoil turning in this slice unless ${
    combatant.name
  } is killed or otherwise incapacitated.`;
};

const buildTurnUndeadCards = (
  scenario: InitiativeScenario,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
): InitiativeResolutionCardViewModel[] =>
  scenario.party
    .concat(scenario.enemies)
    .filter(
      (combatant) =>
        combatant.declaredAction === 'turn-undead' &&
        combatant.targetIds.length > 0
    )
    .map((combatant) => ({
      id: `turn-undead-${combatant.id}`,
      kind: 'turn-undead' as const,
      title: `${combatant.name} turn undead`,
      summary: getTurnUndeadSummary(
        combatant,
        combatantNameById,
        combatantById
      ),
      combatantIds: [combatant.id, ...combatant.targetIds],
      steps: [
        {
          label: 'Targets',
          detail: formatNames(combatant.targetIds, combatantNameById),
          combatantIds: [combatant.id, ...combatant.targetIds],
        },
        {
          label: 'Timing',
          detail:
            'Turn undead is subject to initiative, but ordinary damage does not spoil it the way spell damage does in this rules slice.',
          combatantIds: [combatant.id, ...combatant.targetIds],
        },
      ],
    }));

const getMagicalDeviceSummary = (
  combatant: InitiativeScenarioCombatant,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
): string => {
  const targetNames = formatNames(combatant.targetIds, combatantNameById);
  const activationSegments =
    combatant.targetDeclarations.length === 1
      ? combatant.targetDeclarations[0]?.activationSegments
      : undefined;
  const activationText =
    activationSegments !== undefined
      ? ` The device discharge is treated as a segment-${activationSegments} activation in this rules slice.`
      : ' No specific activation time was given, so the discharge remains initiative-controlled but unsegmented.';

  if (combatant.targetIds.length !== 1) {
    return `${combatant.name} uses a magical device against ${targetNames}. Device discharge is subject to initiative but is not treated like spell casting for interruption here.${activationText}`;
  }

  const targetId = combatant.targetIds[0];
  if (!targetId) {
    return `${combatant.name} uses a magical device.${activationText}`;
  }

  const target = combatantById.get(targetId);
  if (!target) {
    return `${combatant.name} uses a magical device against ${targetNames}.${activationText}`;
  }

  const initiativeComparison = compareCombatantInitiative(combatant, target);
  const targetActionLabel = formatDeclaredActionLabel(target.declaredAction);

  if (initiativeComparison > 0) {
    return `${combatant.name}'s magical device resolves before ${target.name}'s ${targetActionLabel} because ${combatant.side} side currently acts earlier in this exchange. Ordinary damage does not spoil the device discharge the way it would spoil spell casting.${activationText}`;
  }

  if (initiativeComparison < 0) {
    return `${target.name}'s ${targetActionLabel} happens before ${combatant.name}'s magical device discharge in this round. If ${combatant.name} survives and is not incapacitated, the device attack still resolves later because device use is not treated like spell casting for interruption here.${activationText}`;
  }

  return `${combatant.name}'s magical device discharge and ${target.name}'s ${targetActionLabel} are simultaneous in this tied round. Ordinary damage does not spoil the device use in this slice unless ${combatant.name} is killed or otherwise incapacitated.${activationText}`;
};

const buildMagicalDeviceCards = (
  scenario: InitiativeScenario,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
): InitiativeResolutionCardViewModel[] =>
  scenario.party
    .concat(scenario.enemies)
    .filter(
      (combatant) =>
        combatant.declaredAction === 'magical-device' &&
        combatant.targetIds.length > 0
    )
    .map((combatant) => {
      const activationSegments =
        combatant.targetDeclarations.length === 1
          ? combatant.targetDeclarations[0]?.activationSegments
          : undefined;

      return {
        id: `magical-device-${combatant.id}`,
        kind: 'magical-device' as const,
        title: `${combatant.name} magical device`,
        summary: getMagicalDeviceSummary(
          combatant,
          combatantNameById,
          combatantById
        ),
        combatantIds: [combatant.id, ...combatant.targetIds],
        steps: [
          {
            label: 'Targets',
            detail: formatNames(combatant.targetIds, combatantNameById),
            combatantIds: [combatant.id, ...combatant.targetIds],
          },
          {
            label: 'Timing',
            detail:
              activationSegments !== undefined
                ? `Magical device discharge is subject to initiative and uses an explicit activation time of ${activationSegments} ${
                    activationSegments === 1 ? 'segment' : 'segments'
                  } in this rules slice.`
                : 'Magical device discharge is subject to initiative. With no specific activation time supplied, it remains unsegmented in this rules slice.',
            combatantIds: [combatant.id, ...combatant.targetIds],
          },
        ],
      };
    });

const formatCastingTimeLabel = (
  castingSegments: number | undefined
): string => {
  if (castingSegments === undefined) {
    return '1 segment';
  }

  if (castingSegments === 0) {
    return 'Instant';
  }

  if (castingSegments >= 10) {
    return '10+ segments';
  }

  return `${castingSegments} ${castingSegments === 1 ? 'segment' : 'segments'}`;
};

const getSpellCastingSummary = (
  combatant: InitiativeScenarioCombatant,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
): string => {
  const targetNames = formatNames(combatant.targetIds, combatantNameById);
  const castingSegments =
    combatant.targetDeclarations.length === 1
      ? combatant.targetDeclarations[0]?.castingSegments
      : undefined;
  const castingTimeLabel = formatCastingTimeLabel(castingSegments);
  const completionText =
    castingSegments === 0
      ? 'The spell completes immediately in this rules slice.'
      : `The spell completes on segment ${
          castingSegments ?? 1
        } in this rules slice.`;

  if (combatant.targetIds.length !== 1) {
    return `${combatant.name} casts a spell against ${targetNames}. ${completionText} Directed attacks that resolve before completion spoil the spell.`;
  }

  const targetId = combatant.targetIds[0];
  if (!targetId) {
    return `${combatant.name} casts a spell. ${completionText}`;
  }

  const target = combatantById.get(targetId);
  if (!target) {
    return `${combatant.name} casts a spell against ${targetNames}. ${completionText}`;
  }

  const initiativeComparison = compareCombatantInitiative(combatant, target);
  const targetActionLabel = formatDeclaredActionLabel(target.declaredAction);

  if (initiativeComparison > 0) {
    return `${combatant.name} starts casting before ${
      target.name
    }'s ${targetActionLabel} in the baseline initiative order, but the spell still takes ${castingTimeLabel.toLowerCase()} to complete. Directed attacks that land before completion spoil it.`;
  }

  if (initiativeComparison < 0) {
    return `${target.name}'s ${targetActionLabel} happens before ${combatant.name}'s spell in this round. In this rules slice, successful directed attacks before completion spoil the spell instead of delaying it.`;
  }

  return `${combatant.name} and ${
    target.name
  } are tied on initiative, but the spell still takes ${castingTimeLabel.toLowerCase()} to complete. Directed attacks that resolve before completion spoil it; simultaneous outcomes are left simultaneous.`;
};

const buildSpellCastingCards = (
  scenario: InitiativeScenario,
  combatantNameById: Record<string, string>,
  combatantById: Map<string, InitiativeScenarioCombatant>
): InitiativeResolutionCardViewModel[] =>
  scenario.party
    .concat(scenario.enemies)
    .filter(
      (combatant) =>
        combatant.declaredAction === 'spell-casting' &&
        combatant.targetIds.length > 0
    )
    .map((combatant) => {
      const castingSegments =
        combatant.targetDeclarations.length === 1
          ? combatant.targetDeclarations[0]?.castingSegments
          : undefined;

      return {
        id: `spell-casting-${combatant.id}`,
        kind: 'spell-casting' as const,
        title: `${combatant.name} spell`,
        summary: getSpellCastingSummary(
          combatant,
          combatantNameById,
          combatantById
        ),
        combatantIds: [combatant.id, ...combatant.targetIds],
        steps: [
          {
            label: 'Targets',
            detail: formatNames(combatant.targetIds, combatantNameById),
            combatantIds: [combatant.id, ...combatant.targetIds],
          },
          {
            label: 'Casting time',
            detail:
              castingSegments === 0
                ? 'Instant completion.'
                : `Casting time ${formatCastingTimeLabel(
                    castingSegments
                  ).toLowerCase()}; completion is placed on that segment in this rules slice.`,
            combatantIds: [combatant.id, ...combatant.targetIds],
          },
          {
            label: 'Interruption',
            detail:
              'Successful directed attacks before completion spoil the spell. Ordinary damage is treated unlike turn undead or magical-device use here.',
            combatantIds: [combatant.id, ...combatant.targetIds],
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
    ...buildMovementCards(resolution, combatantNameById, combatantById),
    ...buildDirectMeleeCards(resolution, combatantNameById, combatantById),
    ...buildTurnUndeadCards(scenario, combatantNameById, combatantById),
    ...buildMagicalDeviceCards(scenario, combatantNameById, combatantById),
    ...buildSpellCastingCards(scenario, combatantNameById, combatantById),
    buildUnresolvedCard(scenario, resolution, combatantNameById),
  ].filter((card): card is InitiativeResolutionCardViewModel => Boolean(card));

  return {
    cards,
    combatantNameById,
  };
};

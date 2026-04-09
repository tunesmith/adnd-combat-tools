import { resolveOpenMeleeExchange, type OpenMeleeCombatant } from './openMelee';
import {
  resolveMovementAgainstTarget,
  resolveSetAgainstChargeResponse,
} from './movement';
import { getWeaponInfo } from '../../tables/weapon';
import type {
  DirectMeleeEngagement,
  DirectMeleePair,
  InitiativeAttackRoutine,
  InitiativeScenarioDraftTargetDeclaration,
  InitiativeScenario,
  InitiativeScenarioCombatant,
  InitiativeScenarioDraft,
  InitiativeScenarioDraftCombatant,
  InitiativeScenarioOrder,
  InitiativeScenarioSide,
  InitiativeWeaponType,
} from '../../types/initiative';

const getCombatantId = (
  side: InitiativeScenarioSide,
  combatantKey: number
): string => `${side}-${combatantKey}`;

const getCombatantName = (
  name: string | undefined,
  side: InitiativeScenarioSide,
  index: number
): string => name || `${side === 'party' ? 'Party' : 'Enemy'} ${index + 1}`;

const DEFAULT_MOVEMENT_RATE = 12;

const getOrdinaryRoundAttackCount = (
  declaredAction: InitiativeScenarioCombatant['declaredAction'],
  weaponType: InitiativeWeaponType,
  fireRate: number | undefined,
  attackRoutineCount: number | undefined
): number => {
  if (weaponType === 'missile') {
    if (fireRate === undefined) {
      return 1;
    }

    // Whole-number firing rates expand to that many shots in the round.
    // Fractional rates (for example 1/2) need round-over-round state, so keep
    // them as a single attack for now.
    if (fireRate < 1) {
      return 1;
    }

    return Math.max(1, Math.floor(fireRate));
  }

  if (declaredAction === 'open-melee') {
    return Math.max(1, attackRoutineCount || 1);
  }

  return 1;
};

const getMissileTargetLimit = (fireRate: number | undefined): number =>
  getOrdinaryRoundAttackCount('missile', 'missile', fireRate, undefined);

const buildAttackRoutine = (
  combatantId: string,
  declaredAction: InitiativeScenarioCombatant['declaredAction'],
  weaponType: InitiativeWeaponType,
  fireRate: number | undefined,
  attackRoutineCount: number | undefined
): InitiativeAttackRoutine => {
  if (declaredAction === 'turn-undead') {
    return {
      id: `routine:${combatantId}:1`,
      label: 'Turn undead',
      combatantId,
      components: [
        {
          id: 'turn-attempt',
          order: 1,
          label: 'attempt',
        },
      ],
      timingBasisComponentId: 'turn-attempt',
    };
  }

  if (declaredAction === 'magical-device') {
    return {
      id: `routine:${combatantId}:1`,
      label: 'Magical device',
      combatantId,
      components: [
        {
          id: 'device-discharge',
          order: 1,
          label: 'discharge',
        },
      ],
      timingBasisComponentId: 'device-discharge',
    };
  }

  if (declaredAction === 'spell-casting') {
    return {
      id: `routine:${combatantId}:1`,
      label: 'Spell',
      combatantId,
      components: [
        {
          id: 'spell',
          order: 1,
          label: 'spell',
        },
      ],
      timingBasisComponentId: 'spell',
    };
  }

  const attackCount = getOrdinaryRoundAttackCount(
    declaredAction,
    weaponType,
    fireRate,
    attackRoutineCount
  );
  const components = Array.from({ length: attackCount }, (_, index) => ({
    id: `attack-${index + 1}`,
    order: index + 1,
    label: `attack ${index + 1}`,
  }));

  return {
    id: `routine:${combatantId}:1`,
    label: 'Attack routine',
    combatantId,
    components,
    timingBasisComponentId: 'attack-1',
  };
};

const getSimpleOrder = (
  partyInitiative: number,
  enemyInitiative: number
): InitiativeScenarioOrder => {
  if (partyInitiative > enemyInitiative) {
    return 'party-first';
  }

  if (enemyInitiative > partyInitiative) {
    return 'enemy-first';
  }

  return 'simultaneous';
};

const isNonMissileCombatant = (
  combatant: InitiativeScenarioCombatant
): boolean => combatant.weaponType !== 'missile';

const isOpenMeleeCombatant = (
  combatant: InitiativeScenarioCombatant
): boolean => combatant.declaredAction === 'open-melee';

const getInitiativeWeaponType = (
  weaponType: InitiativeWeaponType | undefined
): InitiativeWeaponType => weaponType || 'natural';

const getTargetDeclarations = (
  combatant: InitiativeScenarioDraftCombatant
): InitiativeScenarioDraftTargetDeclaration[] =>
  combatant.targetDeclarations ||
  (combatant.targetCombatantKeys || []).map((targetCombatantKey) => ({
    targetCombatantKey,
    distanceInches: combatant.actionDistanceInches,
    activationSegments: combatant.activationSegments,
    castingSegments: combatant.castingSegments,
  }));

const getSharedDeclarationValue = <
  TKey extends 'distanceInches' | 'activationSegments' | 'castingSegments'
>(
  targetDeclarations: InitiativeScenarioDraftTargetDeclaration[],
  key: TKey
): number | undefined => {
  const definedValues = targetDeclarations
    .map((targetDeclaration) => targetDeclaration[key])
    .filter((value): value is number => value !== undefined);

  if (definedValues.length === 0) {
    return undefined;
  }

  const firstValue = definedValues[0];
  return definedValues.every((value) => value === firstValue)
    ? firstValue
    : undefined;
};

const toOpenMeleeCombatant = (
  combatant: InitiativeScenarioCombatant
): OpenMeleeCombatant => ({
  id: combatant.id,
  initiative: combatant.initiative,
  weaponKind: combatant.weaponType === 'melee' ? 'weapon' : 'natural',
  weaponSpeedFactor:
    combatant.weaponType === 'melee' ? combatant.weaponSpeedFactor : undefined,
  attackRoutine: combatant.attackRoutine,
});

const buildScenarioCombatants = (
  side: InitiativeScenarioSide,
  initiative: number,
  combatants: InitiativeScenarioDraftCombatant[],
  opposingSide: InitiativeScenarioSide,
  opposingCombatantKeys: Set<number>
): InitiativeScenarioCombatant[] =>
  combatants.map((combatant, index) => {
    const weaponInfo = getWeaponInfo(combatant.weaponId);
    const combatantId = getCombatantId(side, combatant.combatantKey);
    const weaponType = getInitiativeWeaponType(weaponInfo?.weaponType);
    const draftTargetDeclarations = getTargetDeclarations(combatant);
    const targetDeclarations = draftTargetDeclarations
      .filter((targetDeclaration) =>
        opposingCombatantKeys.has(targetDeclaration.targetCombatantKey)
      )
      .slice(
        0,
        weaponType === 'missile'
          ? getMissileTargetLimit(
              weaponInfo?.weaponType === 'missile'
                ? weaponInfo.fireRate
                : undefined
            )
          : undefined
      )
      .map((targetDeclaration) => ({
        targetId: getCombatantId(
          opposingSide,
          targetDeclaration.targetCombatantKey
        ),
        distanceInches: targetDeclaration.distanceInches,
        activationSegments: targetDeclaration.activationSegments,
        castingSegments: targetDeclaration.castingSegments,
      }));
    const sharedDistanceInches =
      combatant.actionDistanceInches ??
      getSharedDeclarationValue(draftTargetDeclarations, 'distanceInches');
    const sharedActivationSegments =
      combatant.activationSegments ??
      getSharedDeclarationValue(draftTargetDeclarations, 'activationSegments');
    const sharedCastingSegments =
      combatant.castingSegments ??
      getSharedDeclarationValue(draftTargetDeclarations, 'castingSegments');

    return {
      id: combatantId,
      side,
      index,
      combatantKey: combatant.combatantKey,
      name: getCombatantName(combatant.name, side, index),
      initiative,
      missileInitiativeAdjustment: combatant.missileInitiativeAdjustment ?? 0,
      declaredAction: combatant.declaredAction ?? 'open-melee',
      movementRate: combatant.movementRate ?? DEFAULT_MOVEMENT_RATE,
      actionDistanceInches: sharedDistanceInches,
      activationSegments: sharedActivationSegments,
      castingSegments: sharedCastingSegments,
      weaponId: combatant.weaponId,
      weaponName: weaponInfo?.name || `Weapon ${combatant.weaponId}`,
      weaponType,
      weaponLength:
        weaponInfo?.weaponType === 'melee' ? weaponInfo.length : undefined,
      weaponSpeedFactor:
        weaponInfo?.weaponType === 'melee' ? weaponInfo.speedFactor : undefined,
      intention: combatant.intention || '',
      result: combatant.result || '',
      targetDeclarations,
      targetIds: targetDeclarations.map(
        (targetDeclaration) => targetDeclaration.targetId
      ),
      attackRoutine: buildAttackRoutine(
        combatantId,
        combatant.declaredAction ?? 'open-melee',
        weaponType,
        weaponInfo?.weaponType === 'missile' ? weaponInfo.fireRate : undefined,
        combatant.attackRoutineCount
      ),
    };
  });

export const buildInitiativeScenario = (
  draft: InitiativeScenarioDraft
): InitiativeScenario => {
  const enemyCombatantKeys = new Set(
    draft.enemies.map((combatant) => combatant.combatantKey)
  );
  const partyCombatantKeys = new Set(
    draft.party.map((combatant) => combatant.combatantKey)
  );
  const party = buildScenarioCombatants(
    'party',
    draft.partyInitiative,
    draft.party,
    'enemy',
    enemyCombatantKeys
  );
  const enemies = buildScenarioCombatants(
    'enemy',
    draft.enemyInitiative,
    draft.enemies,
    'party',
    partyCombatantKeys
  );

  const partyById = new Map(
    party.map((combatant) => [combatant.id, combatant] as const)
  );
  const enemyById = new Map(
    enemies.map((combatant) => [combatant.id, combatant] as const)
  );
  const combatantById = new Map(
    party.concat(enemies).map((combatant) => [combatant.id, combatant] as const)
  );
  const mutualCandidates: DirectMeleePair[] = party.flatMap((partyCombatant) =>
    partyCombatant.targetIds.flatMap((enemyId) => {
      const enemyCombatant = enemyById.get(enemyId);

      if (!enemyCombatant) {
        return [];
      }

      if (
        !isOpenMeleeCombatant(partyCombatant) ||
        !isOpenMeleeCombatant(enemyCombatant) ||
        !isNonMissileCombatant(partyCombatant) ||
        !isNonMissileCombatant(enemyCombatant)
      ) {
        return [];
      }

      return enemyCombatant.targetIds.includes(partyCombatant.id)
        ? [
            {
              partyCombatantId: partyCombatant.id,
              enemyCombatantId: enemyCombatant.id,
              inference: 'mutual-targeting-non-missile-weapons' as const,
            },
          ]
        : [];
    })
  );

  const candidateCountByCombatantId = mutualCandidates.reduce<
    Map<string, number>
  >((counts, pair) => {
    counts.set(
      pair.partyCombatantId,
      (counts.get(pair.partyCombatantId) || 0) + 1
    );
    counts.set(
      pair.enemyCombatantId,
      (counts.get(pair.enemyCombatantId) || 0) + 1
    );
    return counts;
  }, new Map());

  const directMeleePairs = mutualCandidates.filter(
    (pair) =>
      candidateCountByCombatantId.get(pair.partyCombatantId) === 1 &&
      candidateCountByCombatantId.get(pair.enemyCombatantId) === 1
  );

  const directMeleeEngagements: DirectMeleeEngagement[] = directMeleePairs.map(
    (pair) => {
      const partyCombatant = partyById.get(pair.partyCombatantId);
      const enemyCombatant = enemyById.get(pair.enemyCombatantId);

      if (!partyCombatant || !enemyCombatant) {
        throw new Error(
          `Missing combatant while resolving direct melee pair ${pair.partyCombatantId}/${pair.enemyCombatantId}`
        );
      }

      return {
        ...pair,
        resolution: resolveOpenMeleeExchange(
          toOpenMeleeCombatant(partyCombatant),
          toOpenMeleeCombatant(enemyCombatant)
        ),
      };
    }
  );

  const directPairCombatantIds = new Set(
    directMeleePairs.flatMap((pair) => [
      pair.partyCombatantId,
      pair.enemyCombatantId,
    ])
  );
  const unresolvedMeleeCandidateIds = Array.from(
    new Set(
      mutualCandidates
        .flatMap((pair) => [pair.partyCombatantId, pair.enemyCombatantId])
        .filter((combatantId) => !directPairCombatantIds.has(combatantId))
    )
  );
  const initialMovementResolutions = party
    .concat(enemies)
    .flatMap((combatant) => {
      const resolution = resolveMovementAgainstTarget(combatant, combatantById);
      return resolution ? [resolution] : [];
    });
  const initialMovementResolutionByCombatantId = new Map(
    initialMovementResolutions.map((movementResolution) => [
      movementResolution.combatantId,
      movementResolution,
    ])
  );
  const setAgainstChargeResolutions = party
    .concat(enemies)
    .flatMap((combatant) => {
      const resolution = resolveSetAgainstChargeResponse(
        combatant,
        combatantById,
        initialMovementResolutionByCombatantId
      );
      return resolution ? [resolution] : [];
    });
  const movementResolutions = initialMovementResolutions.concat(
    setAgainstChargeResolutions
  );

  return {
    label: draft.label,
    partyInitiative: draft.partyInitiative,
    enemyInitiative: draft.enemyInitiative,
    simpleOrder: getSimpleOrder(draft.partyInitiative, draft.enemyInitiative),
    party,
    enemies,
    movementResolutions,
    directMeleePairs,
    directMeleeEngagements,
    unresolvedMeleeCandidateIds,
  };
};

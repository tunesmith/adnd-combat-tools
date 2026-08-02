import type {
  InitiativeAttackEntry,
  InitiativeAttackRoutine,
  InitiativeTimingOverride,
} from '../../types/initiative';
import { getInitiativeTimingOverrideRank } from './initiativeTiming';

type OpenMeleeWeaponKind = 'weapon' | 'natural';

export interface OpenMeleeCombatant {
  id: string;
  initiative: number;
  initiativeTiming?: InitiativeTimingOverride;
  weaponKind: OpenMeleeWeaponKind;
  weaponSpeedFactor?: number;
  attackRoutine: InitiativeAttackRoutine;
  attackRoutineCount: number;
}

interface OpenMeleeStep {
  attacks: InitiativeAttackEntry[];
}

type OpenMeleeReason =
  | 'initiative'
  | 'multiple-routines'
  | 'simultaneous'
  | 'weapon-speed'
  | 'weapon-speed-double'
  | 'weapon-speed-triple';

export interface OpenMeleeResolution {
  reason: OpenMeleeReason;
  steps: OpenMeleeStep[];
}

const getAttackComponentCount = (combatant: OpenMeleeCombatant): number =>
  Math.max(1, combatant.attackRoutine.components.length);

const getAttackRoutineCount = (combatant: OpenMeleeCombatant): number =>
  Math.max(1, combatant.attackRoutineCount);

const getAttackNumber = (
  combatant: OpenMeleeCombatant,
  routineNumber: number,
  componentNumber: number
): number =>
  (routineNumber - 1) * getAttackComponentCount(combatant) + componentNumber;

const createRoutineAttack = (
  combatant: OpenMeleeCombatant,
  routineNumber: number,
  componentNumber: number
): InitiativeAttackEntry => {
  const routineComponent =
    combatant.attackRoutine.components.find(
      (component) => component.order === componentNumber
    ) ||
    combatant.attackRoutine.components.find(
      (component) =>
        component.id === combatant.attackRoutine.timingBasisComponentId
    ) ||
    combatant.attackRoutine.components[0];

  if (!routineComponent) {
    throw new Error(
      `Combatant ${combatant.id} has no attack routine component`
    );
  }

  return {
    combatantId: combatant.id,
    routineId: combatant.attackRoutine.id,
    componentId: routineComponent.id,
    attackNumber: getAttackNumber(combatant, routineNumber, componentNumber),
    routineNumber,
    componentNumber,
    label:
      getAttackRoutineCount(combatant) > 1 &&
      getAttackComponentCount(combatant) === 1
        ? `attack ${routineNumber}`
        : routineComponent.label,
    source: 'routine-component',
  };
};

const createTimingBonusAttack = (
  combatant: OpenMeleeCombatant,
  attackNumber: number
): InitiativeAttackEntry => ({
  combatantId: combatant.id,
  routineId: combatant.attackRoutine.id,
  componentId: `generated-attack-${attackNumber}`,
  attackNumber,
  label: `attack ${attackNumber}`,
  source: 'timing-bonus',
});

const createRoutineStep = (
  combatant: OpenMeleeCombatant,
  routineNumber: number
): OpenMeleeStep => ({
  attacks: Array.from(
    { length: getAttackComponentCount(combatant) },
    (_, index) => createRoutineAttack(combatant, routineNumber, index + 1)
  ),
});

const createTimingBonusStep = (
  combatant: OpenMeleeCombatant,
  attackNumber: number
): OpenMeleeStep => ({
  attacks: [createTimingBonusAttack(combatant, attackNumber)],
});

const combineSteps = (...steps: OpenMeleeStep[]): OpenMeleeStep => ({
  attacks: steps.flatMap((step) => step.attacks),
});

const getWeaponSpeedFactor = (combatant: OpenMeleeCombatant): number => {
  if (combatant.weaponKind !== 'weapon') {
    throw new Error(
      `Combatant ${combatant.id} does not use a weapon speed factor`
    );
  }

  const { weaponSpeedFactor } = combatant;
  if (!weaponSpeedFactor || weaponSpeedFactor < 1) {
    throw new Error(
      `Combatant ${combatant.id} is missing a valid weapon speed factor`
    );
  }

  return weaponSpeedFactor;
};

const createRoutineSteps = (combatant: OpenMeleeCombatant): OpenMeleeStep[] =>
  Array.from({ length: getAttackRoutineCount(combatant) }, (_, index) =>
    createRoutineStep(combatant, index + 1)
  );

const getRoutinePhase = (attackNumber: number, attackCount: number): number => {
  if (attackCount <= 1) {
    return 0.5;
  }

  return (attackNumber - 1) / (attackCount - 1);
};

const compareInitiativeTimingAndDie = (
  left: OpenMeleeCombatant,
  right: OpenMeleeCombatant
): -1 | 0 | 1 => {
  const timingRankDifference =
    getInitiativeTimingOverrideRank(left.initiativeTiming) -
    getInitiativeTimingOverrideRank(right.initiativeTiming);

  if (timingRankDifference > 0) {
    return -1;
  }

  if (timingRankDifference < 0) {
    return 1;
  }

  if (left.initiative > right.initiative) {
    return -1;
  }

  if (right.initiative > left.initiative) {
    return 1;
  }

  return 0;
};

const compareSharedPhaseAttacks = (
  left: OpenMeleeCombatant,
  right: OpenMeleeCombatant
): -1 | 0 | 1 => {
  const initiativeOrder = compareInitiativeTimingAndDie(left, right);

  if (initiativeOrder !== 0) {
    return initiativeOrder;
  }

  if (left.weaponKind !== 'weapon' || right.weaponKind !== 'weapon') {
    return 0;
  }

  const leftSpeedFactor = getWeaponSpeedFactor(left);
  const rightSpeedFactor = getWeaponSpeedFactor(right);

  if (leftSpeedFactor < rightSpeedFactor) {
    return -1;
  }

  if (rightSpeedFactor < leftSpeedFactor) {
    return 1;
  }

  return 0;
};

const resolveMultipleRoutineExchange = (
  left: OpenMeleeCombatant,
  right: OpenMeleeCombatant
): OpenMeleeResolution => {
  const timingRankDifference =
    getInitiativeTimingOverrideRank(left.initiativeTiming) -
    getInitiativeTimingOverrideRank(right.initiativeTiming);

  if (timingRankDifference !== 0) {
    return {
      reason: 'multiple-routines',
      steps:
        timingRankDifference > 0
          ? createRoutineSteps(left).concat(createRoutineSteps(right))
          : createRoutineSteps(right).concat(createRoutineSteps(left)),
    };
  }

  const leftCount = getAttackRoutineCount(left);
  const rightCount = getAttackRoutineCount(right);
  const phaseValues = Array.from(
    new Set(
      Array.from({ length: leftCount }, (_, index) =>
        getRoutinePhase(index + 1, leftCount)
      ).concat(
        Array.from({ length: rightCount }, (_, index) =>
          getRoutinePhase(index + 1, rightCount)
        )
      )
    )
  ).sort((leftPhase, rightPhase) => leftPhase - rightPhase);

  const steps: OpenMeleeStep[] = phaseValues.flatMap((phaseValue) => {
    const leftAttackNumber = Array.from(
      { length: leftCount },
      (_, index) => index + 1
    ).find(
      (attackNumber) => getRoutinePhase(attackNumber, leftCount) === phaseValue
    );
    const rightAttackNumber = Array.from(
      { length: rightCount },
      (_, index) => index + 1
    ).find(
      (attackNumber) => getRoutinePhase(attackNumber, rightCount) === phaseValue
    );

    if (leftAttackNumber && rightAttackNumber) {
      const leftStep = createRoutineStep(left, leftAttackNumber);
      const rightStep = createRoutineStep(right, rightAttackNumber);
      const order = compareSharedPhaseAttacks(left, right);

      if (order < 0) {
        return [leftStep, rightStep];
      }

      if (order > 0) {
        return [rightStep, leftStep];
      }

      return [combineSteps(leftStep, rightStep)];
    }

    if (leftAttackNumber) {
      return [createRoutineStep(left, leftAttackNumber)];
    }

    if (rightAttackNumber) {
      return [createRoutineStep(right, rightAttackNumber)];
    }

    return [];
  });

  return {
    reason: 'multiple-routines',
    steps,
  };
};

/**
 * DMG p66 caps the "double the lower factor" threshold with
 * "or 5 or more factors in any case".
 */
export const getMultipleAttackThreshold = (fasterWeaponSpeedFactor: number) =>
  Math.min(fasterWeaponSpeedFactor * 2, 5);

/**
 * Resolve the first exchange of an already-open melee.
 *
 * This deliberately keeps "simple initiative" as the default rule and only
 * applies weapon speed factors in the narrow DMG case:
 * tied initiative, open melee, both combatants using weapons.
 */
export const resolveOpenMeleeExchange = (
  left: OpenMeleeCombatant,
  right: OpenMeleeCombatant
): OpenMeleeResolution => {
  if (getAttackRoutineCount(left) > 1 || getAttackRoutineCount(right) > 1) {
    return resolveMultipleRoutineExchange(left, right);
  }

  const initiativeOrder = compareInitiativeTimingAndDie(left, right);

  if (initiativeOrder < 0) {
    return {
      reason: 'initiative',
      steps: [createRoutineStep(left, 1), createRoutineStep(right, 1)],
    };
  }

  if (initiativeOrder > 0) {
    return {
      reason: 'initiative',
      steps: [createRoutineStep(right, 1), createRoutineStep(left, 1)],
    };
  }

  if (left.weaponKind !== 'weapon' || right.weaponKind !== 'weapon') {
    return {
      reason: 'simultaneous',
      steps: [
        combineSteps(createRoutineStep(left, 1), createRoutineStep(right, 1)),
      ],
    };
  }

  const leftSpeedFactor = getWeaponSpeedFactor(left);
  const rightSpeedFactor = getWeaponSpeedFactor(right);

  if (leftSpeedFactor === rightSpeedFactor) {
    return {
      reason: 'simultaneous',
      steps: [
        combineSteps(createRoutineStep(left, 1), createRoutineStep(right, 1)),
      ],
    };
  }

  const faster =
    leftSpeedFactor < rightSpeedFactor
      ? { combatant: left, speedFactor: leftSpeedFactor }
      : { combatant: right, speedFactor: rightSpeedFactor };
  const slower =
    leftSpeedFactor < rightSpeedFactor
      ? { combatant: right, speedFactor: rightSpeedFactor }
      : { combatant: left, speedFactor: leftSpeedFactor };

  const difference = slower.speedFactor - faster.speedFactor;

  if (difference >= 10) {
    const fasterRoutineStep = createRoutineStep(faster.combatant, 1);
    const firstTimingBonusAttackNumber =
      getAttackComponentCount(faster.combatant) + 1;
    return {
      reason: 'weapon-speed-triple',
      steps: [
        fasterRoutineStep,
        createTimingBonusStep(faster.combatant, firstTimingBonusAttackNumber),
        combineSteps(
          createTimingBonusStep(
            faster.combatant,
            firstTimingBonusAttackNumber + 1
          ),
          createRoutineStep(slower.combatant, 1)
        ),
      ],
    };
  }

  if (difference >= getMultipleAttackThreshold(faster.speedFactor)) {
    const fasterRoutineStep = createRoutineStep(faster.combatant, 1);
    return {
      reason: 'weapon-speed-double',
      steps: [
        fasterRoutineStep,
        createTimingBonusStep(
          faster.combatant,
          getAttackComponentCount(faster.combatant) + 1
        ),
        createRoutineStep(slower.combatant, 1),
      ],
    };
  }

  return {
    reason: 'weapon-speed',
    steps: [
      createRoutineStep(faster.combatant, 1),
      createRoutineStep(slower.combatant, 1),
    ],
  };
};

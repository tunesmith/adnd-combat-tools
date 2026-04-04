import type {
  InitiativeAttackEntry,
  InitiativeAttackRoutine,
} from '../../types/initiative';

type OpenMeleeWeaponKind = 'weapon' | 'natural';

export interface OpenMeleeCombatant {
  id: string;
  initiative: number;
  weaponKind: OpenMeleeWeaponKind;
  weaponSpeedFactor?: number;
  attackRoutine: InitiativeAttackRoutine;
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

const createAttack = (
  combatant: OpenMeleeCombatant,
  attackNumber: number
): InitiativeAttackEntry => {
  const routineComponent =
    combatant.attackRoutine.components.find(
      (component) => component.order === attackNumber
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

  if (attackNumber <= combatant.attackRoutine.components.length) {
    return {
      combatantId: combatant.id,
      routineId: combatant.attackRoutine.id,
      componentId: routineComponent.id,
      attackNumber,
      label: routineComponent.label,
      source: 'routine-component',
    };
  }

  return {
    combatantId: combatant.id,
    routineId: combatant.attackRoutine.id,
    componentId: `generated-attack-${attackNumber}`,
    attackNumber,
    label: `attack ${attackNumber}`,
    source: 'timing-bonus',
  };
};

const createSingleAttackStep = (
  combatant: OpenMeleeCombatant,
  attackNumber: number
): OpenMeleeStep => ({
  attacks: [createAttack(combatant, attackNumber)],
});

const createSimultaneousStep = (
  left: InitiativeAttackEntry,
  right: InitiativeAttackEntry
): OpenMeleeStep => ({
  attacks: [left, right],
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

const getRoutineComponentCount = (combatant: OpenMeleeCombatant): number =>
  Math.max(1, combatant.attackRoutine.components.length);

const getRoutinePhase = (attackNumber: number, attackCount: number): number => {
  if (attackCount <= 1) {
    return 0.5;
  }

  return (attackNumber - 1) / (attackCount - 1);
};

const compareSharedPhaseAttacks = (
  left: OpenMeleeCombatant,
  right: OpenMeleeCombatant
): -1 | 0 | 1 => {
  if (left.initiative > right.initiative) {
    return -1;
  }

  if (right.initiative > left.initiative) {
    return 1;
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
  const leftCount = getRoutineComponentCount(left);
  const rightCount = getRoutineComponentCount(right);
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
      const leftAttack = createAttack(left, leftAttackNumber);
      const rightAttack = createAttack(right, rightAttackNumber);
      const order = compareSharedPhaseAttacks(left, right);

      if (order < 0) {
        return [{ attacks: [leftAttack] }, { attacks: [rightAttack] }];
      }

      if (order > 0) {
        return [{ attacks: [rightAttack] }, { attacks: [leftAttack] }];
      }

      return [createSimultaneousStep(leftAttack, rightAttack)];
    }

    if (leftAttackNumber) {
      return [createSingleAttackStep(left, leftAttackNumber)];
    }

    if (rightAttackNumber) {
      return [createSingleAttackStep(right, rightAttackNumber)];
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
  if (
    getRoutineComponentCount(left) > 1 ||
    getRoutineComponentCount(right) > 1
  ) {
    return resolveMultipleRoutineExchange(left, right);
  }

  if (left.initiative > right.initiative) {
    return {
      reason: 'initiative',
      steps: [
        createSingleAttackStep(left, 1),
        createSingleAttackStep(right, 1),
      ],
    };
  }

  if (right.initiative > left.initiative) {
    return {
      reason: 'initiative',
      steps: [
        createSingleAttackStep(right, 1),
        createSingleAttackStep(left, 1),
      ],
    };
  }

  if (left.weaponKind !== 'weapon' || right.weaponKind !== 'weapon') {
    return {
      reason: 'simultaneous',
      steps: [
        createSimultaneousStep(createAttack(left, 1), createAttack(right, 1)),
      ],
    };
  }

  const leftSpeedFactor = getWeaponSpeedFactor(left);
  const rightSpeedFactor = getWeaponSpeedFactor(right);

  if (leftSpeedFactor === rightSpeedFactor) {
    return {
      reason: 'simultaneous',
      steps: [
        createSimultaneousStep(createAttack(left, 1), createAttack(right, 1)),
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
    return {
      reason: 'weapon-speed-triple',
      steps: [
        createSingleAttackStep(faster.combatant, 1),
        createSingleAttackStep(faster.combatant, 2),
        createSimultaneousStep(
          createAttack(faster.combatant, 3),
          createAttack(slower.combatant, 1)
        ),
      ],
    };
  }

  if (difference >= getMultipleAttackThreshold(faster.speedFactor)) {
    return {
      reason: 'weapon-speed-double',
      steps: [
        createSingleAttackStep(faster.combatant, 1),
        createSingleAttackStep(faster.combatant, 2),
        createSingleAttackStep(slower.combatant, 1),
      ],
    };
  }

  return {
    reason: 'weapon-speed',
    steps: [
      createSingleAttackStep(faster.combatant, 1),
      createSingleAttackStep(slower.combatant, 1),
    ],
  };
};

type OpenMeleeWeaponKind = 'weapon' | 'natural';

export interface OpenMeleeCombatant {
  id: string;
  initiative: number;
  weaponKind: OpenMeleeWeaponKind;
  weaponSpeedFactor?: number;
}

interface OpenMeleeAttack {
  combatantId: string;
  attackNumber: number;
}

interface OpenMeleeStep {
  attacks: OpenMeleeAttack[];
}

type OpenMeleeReason =
  | 'initiative'
  | 'simultaneous'
  | 'weapon-speed'
  | 'weapon-speed-double'
  | 'weapon-speed-triple';

export interface OpenMeleeResolution {
  reason: OpenMeleeReason;
  steps: OpenMeleeStep[];
}

const createAttack = (
  combatantId: string,
  attackNumber: number
): OpenMeleeAttack => ({
  combatantId,
  attackNumber,
});

const createSingleAttackStep = (
  combatantId: string,
  attackNumber: number
): OpenMeleeStep => ({
  attacks: [createAttack(combatantId, attackNumber)],
});

const createSimultaneousStep = (
  left: OpenMeleeAttack,
  right: OpenMeleeAttack
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
  if (left.initiative > right.initiative) {
    return {
      reason: 'initiative',
      steps: [
        createSingleAttackStep(left.id, 1),
        createSingleAttackStep(right.id, 1),
      ],
    };
  }

  if (right.initiative > left.initiative) {
    return {
      reason: 'initiative',
      steps: [
        createSingleAttackStep(right.id, 1),
        createSingleAttackStep(left.id, 1),
      ],
    };
  }

  if (left.weaponKind !== 'weapon' || right.weaponKind !== 'weapon') {
    return {
      reason: 'simultaneous',
      steps: [
        createSimultaneousStep(
          createAttack(left.id, 1),
          createAttack(right.id, 1)
        ),
      ],
    };
  }

  const leftSpeedFactor = getWeaponSpeedFactor(left);
  const rightSpeedFactor = getWeaponSpeedFactor(right);

  if (leftSpeedFactor === rightSpeedFactor) {
    return {
      reason: 'simultaneous',
      steps: [
        createSimultaneousStep(
          createAttack(left.id, 1),
          createAttack(right.id, 1)
        ),
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
        createSingleAttackStep(faster.combatant.id, 1),
        createSingleAttackStep(faster.combatant.id, 2),
        createSimultaneousStep(
          createAttack(faster.combatant.id, 3),
          createAttack(slower.combatant.id, 1)
        ),
      ],
    };
  }

  if (difference >= getMultipleAttackThreshold(faster.speedFactor)) {
    return {
      reason: 'weapon-speed-double',
      steps: [
        createSingleAttackStep(faster.combatant.id, 1),
        createSingleAttackStep(faster.combatant.id, 2),
        createSingleAttackStep(slower.combatant.id, 1),
      ],
    };
  }

  return {
    reason: 'weapon-speed',
    steps: [
      createSingleAttackStep(faster.combatant.id, 1),
      createSingleAttackStep(slower.combatant.id, 1),
    ],
  };
};

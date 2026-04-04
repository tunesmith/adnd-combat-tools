import {
  getMultipleAttackThreshold,
  resolveOpenMeleeExchange,
  type OpenMeleeResolution,
  type OpenMeleeCombatant,
} from '../helpers/initiative/openMelee';

const createWeaponCombatant = (
  id: string,
  initiative: number,
  weaponSpeedFactor: number,
  attackRoutineCount = 1
): OpenMeleeCombatant => ({
  id,
  initiative,
  weaponKind: 'weapon',
  weaponSpeedFactor,
  attackRoutine: {
    id: `routine:${id}:1`,
    label: 'Attack routine',
    combatantId: id,
    components: Array.from({ length: attackRoutineCount }, (_, index) => ({
      id: `attack-${index + 1}`,
      order: index + 1,
      label: `attack ${index + 1}`,
    })),
    timingBasisComponentId: 'attack-1',
  },
});

const createNaturalCombatant = (
  id: string,
  initiative: number
): OpenMeleeCombatant => ({
  id,
  initiative,
  weaponKind: 'natural',
  attackRoutine: {
    id: `routine:${id}:1`,
    label: 'Attack routine',
    combatantId: id,
    components: [
      {
        id: 'attack-1',
        order: 1,
        label: 'attack 1',
      },
    ],
    timingBasisComponentId: 'attack-1',
  },
});

const stepIds = (resolution: OpenMeleeResolution): string[][] =>
  resolution.steps.map((step) =>
    step.attacks.map((attack) => attack.combatantId)
  );

const stepSignatures = (resolution: OpenMeleeResolution): string[][] =>
  resolution.steps.map((step) =>
    step.attacks.map((attack) => `${attack.combatantId}${attack.attackNumber}`)
  );

describe('open melee initiative helper', () => {
  test('keeps simple initiative ordering when initiative is not tied', () => {
    const slowerWeaponButHigherInitiative = createWeaponCombatant('A', 5, 10);
    const fasterWeaponButLowerInitiative = createWeaponCombatant('B', 4, 2);

    const resolution = resolveOpenMeleeExchange(
      slowerWeaponButHigherInitiative,
      fasterWeaponButLowerInitiative
    );

    expect(resolution.reason).toBe('initiative');
    expect(stepSignatures(resolution)).toEqual([['A1'], ['B1']]);
  });

  test('treats tied natural-vs-weapon melee as simultaneous', () => {
    const naturalAttacker = createNaturalCombatant('A', 4);
    const weaponUser = createWeaponCombatant('B', 4, 3);

    const resolution = resolveOpenMeleeExchange(naturalAttacker, weaponUser);

    expect(resolution.reason).toBe('simultaneous');
    expect(stepSignatures(resolution)).toEqual([['A1', 'B1']]);
  });

  test('treats tied equal-speed weapons as simultaneous', () => {
    const left = createWeaponCombatant('A', 4, 5);
    const right = createWeaponCombatant('B', 4, 5);

    const resolution = resolveOpenMeleeExchange(left, right);

    expect(resolution.reason).toBe('simultaneous');
    expect(stepSignatures(resolution)).toEqual([['A1', 'B1']]);
  });

  test('uses lower weapon speed factor first when tied initiative is otherwise simultaneous', () => {
    const faster = createWeaponCombatant('A', 4, 3);
    const slower = createWeaponCombatant('B', 4, 4);

    const resolution = resolveOpenMeleeExchange(faster, slower);

    expect(resolution.reason).toBe('weapon-speed');
    expect(stepSignatures(resolution)).toEqual([['A1'], ['B1']]);
  });

  test('grants two attacks before the slower weapon when the difference meets the DMG threshold', () => {
    const faster = createWeaponCombatant('A', 4, 2);
    const slower = createWeaponCombatant('B', 4, 6);

    const resolution = resolveOpenMeleeExchange(faster, slower);

    expect(resolution.reason).toBe('weapon-speed-double');
    expect(stepSignatures(resolution)).toEqual([['A1'], ['A2'], ['B1']]);
  });

  test('applies the five-point fallback threshold even when twice-the-lower would be higher', () => {
    const faster = createWeaponCombatant('A', 4, 4);
    const slower = createWeaponCombatant('B', 4, 9);

    const resolution = resolveOpenMeleeExchange(faster, slower);

    expect(getMultipleAttackThreshold(4)).toBe(5);
    expect(resolution.reason).toBe('weapon-speed-double');
    expect(stepSignatures(resolution)).toEqual([['A1'], ['A2'], ['B1']]);
  });

  test('grants the third simultaneous attack when the speed-factor difference is ten or more', () => {
    const faster = createWeaponCombatant('A', 4, 3);
    const slower = createWeaponCombatant('B', 4, 13);

    const resolution = resolveOpenMeleeExchange(faster, slower);

    expect(resolution.reason).toBe('weapon-speed-triple');
    expect(stepSignatures(resolution)).toEqual([['A1'], ['A2'], ['A3', 'B1']]);
  });

  test('marks the first attack as a routine component and later generated attacks as timing bonuses', () => {
    const resolution = resolveOpenMeleeExchange(
      createWeaponCombatant('A', 4, 2),
      createWeaponCombatant('B', 4, 6)
    );

    expect(resolution.steps[0]?.attacks[0]).toMatchObject({
      combatantId: 'A',
      componentId: 'attack-1',
      label: 'attack 1',
      source: 'routine-component',
    });
    expect(resolution.steps[1]?.attacks[0]).toMatchObject({
      combatantId: 'A',
      componentId: 'generated-attack-2',
      label: 'attack 2',
      source: 'timing-bonus',
    });
  });

  test('does not allow the slower weapon to attack before the faster one in any tied weapon matchup', () => {
    for (let faster = 1; faster <= 13; faster += 1) {
      for (let slower = faster + 1; slower <= 13; slower += 1) {
        const resolution = resolveOpenMeleeExchange(
          createWeaponCombatant('fast', 4, faster),
          createWeaponCombatant('slow', 4, slower)
        );
        const flattened = stepIds(resolution).flat();

        expect(flattened.indexOf('fast')).toBeLessThan(
          flattened.indexOf('slow')
        );
      }
    }
  });

  test('matches the DMG threshold shape across all reasonable speed-factor pairs', () => {
    for (let faster = 1; faster <= 13; faster += 1) {
      for (let slower = faster + 1; slower <= 13; slower += 1) {
        const resolution = resolveOpenMeleeExchange(
          createWeaponCombatant('fast', 4, faster),
          createWeaponCombatant('slow', 4, slower)
        );
        const difference = slower - faster;

        if (difference >= 10) {
          expect(resolution.reason).toBe('weapon-speed-triple');
          expect(stepSignatures(resolution)).toEqual([
            ['fast1'],
            ['fast2'],
            ['fast3', 'slow1'],
          ]);
          continue;
        }

        if (difference >= getMultipleAttackThreshold(faster)) {
          expect(resolution.reason).toBe('weapon-speed-double');
          expect(stepSignatures(resolution)).toEqual([
            ['fast1'],
            ['fast2'],
            ['slow1'],
          ]);
          continue;
        }

        expect(resolution.reason).toBe('weapon-speed');
        expect(stepSignatures(resolution)).toEqual([['fast1'], ['slow1']]);
      }
    }
  });

  test('lets a combatant with two routines strike first and last against a single-routine foe', () => {
    const resolution = resolveOpenMeleeExchange(
      createWeaponCombatant('A', 2, 5, 2),
      createWeaponCombatant('B', 5, 3, 1)
    );

    expect(resolution.reason).toBe('multiple-routines');
    expect(stepSignatures(resolution)).toEqual([['A1'], ['B1'], ['A2']]);
  });

  test('uses initiative to break same-phase clashes when both sides have two routines', () => {
    const resolution = resolveOpenMeleeExchange(
      createWeaponCombatant('A', 5, 7, 2),
      createWeaponCombatant('B', 3, 3, 2)
    );

    expect(resolution.reason).toBe('multiple-routines');
    expect(stepSignatures(resolution)).toEqual([
      ['A1'],
      ['B1'],
      ['A2'],
      ['B2'],
    ]);
  });

  test('uses tied-melee timing to break same-phase clashes when both sides have two routines and initiative ties', () => {
    const resolution = resolveOpenMeleeExchange(
      createWeaponCombatant('fast', 4, 2, 2),
      createWeaponCombatant('slow', 4, 6, 2)
    );

    expect(resolution.reason).toBe('multiple-routines');
    expect(stepSignatures(resolution)).toEqual([
      ['fast1'],
      ['slow1'],
      ['fast2'],
      ['slow2'],
    ]);
  });
});

import { buildInitiativeScenario } from '../helpers/initiative/scenario';
import type { InitiativeScenarioDraft } from '../types/initiative';

describe('generic initiative scenario builder', () => {
  test('builds combatants and resolves a clean direct melee engagement from generic draft input', () => {
    const draft: InitiativeScenarioDraft = {
      label: 'Mixed Open Melee',
      partyInitiative: 4,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Aldred',
          weaponId: 17,
          targetCombatantKeys: [3],
        },
        {
          combatantKey: 2,
          name: 'Bera',
          weaponId: 16,
          targetCombatantKeys: [],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Gnoll',
          weaponId: 2,
          targetCombatantKeys: [1],
        },
        {
          combatantKey: 4,
          name: 'Ghoul',
          weaponId: 1,
          targetCombatantKeys: [],
        },
      ],
    };

    const scenario = buildInitiativeScenario(draft);

    expect(scenario.simpleOrder).toBe('simultaneous');
    expect(scenario.party[0]).toMatchObject({
      id: 'party-1',
      weaponName: 'Dagger (Held)',
      weaponType: 'melee',
      weaponSpeedFactor: 2,
      targetIds: ['enemy-3'],
      attackRoutine: {
        id: 'routine:party-1:1',
        timingBasisComponentId: 'attack-1',
        components: [
          {
            id: 'attack-1',
            order: 1,
            label: 'attack 1',
          },
        ],
      },
    });
    expect(scenario.directMeleePairs).toEqual([
      {
        partyCombatantId: 'party-1',
        enemyCombatantId: 'enemy-3',
        inference: 'mutual-targeting-non-missile-weapons',
      },
    ]);
    expect(scenario.directMeleeEngagements[0]?.resolution.reason).toBe(
      'weapon-speed-double'
    );
    expect(scenario.unresolvedMeleeCandidateIds).toEqual([]);
  });

  test('expands ordinary-round missile routines from firing rate', () => {
    const draft: InitiativeScenarioDraft = {
      label: 'Missile Routine Counts',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          weaponId: 11,
          declaredAction: 'missile',
          targetCombatantKeys: [3],
        },
        {
          combatantKey: 2,
          name: 'Darter',
          weaponId: 19,
          declaredAction: 'missile',
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Target',
          weaponId: 1,
          declaredAction: 'open-melee',
          targetCombatantKeys: [],
        },
      ],
    };

    const scenario = buildInitiativeScenario(draft);

    expect(scenario.party[0]?.attackRoutine.components).toEqual([
      {
        id: 'attack-1',
        order: 1,
        label: 'attack 1',
      },
      {
        id: 'attack-2',
        order: 2,
        label: 'attack 2',
      },
    ]);
    expect(scenario.party[1]?.attackRoutine.components).toEqual([
      {
        id: 'attack-1',
        order: 1,
        label: 'attack 1',
      },
      {
        id: 'attack-2',
        order: 2,
        label: 'attack 2',
      },
      {
        id: 'attack-3',
        order: 3,
        label: 'attack 3',
      },
    ]);
  });

  test('caps missile targets to whole-number firing rate', () => {
    const scenario = buildInitiativeScenario({
      label: 'Split Targets',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          weaponId: 11,
          declaredAction: 'missile',
          targetCombatantKeys: [3, 4, 5],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Orc 1',
          declaredAction: 'open-melee',
          weaponId: 1,
        },
        {
          combatantKey: 4,
          name: 'Orc 2',
          declaredAction: 'open-melee',
          weaponId: 1,
        },
        {
          combatantKey: 5,
          name: 'Orc 3',
          declaredAction: 'open-melee',
          weaponId: 1,
        },
      ],
    });

    expect(scenario.party[0]?.targetIds).toEqual(['enemy-3', 'enemy-4']);
  });

  test('uses explicit round-local routine counts for non-missile combatants', () => {
    const draft: InitiativeScenarioDraft = {
      label: 'Multiple Melee Routines',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Fighter',
          weaponId: 56,
          attackRoutineCount: 2,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Gnoll',
          weaponId: 2,
          targetCombatantKeys: [1],
        },
      ],
    };

    const scenario = buildInitiativeScenario(draft);

    expect(scenario.party[0]?.attackRoutine.components).toEqual([
      {
        id: 'attack-1',
        order: 1,
        label: 'attack 1',
      },
      {
        id: 'attack-2',
        order: 2,
        label: 'attack 2',
      },
    ]);
    expect(scenario.directMeleeEngagements[0]?.resolution.reason).toBe(
      'multiple-routines'
    );
  });

  test('treats close and charge as single routines regardless of stored routine count', () => {
    const scenario = buildInitiativeScenario({
      label: 'Movement Actions Stay Single',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Closer',
          declaredAction: 'close',
          weaponId: 56,
          attackRoutineCount: 3,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distanceInches: 4,
            },
          ],
        },
        {
          combatantKey: 2,
          name: 'Charger',
          declaredAction: 'charge',
          weaponId: 56,
          attackRoutineCount: 2,
          targetDeclarations: [
            {
              targetCombatantKey: 4,
              distanceInches: 4,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Target 1',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
        {
          combatantKey: 4,
          name: 'Target 2',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [2],
        },
      ],
    });

    expect(scenario.party[0]?.attackRoutine.components).toEqual([
      {
        id: 'attack-1',
        order: 1,
        label: 'attack 1',
      },
    ]);
    expect(scenario.party[1]?.attackRoutine.components).toEqual([
      {
        id: 'attack-1',
        order: 1,
        label: 'attack 1',
      },
    ]);
  });

  test('treats turn undead as a single attempt regardless of routine count input', () => {
    const scenario = buildInitiativeScenario({
      label: 'Turn Undead',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Sister Arda',
          declaredAction: 'turn-undead',
          attackRoutineCount: 3,
          weaponId: 17,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Skeleton',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });

    expect(scenario.party[0]?.attackRoutine.components).toEqual([
      {
        id: 'turn-attempt',
        order: 1,
        label: 'attempt',
      },
    ]);
  });

  test('treats no combat action as graphless and targetless even if stale targets are present', () => {
    const scenario = buildInitiativeScenario({
      label: 'No Combat Action',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Brother Caradoc',
          declaredAction: 'none',
          weaponId: 17,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Skeleton',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [],
        },
      ],
    });

    expect(scenario.party[0]?.targetIds).toEqual([]);
    expect(scenario.party[0]?.attackRoutine).toMatchObject({
      label: 'No combat action',
      timingBasisComponentId: 'idle',
      components: [
        {
          id: 'idle',
          order: 1,
          label: 'idle',
        },
      ],
    });
  });

  test('treats magical device use as a single discharge and carries activation segments', () => {
    const scenario = buildInitiativeScenario({
      label: 'Magical Device',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Rodric',
          declaredAction: 'magical-device',
          attackRoutineCount: 3,
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              activationSegments: 3,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Skeleton',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });

    expect(scenario.party[0]?.attackRoutine.components).toEqual([
      {
        id: 'device-discharge',
        order: 1,
        label: 'discharge',
      },
    ]);
    expect(scenario.party[0]?.targetDeclarations).toEqual([
      {
        targetId: 'enemy-3',
        activationSegments: 3,
        castingSegments: undefined,
        distanceInches: undefined,
      },
    ]);
  });

  test('treats spell casting as a single routine and carries casting time', () => {
    const scenario = buildInitiativeScenario({
      label: 'Spell Casting',
      partyInitiative: 5,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Mereth',
          declaredAction: 'spell-casting',
          attackRoutineCount: 3,
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              castingSegments: 6,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Hobgoblin',
          declaredAction: 'open-melee',
          weaponId: 17,
          targetCombatantKeys: [1],
        },
      ],
    });

    expect(scenario.party[0]?.attackRoutine.components).toEqual([
      {
        id: 'spell',
        order: 1,
        label: 'spell',
      },
    ]);
    expect(scenario.party[0]?.targetDeclarations).toEqual([
      {
        targetId: 'enemy-3',
        activationSegments: undefined,
        castingSegments: 6,
        distanceInches: undefined,
      },
    ]);
  });
});

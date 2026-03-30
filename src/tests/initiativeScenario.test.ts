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
});

import { buildInitiativeScenario } from '../helpers/initiative/scenario';

describe('initiative movement resolution', () => {
  test('resolves a close action to striking range without creating a same-round attack', () => {
    const scenario = buildInitiativeScenario({
      label: 'Close to Contact',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Ronan',
          declaredAction: 'close',
          movementRate: 12,
          weaponId: 2,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distance: 35,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Orc',
          declaredAction: 'hold',
          movementRate: 9,
          weaponId: 1,
          targetCombatantKeys: [],
        },
      ],
    });

    expect(scenario.movementResolutions).toEqual([
      expect.objectContaining({
        combatantId: 'party-1',
        targetId: 'enemy-3',
        action: 'close',
        reason: 'contact',
        contactSegment: 3,
        closingFeetPerSegment: 12,
        sameRoundAttack: false,
      }),
    ]);
  });

  test('resolves charge contact and reach-based first strike', () => {
    const scenario = buildInitiativeScenario({
      label: 'Charge Contact',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Garran',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 50,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distance: 40,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 17,
          targetCombatantKeys: [1],
        },
      ],
    });

    expect(scenario.movementResolutions).toEqual([
      expect.objectContaining({
        combatantId: 'party-1',
        targetId: 'enemy-3',
        action: 'charge',
        reason: 'contact',
        contactSegment: 2,
        closingFeetPerSegment: 24,
        sameRoundAttack: true,
        firstStrike: 'attacker',
      }),
    ]);
  });

  test('falls back to adjudication when the target is moving on a different line', () => {
    const scenario = buildInitiativeScenario({
      label: 'Crossed Charges',
      partyInitiative: 4,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Aldred',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 50,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distance: 40,
            },
          ],
        },
        {
          combatantKey: 2,
          name: 'Bera',
          declaredAction: 'hold',
          movementRate: 12,
          weaponId: 17,
          targetCombatantKeys: [],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Gnoll',
          declaredAction: 'charge',
          movementRate: 9,
          weaponId: 2,
          targetDeclarations: [
            {
              targetCombatantKey: 2,
              distance: 20,
            },
          ],
        },
      ],
    });

    const aldredResolution = scenario.movementResolutions.find(
      (movementResolution) => movementResolution.combatantId === 'party-1'
    );

    expect(aldredResolution).toEqual(
      expect.objectContaining({
        combatantId: 'party-1',
        targetId: 'enemy-3',
        action: 'charge',
        reason: 'target-moving-elsewhere',
        sameRoundAttack: false,
      })
    );
  });
});

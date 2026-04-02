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
              distanceInches: 3.5,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Orc',
          declaredAction: 'open-melee',
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
        closingInchesPerSegment: 1.2,
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
              distanceInches: 4,
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
        closingInchesPerSegment: 2.4,
        sameRoundAttack: true,
        firstStrike: 'attacker',
      }),
    ]);
  });

  test('lets a closer strike when a charger reaches contact', () => {
    const scenario = buildInitiativeScenario({
      label: 'Charge vs Close',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Ronan',
          declaredAction: 'close',
          movementRate: 12,
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distanceInches: 6,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Lancer',
          declaredAction: 'charge',
          movementRate: 9,
          weaponId: 50,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 6,
            },
          ],
        },
      ],
    });

    const ronanResolution = scenario.movementResolutions.find(
      (movementResolution) => movementResolution.combatantId === 'party-1'
    );
    const lancerResolution = scenario.movementResolutions.find(
      (movementResolution) => movementResolution.combatantId === 'enemy-3'
    );

    expect(ronanResolution).toEqual(
      expect.objectContaining({
        combatantId: 'party-1',
        targetId: 'enemy-3',
        action: 'close',
        reason: 'contact',
        contactSegment: 2,
        closingInchesPerSegment: 3,
        sameRoundAttack: true,
      })
    );
    expect(lancerResolution).toEqual(
      expect.objectContaining({
        combatantId: 'enemy-3',
        targetId: 'party-1',
        action: 'charge',
        reason: 'contact',
        contactSegment: 2,
        closingInchesPerSegment: 3,
        sameRoundAttack: true,
        firstStrike: 'attacker',
      })
    );
  });

  test('resolves mutual charge using combined closing speed', () => {
    const scenario = buildInitiativeScenario({
      label: 'Mutual Charge',
      partyInitiative: 1,
      enemyInitiative: 6,
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
              distanceInches: 4,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 9,
          weaponId: 57,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });

    expect(scenario.movementResolutions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          combatantId: 'party-1',
          targetId: 'enemy-3',
          action: 'charge',
          reason: 'contact',
          contactSegment: 1,
          closingInchesPerSegment: 4.2,
          sameRoundAttack: true,
          firstStrike: 'attacker',
        }),
        expect.objectContaining({
          combatantId: 'enemy-3',
          targetId: 'party-1',
          action: 'charge',
          reason: 'contact',
          contactSegment: 1,
          closingInchesPerSegment: 4.2,
          sameRoundAttack: true,
          firstStrike: 'target',
        }),
      ])
    );
  });

  test('resolves close versus close as contact without same-round attacks', () => {
    const scenario = buildInitiativeScenario({
      label: 'Mutual Close',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Ronan',
          declaredAction: 'close',
          movementRate: 12,
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distanceInches: 4,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'close',
          movementRate: 9,
          weaponId: 2,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });

    expect(scenario.movementResolutions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          combatantId: 'party-1',
          reason: 'contact',
          contactSegment: 2,
          closingInchesPerSegment: 2.1,
          sameRoundAttack: false,
        }),
        expect.objectContaining({
          combatantId: 'enemy-3',
          reason: 'contact',
          contactSegment: 2,
          closingInchesPerSegment: 2.1,
          sameRoundAttack: false,
        }),
      ])
    );
  });

  test('marks open melee versus close as an invalid direct pairing', () => {
    const scenario = buildInitiativeScenario({
      label: 'Invalid Open Melee vs Close',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Ronan',
          declaredAction: 'close',
          movementRate: 12,
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distanceInches: 3.5,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Orc',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });

    expect(scenario.movementResolutions).toEqual([
      expect.objectContaining({
        combatantId: 'party-1',
        targetId: 'enemy-3',
        action: 'close',
        reason: 'invalid-open-melee-target',
        sameRoundAttack: false,
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
              distanceInches: 4,
            },
          ],
        },
        {
          combatantKey: 2,
          name: 'Bera',
          declaredAction: 'missile',
          movementRate: 12,
          weaponId: 16,
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
              distanceInches: 2,
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

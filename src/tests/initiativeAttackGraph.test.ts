import { buildInitiativeAttackGraph } from '../helpers/initiative/attackGraph';
import { resolveInitiativeRound } from '../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../helpers/initiative/scenario';
import type { InitiativeScenarioDraft } from '../types/initiative';

describe('initiative attack graph', () => {
  test('omits untargeted combatants from the graph in a non-tied round', () => {
    const scenario = buildInitiativeScenario({
      label: 'Enemy Initiative Edge',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Hugh',
          weaponId: 2,
          targetCombatantKeys: [3],
        },
        {
          combatantKey: 2,
          name: 'Lysa',
          weaponId: 17,
          targetCombatantKeys: [],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Orc',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
        {
          combatantKey: 4,
          name: 'Orc Archer',
          weaponId: 16,
          targetCombatantKeys: [],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(['attack:enemy-3:1', 'attack:party-1:1'])
    );
    expect(graph.layers).toEqual([['attack:enemy-3:1'], ['attack:party-1:1']]);
    expect(graph.edges).toEqual([
      {
        fromNodeId: 'attack:enemy-3:1',
        toNodeId: 'attack:party-1:1',
        reasons: ['direct-melee'],
      },
    ]);
  });

  test('adds only local direct-melee precedence in a tied round', () => {
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
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.layers).toEqual([
      ['attack:party-1:1'],
      ['attack:party-1:2'],
      ['attack:enemy-3:1'],
    ]);
    expect(graph.edges).toEqual([
      {
        fromNodeId: 'attack:party-1:1',
        toNodeId: 'attack:party-1:2',
        reasons: ['direct-melee'],
      },
      {
        fromNodeId: 'attack:party-1:2',
        toNodeId: 'attack:enemy-3:1',
        reasons: ['direct-melee'],
      },
    ]);
  });

  test('graphs turn undead behind an enemy melee attack when the turner loses initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Turn Undead',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Sister Arda',
          declaredAction: 'turn-undead',
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
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(['attack:enemy-3:1', 'attack:party-1:1'])
    );
    expect(graph.edges).toEqual([
      {
        fromNodeId: 'attack:enemy-3:1',
        toNodeId: 'attack:party-1:1',
        reasons: ['simple-initiative'],
      },
    ]);
    expect(graph.layers).toEqual([['attack:enemy-3:1'], ['attack:party-1:1']]);
  });

  test('keeps turn undead simultaneous with melee on tied initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Turn Undead Tie',
      partyInitiative: 4,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Sister Arda',
          declaredAction: 'turn-undead',
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
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.edges).toEqual([]);
    expect(graph.layers).toEqual([['attack:party-1:1', 'attack:enemy-3:1']]);
  });

  test('keeps an extra attacker on baseline initiative while only the duel gets local precedence', () => {
    const scenario = buildInitiativeScenario({
      label: 'Ambiguous Scrum',
      partyInitiative: 6,
      enemyInitiative: 1,
      party: [
        {
          combatantKey: 1,
          name: 'Moryn',
          weaponId: 2,
          targetCombatantKeys: [4],
        },
        {
          combatantKey: 2,
          name: 'Sella',
          weaponId: 3,
          targetCombatantKeys: [4],
        },
      ],
      enemies: [
        {
          combatantKey: 4,
          name: 'Bugbear',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.layers).toEqual([
      ['attack:party-1:1', 'attack:party-2:1'],
      ['attack:enemy-4:1'],
    ]);
    expect(graph.edges).toEqual([
      {
        fromNodeId: 'attack:party-1:1',
        toNodeId: 'attack:enemy-4:1',
        reasons: ['direct-melee'],
      },
    ]);
  });

  test('graphs charge contact and local first-strike precedence', () => {
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
          name: 'Hobgoblin',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 57,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          kind: 'attack',
          segment: 2,
        }),
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          kind: 'attack',
          segment: 2,
        }),
      ])
    );
    expect(graph.edges).toEqual([
      {
        fromNodeId: 'attack:party-1:1',
        toNodeId: 'attack:enemy-3:1',
        reasons: ['movement'],
      },
    ]);
    expect(graph.layers).toEqual([['attack:party-1:1'], ['attack:enemy-3:1']]);
  });

  test('graphs set versus charge as an automatic preemption of the charger', () => {
    const scenario = buildInitiativeScenario({
      label: 'Set vs Charge',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Doran',
          declaredAction: 'set-vs-charge',
          movementRate: 12,
          weaponId: 50,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'attack:party-1:1', segment: 2 }),
        expect.objectContaining({ id: 'attack:enemy-3:1', segment: 2 }),
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        {
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'attack:enemy-3:1',
          reasons: ['movement'],
        },
      ])
    );
  });

  test('graphs close contact as a segment call without inventing ensuing blows', () => {
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
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'contact:party-1',
          kind: 'contact',
          segment: 3,
        }),
      ])
    );
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes.map((node) => node.id)).not.toContain(
      'attack:party-1:1'
    );
    expect(graph.nodes.map((node) => node.id)).not.toContain(
      'attack:enemy-3:1'
    );
    expect(graph.edges).toEqual([]);
  });

  test('omits an untriggered set weapon from the graph while leaving the opponent on baseline order', () => {
    const scenario = buildInitiativeScenario({
      label: 'Set Not Triggered',
      partyInitiative: 6,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Doran',
          declaredAction: 'set-vs-charge',
          movementRate: 12,
          weaponId: 50,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 56,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes.map((node) => node.id)).toEqual(['attack:enemy-3:1']);
    expect(graph.edges).toEqual([]);
    expect(graph.layers).toEqual([['attack:enemy-3:1']]);
  });

  test('graphs charge against close with a same-round response from the closer', () => {
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
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          kind: 'attack',
          segment: 2,
        }),
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          kind: 'attack',
          segment: 2,
        }),
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        {
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'attack:party-1:1',
          reasons: ['movement'],
        },
      ])
    );
  });

  test('graphs mutual charge using relative closing speed and reach rather than initiative', () => {
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
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'attack:party-1:1', segment: 1 }),
        expect.objectContaining({ id: 'attack:enemy-3:1', segment: 1 }),
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        {
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'attack:enemy-3:1',
          reasons: ['movement'],
        },
      ])
    );
  });

  test('omits invalid open melee versus close from the graph', () => {
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
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(graph.layers).toEqual([]);
  });

  test('keeps ordinary missile volleys together under initiative rather than bow, sling, bow', () => {
    const partyWinningScenario = buildInitiativeScenario({
      label: 'Bow vs Sling Party Wins',
      partyInitiative: 5,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Slinger',
          declaredAction: 'missile',
          weaponId: 48,
          targetCombatantKeys: [1],
        },
      ],
    });
    const enemyWinningScenario = buildInitiativeScenario({
      label: 'Bow vs Sling Enemy Wins',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Slinger',
          declaredAction: 'missile',
          weaponId: 48,
          targetCombatantKeys: [1],
        },
      ],
    });

    const partyWinningGraph = buildInitiativeAttackGraph(
      partyWinningScenario,
      resolveInitiativeRound(partyWinningScenario)
    );
    const enemyWinningGraph = buildInitiativeAttackGraph(
      enemyWinningScenario,
      resolveInitiativeRound(enemyWinningScenario)
    );

    expect(partyWinningGraph.layers).toEqual([
      ['attack:party-1:1', 'attack:party-1:2'],
      ['attack:enemy-3:1'],
    ]);
    expect(enemyWinningGraph.layers).toEqual([
      ['attack:enemy-3:1'],
      ['attack:party-1:1', 'attack:party-1:2'],
    ]);
  });

  test('uses initiative to order equal firing-rate missile volleys as groups', () => {
    const scenario = buildInitiativeScenario({
      label: 'Bow vs Bow',
      partyInitiative: 6,
      enemyInitiative: 3,
      party: [
        {
          combatantKey: 1,
          name: 'Party Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Enemy Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [1],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.layers).toEqual([
      ['attack:party-1:1', 'attack:party-1:2'],
      ['attack:enemy-3:1', 'attack:enemy-3:2'],
    ]);
  });

  test('uses the missile initiative adjustment to order equal firing-rate missile volleys as groups', () => {
    const scenario = buildInitiativeScenario({
      label: 'Bow vs Bow With Dex',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Party Bowman',
          declaredAction: 'missile',
          missileInitiativeAdjustment: 3,
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Enemy Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [1],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.layers).toEqual([
      ['attack:party-1:1', 'attack:party-1:2'],
      ['attack:enemy-3:1', 'attack:enemy-3:2'],
    ]);
  });

  test('keeps all dart shots inside one initiative-controlled volley', () => {
    const scenario = buildInitiativeScenario({
      label: 'Dart vs Sling',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Darter',
          declaredAction: 'missile',
          weaponId: 19,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Slinger',
          declaredAction: 'missile',
          weaponId: 48,
          targetCombatantKeys: [1],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.layers).toEqual([
      ['attack:enemy-3:1'],
      ['attack:party-1:1', 'attack:party-1:2', 'attack:party-1:3'],
    ]);
  });

  test('lets one bow shot happen before a charge when the missile side wins initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Bow vs Charge',
      partyInitiative: 5,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.nodes.map((node) => node.id)).toEqual([
      'attack:enemy-3:1',
      'attack:party-1:1',
    ]);
    expect(graph.layers).toEqual([['attack:party-1:1'], ['attack:enemy-3:1']]);
    expect(graph.edges).toEqual([
      {
        fromNodeId: 'attack:party-1:1',
        toNodeId: 'attack:enemy-3:1',
        reasons: ['simple-initiative'],
      },
    ]);
  });

  test('lets a missile volley beat base side initiative when the missile adjustment is higher', () => {
    const scenario = buildInitiativeScenario({
      label: 'Missile Dex Edge',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          missileInitiativeAdjustment: 3,
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Orc',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.layers).toEqual([
      ['attack:party-1:1', 'attack:party-1:2'],
      ['attack:enemy-3:1'],
    ]);
    expect(graph.edges).toEqual([
      {
        fromNodeId: 'attack:party-1:1',
        toNodeId: 'attack:enemy-3:1',
        reasons: ['simple-initiative'],
      },
      {
        fromNodeId: 'attack:party-1:2',
        toNodeId: 'attack:enemy-3:1',
        reasons: ['simple-initiative'],
      },
    ]);
  });

  test('drops missile shots when a charge beats them after missile adjustment', () => {
    const scenario = buildInitiativeScenario({
      label: 'Charge Beats Bow With Dex',
      partyInitiative: 5,
      enemyInitiative: 3,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          missileInitiativeAdjustment: -3,
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.nodes.map((node) => node.id)).toEqual(['attack:enemy-3:1']);
    expect(graph.layers).toEqual([['attack:enemy-3:1']]);
    expect(graph.edges).toEqual([]);
  });

  test('drops both bow shots when the charge side wins initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Charge Beats Bow',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.nodes.map((node) => node.id)).toEqual(['attack:enemy-3:1']);
    expect(graph.layers).toEqual([['attack:enemy-3:1']]);
    expect(graph.edges).toEqual([]);
  });

  test('keeps the first bow shot simultaneous with the charge on tied initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Bow vs Charge Tie',
      partyInitiative: 4,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.nodes.map((node) => node.id)).toEqual([
      'attack:enemy-3:1',
      'attack:party-1:1',
    ]);
    expect(graph.layers).toHaveLength(1);
    expect(graph.layers[0]?.slice().sort()).toEqual([
      'attack:enemy-3:1',
      'attack:party-1:1',
    ]);
    expect(graph.edges).toEqual([]);
  });

  test('renders magical device discharge in a segment lane when activation time is specified', () => {
    const scenario = buildInitiativeScenario({
      label: 'Magical Device Segments',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Rodric',
          declaredAction: 'magical-device',
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
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          segment: 3,
        }),
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          segment: undefined,
        }),
      ])
    );
    expect(graph.edges).toEqual([
      {
        fromNodeId: 'attack:enemy-3:1',
        toNodeId: 'attack:party-1:1',
        reasons: ['simple-initiative'],
      },
    ]);
  });

  test('keeps magical device discharge unsegmented when no activation time is supplied', () => {
    const scenario = buildInitiativeScenario({
      label: 'Magical Device',
      partyInitiative: 5,
      enemyInitiative: 3,
      party: [
        {
          combatantKey: 1,
          name: 'Rodric',
          declaredAction: 'magical-device',
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
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          segment: undefined,
        }),
      ])
    );
  });

  test('graphs spell start and completion as separate nodes', () => {
    const scenario = buildInitiativeScenario({
      label: 'Spell Casting',
      partyInitiative: 5,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Mereth',
          declaredAction: 'spell-casting',
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
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spell-start:party-1',
          kind: 'spell-start',
          segment: 1,
        }),
        expect.objectContaining({
          id: 'spell-completion:party-1',
          kind: 'spell-completion',
          segment: 6,
        }),
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'spell-start:party-1',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-casting'],
        }),
      ])
    );
  });

  test('lets an attack spoil a spell when the caster loses initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Spell Interrupted',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Mereth',
          declaredAction: 'spell-casting',
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              castingSegments: 5,
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
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-interruption'],
        }),
      ])
    );
  });

  test('uses the attacks-directed-at-spell-casters segment when the caster wins initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Spell vs Missile',
      partyInitiative: 5,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Mereth',
          declaredAction: 'spell-casting',
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
          name: 'Archer',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [1],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-interruption'],
        }),
        expect.objectContaining({
          fromNodeId: 'attack:enemy-3:2',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-interruption'],
        }),
      ])
    );
  });

  test('uses initiative to order equal-time spell completions within the same segment', () => {
    const scenario = buildInitiativeScenario({
      label: 'Magic Missile vs Shield',
      partyInitiative: 5,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Mereth',
          declaredAction: 'spell-casting',
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              castingSegments: 1,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Shield',
          declaredAction: 'spell-casting',
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              castingSegments: 1,
            },
          ],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spell-start:party-1',
          segment: 1,
        }),
        expect.objectContaining({
          id: 'spell-completion:party-1',
          segment: 1,
        }),
        expect.objectContaining({
          id: 'spell-start:enemy-3',
          segment: 1,
        }),
        expect.objectContaining({
          id: 'spell-completion:enemy-3',
          segment: 1,
        }),
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'spell-completion:party-1',
          toNodeId: 'spell-completion:enemy-3',
          reasons: ['spell-interruption'],
        }),
      ])
    );
  });

  test('does not let a later ordinary melee routine automatically spoil a short spell', () => {
    const scenario = buildInitiativeScenario({
      label: 'Later Routine vs Short Spell',
      partyInitiative: 2,
      enemyInitiative: 6,
      party: [
        {
          combatantKey: 1,
          name: 'Levitate',
          declaredAction: 'spell-casting',
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              castingSegments: 2,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Enemy 6',
          declaredAction: 'open-melee',
          attackRoutineCount: 2,
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-interruption'],
        }),
      ])
    );
    expect(graph.edges).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:enemy-3:2',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-interruption'],
        }),
        expect.objectContaining({
          fromNodeId: 'spell-completion:party-1',
          toNodeId: 'attack:enemy-3:2',
          reasons: ['spell-interruption'],
        }),
      ])
    );
  });
});

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

  test('omits no combat action nodes from the graph even if stale targets are present', () => {
    const scenario = buildInitiativeScenario({
      label: 'No Combat Action',
      partyInitiative: 2,
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
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(graph.layers).toEqual([]);
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

  test('records direct melee placement reasons on mixed tied open melee nodes', () => {
    const scenario = buildInitiativeScenario({
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
          weaponId: 13,
          targetCombatantKeys: [4],
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
          targetCombatantKeys: [2],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(
      graph.nodes.find((node) => node.id === 'attack:party-1:2')?.placement
    ).toEqual({
      kind: 'direct-melee',
      opponentId: 'enemy-3',
      resolutionReason: 'weapon-speed-double',
    });
    expect(
      graph.nodes.find((node) => node.id === 'attack:party-2:1')?.placement
    ).toEqual({
      kind: 'direct-melee',
      opponentId: 'enemy-4',
      resolutionReason: 'simultaneous',
    });
    expect(
      graph.nodes.find((node) => node.id === 'attack:enemy-4:1')?.placement
    ).toEqual({
      kind: 'direct-melee',
      opponentId: 'party-2',
      resolutionReason: 'simultaneous',
    });
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

  test('keeps a targetless spell in the graph and lets directed attacks interrupt it', () => {
    const scenario = buildInitiativeScenario({
      label: 'Targetless Spell',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Cleric',
          declaredAction: 'spell-casting',
          castingSegments: 2,
          weaponId: 17,
          targetCombatantKeys: [],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Ghoul',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining([
        'spell-start:party-1',
        'spell-completion:party-1',
        'attack:enemy-3:1',
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        {
          fromNodeId: 'spell-start:party-1',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-casting'],
        },
        {
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-interruption'],
        },
      ])
    );
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

  test('records explicit simultaneous groups for tied direct melee steps', () => {
    const scenario = buildInitiativeScenario({
      label: 'Simultaneous Direct Melee',
      partyInitiative: 4,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Aldred',
          declaredAction: 'open-melee',
          weaponId: 17,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Ghoul',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.simultaneousGroups).toEqual([
      ['attack:party-1:1', 'attack:enemy-3:1'],
    ]);
  });

  test('keeps an extra attacker on baseline initiative while the duel combatants still participate against others', () => {
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
      {
        fromNodeId: 'attack:party-2:1',
        toNodeId: 'attack:enemy-4:1',
        reasons: ['simple-initiative'],
      },
    ]);
  });

  test('lets a direct-melee combatant remain in the broader multiple-routine ordering against other combatants', () => {
    const scenario = buildInitiativeScenario({
      label: 'Direct Melee Still Orders Against Others',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Astrid',
          declaredAction: 'open-melee',
          weaponId: 39,
          targetCombatantKeys: [3],
        },
        {
          combatantKey: 2,
          name: 'Bemis',
          declaredAction: 'open-melee',
          weaponId: 13,
          targetCombatantKeys: [],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Halberd Gnoll 1',
          declaredAction: 'open-melee',
          weaponId: 30,
          targetCombatantKeys: [1],
        },
        {
          combatantKey: 4,
          name: 'Halberd Gnoll 2',
          declaredAction: 'open-melee',
          attackRoutineCount: 2,
          weaponId: 30,
          targetCombatantKeys: [2],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        {
          fromNodeId: 'attack:enemy-4:1',
          toNodeId: 'attack:enemy-3:1',
          reasons: ['simple-initiative'],
        },
        {
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'attack:enemy-4:2',
          reasons: ['simple-initiative'],
        },
      ])
    );
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
        expect.objectContaining({
          id: 'attack:party-1:1',
          segment: 2,
          placement: {
            kind: 'movement-attack',
            action: 'set-vs-charge',
            role: 'acting-combatant',
            opponentId: 'enemy-3',
            distanceInches: 4,
            movementRate: 12,
            contactSegment: 2,
            firstStrike: 'attacker',
            damageMultiplier: 2,
          },
        }),
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          segment: 2,
          placement: {
            kind: 'movement-attack',
            action: 'charge',
            role: 'acting-combatant',
            opponentId: 'party-1',
            distanceInches: 4,
            movementRate: 12,
            contactSegment: 2,
            firstStrike: 'target',
            damageMultiplier: undefined,
          },
        }),
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

  test('records a charge target response placement for an open-melee defender', () => {
    const scenario = buildInitiativeScenario({
      label: 'Charge vs Open Melee Response',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Lancer',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
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
          name: 'Guard',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 50,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          segment: 2,
          placement: {
            kind: 'movement-attack',
            action: 'open-melee',
            role: 'charge-target',
            opponentId: 'party-1',
            distanceInches: 4,
            movementRate: 9,
            contactSegment: 2,
            firstStrike: 'target',
            damageMultiplier: undefined,
          },
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

  test('suppresses positive missile initiative bonuses below 12 movement', () => {
    const scenario = buildInitiativeScenario({
      label: 'Encumbered Bowman',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          movementRate: 9,
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
      ['attack:enemy-3:1'],
      ['attack:party-1:1', 'attack:party-1:2'],
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

  test('still applies negative missile initiative adjustments below 12 movement', () => {
    const scenario = buildInitiativeScenario({
      label: 'Encumbered Slow Bowman',
      partyInitiative: 5,
      enemyInitiative: 3,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          movementRate: 9,
          missileInitiativeAdjustment: -3,
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
      ['attack:enemy-3:1'],
      ['attack:party-1:1', 'attack:party-1:2'],
    ]);
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

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          segment: 5,
        }),
        expect.objectContaining({
          id: 'attack:enemy-3:2',
          segment: 5,
        }),
      ])
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

  test('uses the tied initiative segment when initiative is tied against a spell caster', () => {
    const scenario = buildInitiativeScenario({
      label: 'Tied Spell vs Missile',
      partyInitiative: 5,
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

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          segment: 5,
          segmentReason: 'spell-directed',
          placement: {
            kind: 'spell-directed',
            casterId: 'party-1',
          },
        }),
        expect.objectContaining({
          id: 'attack:enemy-3:2',
          segment: 5,
          segmentReason: 'spell-directed',
          placement: {
            kind: 'spell-directed',
            casterId: 'party-1',
          },
        }),
      ])
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

  test('records weapon-vs-spell placement on a melee attacker striking a caster', () => {
    const scenario = buildInitiativeScenario({
      label: 'Fighters and Cleric',
      partyInitiative: 5,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Fighter A',
          declaredAction: 'open-melee',
          weaponId: 54,
          targetCombatantKeys: [4],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Fighter B',
          declaredAction: 'open-melee',
          weaponId: 2,
          targetCombatantKeys: [1],
        },
        {
          combatantKey: 4,
          name: 'Cleric',
          declaredAction: 'spell-casting',
          weaponId: 1,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              castingSegments: 5,
            },
          ],
        },
      ],
    });
    const graph = buildInitiativeAttackGraph(
      scenario,
      resolveInitiativeRound(scenario)
    );

    expect(
      graph.nodes.find((node) => node.id === 'attack:party-1:1')?.placement
    ).toEqual({
      kind: 'weapon-vs-spell',
      casterId: 'enemy-4',
      castingSegments: 5,
      weaponSpeedFactor: 6,
      relation: 'after',
    });
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'spell-completion:enemy-4',
          toNodeId: 'attack:party-1:1',
          reasons: ['spell-interruption'],
        }),
      ])
    );
  });

  test('keeps a tied directed attack simultaneous when the spell completes on the tied segment', () => {
    const scenario = buildInitiativeScenario({
      label: 'Tied Spell Completion Segment',
      partyInitiative: 5,
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

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          segment: 5,
          segmentReason: 'spell-directed',
        }),
      ])
    );
    expect(graph.edges).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'spell-completion:party-1',
          reasons: ['spell-interruption'],
        }),
        expect.objectContaining({
          fromNodeId: 'spell-completion:party-1',
          toNodeId: 'attack:enemy-3:1',
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

  test('lets one spell completion interrupt multiple targeted spell casters', () => {
    const scenario = buildInitiativeScenario({
      label: 'Magic Missile vs Multiple Casters',
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
            {
              targetCombatantKey: 4,
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
        {
          combatantKey: 4,
          name: 'Charm Person',
          declaredAction: 'spell-casting',
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              castingSegments: 3,
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
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'spell-completion:party-1',
          toNodeId: 'spell-completion:enemy-3',
          reasons: ['spell-interruption'],
        }),
        expect.objectContaining({
          fromNodeId: 'spell-completion:party-1',
          toNodeId: 'spell-completion:enemy-4',
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

  test('does not let a spell-directed first attack globally delay unrelated attacks', () => {
    const scenario = buildInitiativeScenario({
      label: 'Spell-directed first attack stays local',
      partyInitiative: 6,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'B1',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [3],
        },
        {
          combatantKey: 2,
          name: 'B6',
          declaredAction: 'spell-casting',
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 4,
              castingSegments: 2,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'A7',
          declaredAction: 'spell-casting',
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              castingSegments: 4,
            },
          ],
        },
        {
          combatantKey: 4,
          name: 'A6',
          declaredAction: 'open-melee',
          attackRoutineCount: 2,
          weaponId: 1,
          targetCombatantKeys: [2],
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
          id: 'attack:enemy-4:1',
          segment: 6,
          segmentReason: 'spell-directed',
        }),
      ])
    );
    expect(graph.edges).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:enemy-4:1',
          toNodeId: 'attack:party-1:1',
          reasons: ['simple-initiative'],
        }),
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'spell-completion:enemy-3',
          reasons: ['spell-interruption'],
        }),
        expect.objectContaining({
          fromNodeId: 'attack:enemy-4:1',
          toNodeId: 'attack:enemy-4:2',
          reasons: ['simple-initiative'],
        }),
        expect.objectContaining({
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'attack:enemy-4:2',
          reasons: ['simple-initiative'],
        }),
      ])
    );
  });

  test('uses target-specific missile volley nodes against multiple spellcasters', () => {
    const scenario = buildInitiativeScenario({
      label: 'Bowman vs Two Casters',
      partyInitiative: 5,
      enemyInitiative: 3,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3, 4],
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
        {
          combatantKey: 4,
          name: 'Charm Person',
          declaredAction: 'spell-casting',
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              castingSegments: 3,
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
          id: 'attack:party-1:1',
          targetId: 'enemy-3',
        }),
        expect.objectContaining({
          id: 'attack:party-1:2',
          targetId: 'enemy-4',
        }),
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'spell-completion:enemy-3',
          reasons: ['spell-interruption'],
        }),
        expect.objectContaining({
          fromNodeId: 'attack:party-1:2',
          toNodeId: 'spell-completion:enemy-4',
          reasons: ['spell-interruption'],
        }),
      ])
    );
    expect(graph.edges).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'spell-completion:enemy-4',
          reasons: ['spell-interruption'],
        }),
        expect.objectContaining({
          fromNodeId: 'attack:party-1:2',
          toNodeId: 'spell-completion:enemy-3',
          reasons: ['spell-interruption'],
        }),
      ])
    );
  });
});

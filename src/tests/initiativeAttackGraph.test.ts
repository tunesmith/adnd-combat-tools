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

    expect(graph.nodes.map((node) => node.id)).toEqual([
      'attack:enemy-3:1',
      'attack:party-1:1',
    ]);
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
          id: 'contact:party-1',
          label: 'contact',
          kind: 'contact',
          source: 'movement-contact',
          segment: 2,
        }),
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
        fromNodeId: 'contact:party-1',
        toNodeId: 'attack:party-1:1',
        reasons: ['movement'],
      },
      {
        fromNodeId: 'attack:party-1:1',
        toNodeId: 'attack:enemy-3:1',
        reasons: ['movement'],
      },
    ]);
    expect(graph.layers).toEqual([
      ['contact:party-1'],
      ['attack:party-1:1'],
      ['attack:enemy-3:1'],
    ]);
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
          id: 'contact:party-1',
          kind: 'contact',
          segment: 2,
        }),
        expect.objectContaining({
          id: 'contact:enemy-3',
          kind: 'contact',
          segment: 2,
        }),
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
          fromNodeId: 'contact:party-1',
          toNodeId: 'attack:party-1:1',
          reasons: ['movement'],
        },
        {
          fromNodeId: 'contact:enemy-3',
          toNodeId: 'attack:enemy-3:1',
          reasons: ['movement'],
        },
        {
          fromNodeId: 'contact:party-1',
          toNodeId: 'attack:party-1:1',
          reasons: ['movement'],
        },
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
        expect.objectContaining({ id: 'contact:party-1', segment: 1 }),
        expect.objectContaining({ id: 'contact:enemy-3', segment: 1 }),
        expect.objectContaining({ id: 'attack:party-1:1', segment: 1 }),
        expect.objectContaining({ id: 'attack:enemy-3:1', segment: 1 }),
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        {
          fromNodeId: 'contact:party-1',
          toNodeId: 'attack:party-1:1',
          reasons: ['movement'],
        },
        {
          fromNodeId: 'contact:enemy-3',
          toNodeId: 'attack:enemy-3:1',
          reasons: ['movement'],
        },
        {
          fromNodeId: 'contact:enemy-3',
          toNodeId: 'attack:party-1:1',
          reasons: ['movement'],
        },
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
});

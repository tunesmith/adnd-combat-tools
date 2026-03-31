import { buildInitiativeAttackGraph } from '../helpers/initiative/attackGraph';
import { resolveInitiativeRound } from '../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../helpers/initiative/scenario';
import type { InitiativeScenarioDraft } from '../types/initiative';

describe('initiative attack graph', () => {
  test('applies baseline simple initiative to all attacks in a non-tied round', () => {
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
      expect.arrayContaining([
        'attack:party-1:1',
        'attack:enemy-3:1',
        'attack:party-2:1',
        'attack:enemy-4:1',
      ])
    );
    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:enemy-4:1',
          label: 'attack 1',
          source: 'routine-component',
        }),
      ])
    );
    expect(graph.layers).toEqual([
      ['attack:enemy-3:1', 'attack:enemy-4:1'],
      ['attack:party-1:1', 'attack:party-2:1'],
    ]);
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        {
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'attack:party-1:1',
          reasons: ['direct-melee'],
        },
        {
          fromNodeId: 'attack:enemy-4:1',
          toNodeId: 'attack:party-2:1',
          reasons: ['simple-initiative'],
        },
      ])
    );
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
      ['attack:party-1:1', 'attack:party-2:1', 'attack:enemy-4:1'],
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

  test('keeps ambiguous melee on baseline initiative without inventing local precedence', () => {
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
          targetCombatantKeys: [1, 2],
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
        reasons: ['simple-initiative'],
      },
      {
        fromNodeId: 'attack:party-2:1',
        toNodeId: 'attack:enemy-4:1',
        reasons: ['simple-initiative'],
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
          declaredAction: 'hold',
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
        expect.objectContaining({
          id: 'attack:enemy-3:1',
          kind: 'attack',
        }),
      ])
    );
    expect(graph.nodes.map((node) => node.id)).not.toContain(
      'attack:party-1:1'
    );
    expect(graph.edges).toEqual([]);
  });
});

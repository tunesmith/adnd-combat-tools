import { buildInitiativeAttackGraph } from '../helpers/initiative/attackGraph';
import { buildInitiativeAttackGraphLayout } from '../helpers/initiative/attackGraphLayout';
import { resolveInitiativeRound } from '../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../helpers/initiative/scenario';

describe('initiative attack graph layout', () => {
  test('places graph nodes by layer and emits a path for each edge', () => {
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
    const layout = buildInitiativeAttackGraphLayout(graph);

    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
    expect(layout.nodes).toHaveLength(graph.nodes.length);
    expect(layout.edges).toHaveLength(graph.edges.length);

    const enemyFirstAttack = layout.nodes.find(
      (node) => node.nodeId === 'attack:enemy-3:1'
    );
    const enemySecondAttack = layout.nodes.find(
      (node) => node.nodeId === 'attack:enemy-4:1'
    );
    const partyFirstAttack = layout.nodes.find(
      (node) => node.nodeId === 'attack:party-1:1'
    );
    const partySecondAttack = layout.nodes.find(
      (node) => node.nodeId === 'attack:party-2:1'
    );

    expect(enemyFirstAttack).toBeDefined();
    expect(enemySecondAttack).toBeDefined();
    expect(partyFirstAttack).toBeDefined();
    expect(partySecondAttack).toBeDefined();

    expect(enemyFirstAttack?.x).toBe(enemySecondAttack?.x);
    expect(partyFirstAttack?.x).toBe(partySecondAttack?.x);
    expect(enemyFirstAttack?.x).toBeLessThan(partyFirstAttack?.x || 0);
    expect(enemyFirstAttack?.y).toBeLessThan(enemySecondAttack?.y || 0);
    expect(partyFirstAttack?.y).toBeLessThan(partySecondAttack?.y || 0);

    expect(layout.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:enemy-3:1',
          toNodeId: 'attack:party-1:1',
          path: expect.stringMatching(/^M /),
        }),
      ])
    );
  });
});

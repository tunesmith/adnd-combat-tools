import { buildInitiativeAttackGraph } from '../helpers/initiative/attackGraph';
import { buildInitiativeAttackGraphLayout } from '../helpers/initiative/attackGraphLayout';
import { resolveInitiativeRound } from '../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../helpers/initiative/scenario';

describe('initiative attack graph layout', () => {
  test('places unsegmented graph nodes on dependency columns and emits a path for each edge', () => {
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
    expect(layout.segmentColumns).toHaveLength(10);

    const enemyFirstAttack = layout.nodes.find(
      (node) => node.nodeId === 'attack:enemy-3:1'
    );
    const partyFirstAttack = layout.nodes.find(
      (node) => node.nodeId === 'attack:party-1:1'
    );

    expect(enemyFirstAttack).toBeDefined();
    expect(partyFirstAttack).toBeDefined();

    expect(enemyFirstAttack?.x).toBeLessThan(partyFirstAttack?.x || 0);
    expect(
      layout.segmentColumns.some((column) => column.x === enemyFirstAttack?.x)
    ).toBe(false);
    expect(
      layout.segmentColumns.some((column) => column.x === partyFirstAttack?.x)
    ).toBe(false);

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

  test('anchors same-segment charge attacks under their segment column', () => {
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
    const layout = buildInitiativeAttackGraphLayout(graph);

    const segmentTwoColumn = layout.segmentColumns.find(
      (column) => column.segment === 2
    );
    const attackerNode = layout.nodes.find(
      (node) => node.nodeId === 'attack:party-1:1'
    );
    const defenderNode = layout.nodes.find(
      (node) => node.nodeId === 'attack:enemy-3:1'
    );

    expect(segmentTwoColumn).toBeDefined();
    expect(attackerNode?.x).toBe(segmentTwoColumn?.x);
    expect(defenderNode?.x).toBe(segmentTwoColumn?.x);
    expect(attackerNode?.y).toBeLessThan(defenderNode?.y || 0);

    expect(layout.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'attack:enemy-3:1',
          path: expect.stringContaining(`M ${segmentTwoColumn?.centerX} `),
        }),
      ])
    );
  });
});

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
    expect(layout.hasSegmentBand).toBe(false);
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
    expect(layout.hasSegmentBand).toBe(true);
    expect(attackerNode?.x).toBeGreaterThanOrEqual(
      segmentTwoColumn?.startX || 0
    );
    expect(attackerNode?.x).toBeLessThan(
      (segmentTwoColumn?.endX || 0) - (attackerNode?.width || 0)
    );
    expect(defenderNode?.x).toBe(attackerNode?.x);
    expect(attackerNode?.y).toBeLessThan(defenderNode?.y || 0);

    expect(layout.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'attack:enemy-3:1',
          path: expect.stringMatching(/^M /),
        }),
      ])
    );
  });

  test('splits independent same-segment chains into local subcolumns', () => {
    const scenario = buildInitiativeScenario({
      label: 'Segment Two Split',
      partyInitiative: 4,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Doran',
          declaredAction: 'set-vs-charge',
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
          name: 'Garran',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
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
        {
          combatantKey: 4,
          name: 'Hobgoblin Guard',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 59,
          targetCombatantKeys: [2],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);
    const layout = buildInitiativeAttackGraphLayout(graph);

    const hobgoblinNode = layout.nodes.find(
      (node) => node.nodeId === 'attack:enemy-4:1'
    );
    const garranNode = layout.nodes.find(
      (node) => node.nodeId === 'attack:party-2:1'
    );
    const doranNode = layout.nodes.find(
      (node) => node.nodeId === 'attack:party-1:1'
    );
    const raiderNode = layout.nodes.find(
      (node) => node.nodeId === 'attack:enemy-3:1'
    );
    const segmentTwoColumn = layout.segmentColumns.find(
      (column) => column.segment === 2
    );

    expect(segmentTwoColumn).toBeDefined();
    expect(hobgoblinNode?.x).not.toBe(doranNode?.x);
    expect(hobgoblinNode?.y).toBe(doranNode?.y);
    expect(garranNode?.x).toBe(hobgoblinNode?.x);
    expect(raiderNode?.x).toBe(doranNode?.x);
    expect(garranNode?.y).toBe(raiderNode?.y);
    expect(
      (segmentTwoColumn?.endX || 0) - (segmentTwoColumn?.startX || 0)
    ).toBeGreaterThan(300);
  });

  test('keeps segment guides in the upper band and pushes dependency-only nodes below it', () => {
    const scenario = buildInitiativeScenario({
      label: 'Large Mixed Battle',
      partyInitiative: 4,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Doran',
          declaredAction: 'set-vs-charge',
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
          name: 'Ysra',
          declaredAction: 'missile',
          movementRate: 12,
          weaponId: 49,
          targetCombatantKeys: [4],
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
        {
          combatantKey: 4,
          name: 'Goblin Archer',
          declaredAction: 'missile',
          movementRate: 6,
          weaponId: 16,
          targetCombatantKeys: [2],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const graph = buildInitiativeAttackGraph(scenario, resolution);
    const layout = buildInitiativeAttackGraphLayout(graph);

    const segmentedNode = layout.nodes.find(
      (node) => node.nodeId === 'attack:party-1:1'
    );
    const dependencyNode = layout.nodes.find(
      (node) => node.nodeId === 'attack:party-2:1'
    );

    expect(layout.hasSegmentBand).toBe(true);
    expect(segmentedNode).toBeDefined();
    expect(dependencyNode).toBeDefined();
    expect(segmentedNode?.y).toBeLessThan(layout.segmentBandBottomY);
    expect(dependencyNode?.y).toBeGreaterThanOrEqual(layout.dependencyBandTopY);
    expect(layout.segmentBandBottomY).toBeLessThan(layout.dependencyBandTopY);
  });
});

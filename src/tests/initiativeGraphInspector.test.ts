import {
  buildInitiativeGraphInspectorModel,
  buildInitiativeGraphEnabledNodeIds,
  getNextInitiativeGraphReadyNodeIdAfterResolving,
} from '../helpers/initiative/graphInspector';
import { resolveInitiativeDraft } from '../helpers/initiative/resolvedRound';
import type {
  InitiativeAttackGraph,
  InitiativeAttackNode,
} from '../types/initiative';

const createNode = (id: string, segment?: number): InitiativeAttackNode => ({
  id,
  combatantId: id,
  routineId: `${id}:routine`,
  componentId: `${id}:component`,
  side: 'party',
  attackNumber: 1,
  label: 'action',
  source: 'routine-component',
  kind: 'attack',
  ...(segment === undefined ? {} : { segment }),
});

describe('initiative graph inspector helpers', () => {
  test('holds later segment nodes until earlier segment nodes are resolved', () => {
    const graph: InitiativeAttackGraph = {
      nodes: [
        createNode('unsegmented-blocker'),
        createNode('segment-four', 4),
        createNode('segment-seven', 7),
      ],
      edges: [
        {
          fromNodeId: 'unsegmented-blocker',
          toNodeId: 'segment-four',
          reasons: ['action-sequence'],
        },
      ],
      layers: [],
      simultaneousGroups: [],
    };

    expect(
      Array.from(buildInitiativeGraphEnabledNodeIds(graph, {})).sort()
    ).toEqual(['unsegmented-blocker']);

    expect(
      Array.from(
        buildInitiativeGraphEnabledNodeIds(graph, {
          'unsegmented-blocker': 'resolved',
        })
      ).sort()
    ).toEqual(['segment-four']);

    expect(
      Array.from(
        buildInitiativeGraphEnabledNodeIds(graph, {
          'unsegmented-blocker': 'resolved',
          'segment-four': 'resolved',
        })
      ).sort()
    ).toEqual(['segment-seven']);
  });

  test('keeps the selected ready-list index when choosing the next flow node', () => {
    const graph: InitiativeAttackGraph = {
      nodes: [createNode('first'), createNode('second'), createNode('third')],
      edges: [],
      layers: [],
      simultaneousGroups: [],
    };

    expect(
      getNextInitiativeGraphReadyNodeIdAfterResolving(graph, {}, 'second')
    ).toBe('third');
  });

  test('moves to the previous ready-list index when resolving the last flow node', () => {
    const graph: InitiativeAttackGraph = {
      nodes: [createNode('first'), createNode('second'), createNode('third')],
      edges: [],
      layers: [],
      simultaneousGroups: [],
    };

    expect(
      getNextInitiativeGraphReadyNodeIdAfterResolving(graph, {}, 'third')
    ).toBe('second');
  });

  test('returns no next flow node when resolving the final node', () => {
    const graph: InitiativeAttackGraph = {
      nodes: [createNode('only')],
      edges: [],
      layers: [],
      simultaneousGroups: [],
    };

    expect(
      getNextInitiativeGraphReadyNodeIdAfterResolving(graph, {}, 'only')
    ).toBeUndefined();
  });

  test('explains spell interruption when the caster is marked as losing initiative', () => {
    const resolvedRound = resolveInitiativeDraft({
      label: 'Slow Caster',
      partyInitiative: 2,
      enemyInitiative: 6,
      party: [
        {
          combatantKey: 5,
          name: 'Astrid',
          declaredAction: 'magical-device',
          actionLabel: 'Spiritual Hammer',
          weaponId: 17,
          targetCombatantKeys: [25],
        },
      ],
      enemies: [
        {
          combatantKey: 25,
          name: 'Yeenoghu',
          declaredAction: 'spell-casting',
          actionLabel: 'Color Spray',
          initiativeTiming: 'loses-initiative',
          castingSegments: 1,
          weaponId: 1,
          targetCombatantKeys: [5],
        },
      ],
    });

    const model = buildInitiativeGraphInspectorModel(
      resolvedRound,
      'spell-completion:enemy-25',
      {}
    );

    if (!model) {
      throw new Error('Expected spell completion inspector model');
    }

    const interruptingAttack = model.incoming.find(
      (incoming) => incoming.nodeId === 'attack:party-5:1'
    );

    expect(interruptingAttack?.explanation).toContain(
      "Yeenoghu's Color Spray (Cast spell) is marked loses initiative."
    );
    expect(interruptingAttack?.explanation).toContain(
      'That timing override is why Astrid can attack before the spell completes'
    );
  });

  test('explains targetless charge movement as non-attacking movement', () => {
    const resolvedRound = resolveInitiativeDraft({
      label: 'Targetless Charge',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [],
      enemies: [
        {
          combatantKey: 3,
          name: 'Flesh Golem',
          declaredAction: 'charge',
          movementRate: 8,
          actionDistanceInches: 8,
          weaponId: 1,
          targetCombatantKeys: [],
        },
      ],
    });

    const model = buildInitiativeGraphInspectorModel(
      resolvedRound,
      'movement:enemy-3',
      {}
    );

    if (!model) {
      throw new Error('Expected targetless charge movement inspector model');
    }

    expect(model.whyHere).toEqual(
      expect.arrayContaining([
        'Flesh Golem finishes targetless charge movement of 8" on segment 5. This uses charge movement at MV 8" and does not create a same-round charge attack because no target was declared.',
      ])
    );
  });
});

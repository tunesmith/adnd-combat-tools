import { buildInitiativeGraphEnabledNodeIds } from '../helpers/initiative/graphInspector';
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
});

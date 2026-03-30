import type { InitiativeAttackGraph } from '../../types/initiative';

interface InitiativeAttackGraphLayoutNode {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface InitiativeAttackGraphLayoutEdge {
  fromNodeId: string;
  toNodeId: string;
  path: string;
}

interface InitiativeAttackGraphLayout {
  width: number;
  height: number;
  nodes: InitiativeAttackGraphLayoutNode[];
  edges: InitiativeAttackGraphLayoutEdge[];
}

const HORIZONTAL_PADDING = 32;
const VERTICAL_PADDING = 24;
const NODE_WIDTH = 184;
const NODE_HEIGHT = 68;
const LAYER_GAP = 120;
const ROW_GAP = 22;

const getContentHeight = (nodeCount: number): number =>
  nodeCount > 0 ? nodeCount * NODE_HEIGHT + (nodeCount - 1) * ROW_GAP : 0;

export const buildInitiativeAttackGraphLayout = (
  graph: InitiativeAttackGraph
): InitiativeAttackGraphLayout => {
  const maxLayerSize = graph.layers.reduce(
    (max, layer) => Math.max(max, layer.length),
    0
  );
  const maxContentHeight = getContentHeight(maxLayerSize);
  const nodeLayoutById = new Map<string, InitiativeAttackGraphLayoutNode>();

  graph.layers.forEach((layer, layerIndex) => {
    const layerHeight = getContentHeight(layer.length);
    const startY =
      VERTICAL_PADDING + Math.max((maxContentHeight - layerHeight) / 2, 0);

    layer.forEach((nodeId, nodeIndex) => {
      nodeLayoutById.set(nodeId, {
        nodeId,
        x: HORIZONTAL_PADDING + layerIndex * (NODE_WIDTH + LAYER_GAP),
        y: startY + nodeIndex * (NODE_HEIGHT + ROW_GAP),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });
  });

  const nodes = graph.nodes.flatMap((node) => {
    const layoutNode = nodeLayoutById.get(node.id);
    return layoutNode ? [layoutNode] : [];
  });

  const edges = graph.edges.flatMap((edge) => {
    const fromNode = nodeLayoutById.get(edge.fromNodeId);
    const toNode = nodeLayoutById.get(edge.toNodeId);

    if (!fromNode || !toNode) {
      return [];
    }

    const startX = fromNode.x + fromNode.width;
    const startY = fromNode.y + fromNode.height / 2;
    const endX = toNode.x;
    const endY = toNode.y + toNode.height / 2;
    const controlOffset = Math.max((endX - startX) / 2, 42);

    return [
      {
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        path: `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${
          endX - controlOffset
        } ${endY}, ${endX} ${endY}`,
      },
    ];
  });

  return {
    width:
      HORIZONTAL_PADDING * 2 +
      graph.layers.length * NODE_WIDTH +
      Math.max(graph.layers.length - 1, 0) * LAYER_GAP,
    height: VERTICAL_PADDING * 2 + maxContentHeight,
    nodes,
    edges,
  };
};

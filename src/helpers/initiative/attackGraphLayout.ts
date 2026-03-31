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

interface InitiativeAttackGraphLayoutSegmentColumn {
  segment: number;
  x: number;
  centerX: number;
}

interface InitiativeAttackGraphLayout {
  width: number;
  height: number;
  headerLabelY: number;
  headerLineY: number;
  guideBottomY: number;
  segmentColumns: InitiativeAttackGraphLayoutSegmentColumn[];
  nodes: InitiativeAttackGraphLayoutNode[];
  edges: InitiativeAttackGraphLayoutEdge[];
}

const HORIZONTAL_PADDING = 32;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 24;
const SEGMENT_HEADER_HEIGHT = 48;
const CONTENT_TOP_GAP = 20;
const NODE_WIDTH = 216;
const NODE_HEIGHT = 92;
const COLUMN_GAP = 28;
const ROW_GAP = 22;
const BAND_GAP = 28;
const SEGMENT_COUNT = 10;

const getContentHeight = (nodeCount: number): number =>
  nodeCount > 0 ? nodeCount * NODE_HEIGHT + (nodeCount - 1) * ROW_GAP : 0;

const getColumnPitch = (): number => NODE_WIDTH + COLUMN_GAP;

const getSegmentColumnX = (segment: number): number =>
  HORIZONTAL_PADDING + (segment - 1) * getColumnPitch();

const getDependencyColumnX = (layerIndex: number): number =>
  HORIZONTAL_PADDING + (layerIndex + 0.5) * getColumnPitch();

const getEdgePath = (
  fromNode: InitiativeAttackGraphLayoutNode,
  toNode: InitiativeAttackGraphLayoutNode
): string => {
  if (fromNode.x === toNode.x) {
    const centerX = fromNode.x + fromNode.width / 2;
    const startY = fromNode.y + fromNode.height;
    const endY = toNode.y;
    const controlOffset = Math.max((endY - startY) / 2, 26);

    return `M ${centerX} ${startY} C ${centerX} ${
      startY + controlOffset
    }, ${centerX} ${endY - controlOffset}, ${centerX} ${endY}`;
  }

  const isForward = fromNode.x < toNode.x;
  const startX = isForward ? fromNode.x + fromNode.width : fromNode.x;
  const endX = isForward ? toNode.x : toNode.x + toNode.width;
  const startY = fromNode.y + fromNode.height / 2;
  const endY = toNode.y + toNode.height / 2;
  const controlOffset = Math.max(Math.abs(endX - startX) / 2, 42);

  return `M ${startX} ${startY} C ${
    startX + (isForward ? controlOffset : -controlOffset)
  } ${startY}, ${
    endX - (isForward ? controlOffset : -controlOffset)
  } ${endY}, ${endX} ${endY}`;
};

export const buildInitiativeAttackGraphLayout = (
  graph: InitiativeAttackGraph
): InitiativeAttackGraphLayout => {
  const nodeLayoutById = new Map<string, InitiativeAttackGraphLayoutNode>();
  const graphNodeById = new Map(
    graph.nodes.map((graphNode) => [graphNode.id, graphNode] as const)
  );
  const dependencyStackCountByKey = new Map<string, number>();
  const segmentStackCountByKey = new Map<string, number>();
  const dependencyPositionedNodes: Array<{
    nodeId: string;
    x: number;
    stackIndex: number;
  }> = [];
  const segmentedPositionedNodes: Array<{
    nodeId: string;
    x: number;
    stackIndex: number;
  }> = [];

  graph.layers.forEach((layer, layerIndex) => {
    layer.forEach((nodeId) => {
      const node = graphNodeById.get(nodeId);

      if (!node) {
        return;
      }

      if (node.segment !== undefined) {
        const columnKey = `segment:${node.segment}`;
        const stackIndex = segmentStackCountByKey.get(columnKey) || 0;
        segmentStackCountByKey.set(columnKey, stackIndex + 1);
        segmentedPositionedNodes.push({
          nodeId,
          x: getSegmentColumnX(node.segment),
          stackIndex,
        });
        return;
      }

      const columnKey = `dependency:${layerIndex}`;
      const stackIndex = dependencyStackCountByKey.get(columnKey) || 0;
      dependencyStackCountByKey.set(columnKey, stackIndex + 1);
      dependencyPositionedNodes.push({
        nodeId,
        x: getDependencyColumnX(layerIndex),
        stackIndex,
      });
    });
  });

  const maxDependencyStackSize = Math.max(
    0,
    ...Array.from(dependencyStackCountByKey.values(), (count) => count)
  );
  const maxSegmentStackSize = Math.max(
    0,
    ...Array.from(segmentStackCountByKey.values(), (count) => count)
  );
  const dependencyContentHeight = getContentHeight(maxDependencyStackSize);
  const segmentContentHeight = getContentHeight(maxSegmentStackSize);
  const contentTopY = TOP_PADDING + SEGMENT_HEADER_HEIGHT + CONTENT_TOP_GAP;
  const segmentTopY =
    contentTopY +
    dependencyContentHeight +
    (dependencyContentHeight > 0 && segmentContentHeight > 0 ? BAND_GAP : 0);
  const maxContentBottomY =
    (dependencyContentHeight > 0 ? contentTopY + dependencyContentHeight : 0) >
    (segmentContentHeight > 0 ? segmentTopY + segmentContentHeight : 0)
      ? contentTopY + dependencyContentHeight
      : segmentTopY + segmentContentHeight;

  dependencyPositionedNodes.forEach((positionedNode) => {
    nodeLayoutById.set(positionedNode.nodeId, {
      nodeId: positionedNode.nodeId,
      x: positionedNode.x,
      y: contentTopY + positionedNode.stackIndex * (NODE_HEIGHT + ROW_GAP),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  segmentedPositionedNodes.forEach((positionedNode) => {
    nodeLayoutById.set(positionedNode.nodeId, {
      nodeId: positionedNode.nodeId,
      x: positionedNode.x,
      y: segmentTopY + positionedNode.stackIndex * (NODE_HEIGHT + ROW_GAP),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
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

    return [
      {
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        path: getEdgePath(fromNode, toNode),
      },
    ];
  });

  const rightmostNodeX = Math.max(
    HORIZONTAL_PADDING,
    ...nodes.map((node) => node.x)
  );
  const segmentColumns = Array.from({ length: SEGMENT_COUNT }, (_, index) => {
    const segment = index + 1;
    const x = getSegmentColumnX(segment);

    return {
      segment,
      x,
      centerX: x + NODE_WIDTH / 2,
    };
  });
  const headerLineY = TOP_PADDING + SEGMENT_HEADER_HEIGHT;

  return {
    width:
      Math.max(
        getSegmentColumnX(SEGMENT_COUNT),
        rightmostNodeX,
        HORIZONTAL_PADDING
      ) +
      NODE_WIDTH +
      HORIZONTAL_PADDING,
    height: maxContentBottomY + BOTTOM_PADDING,
    headerLabelY: TOP_PADDING + 20,
    headerLineY,
    guideBottomY: maxContentBottomY,
    segmentColumns,
    nodes,
    edges,
  };
};

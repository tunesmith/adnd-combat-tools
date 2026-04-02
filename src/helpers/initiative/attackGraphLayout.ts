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
  startX: number;
  endX: number;
}

interface InitiativeAttackGraphLayout {
  width: number;
  height: number;
  hasSegmentBand: boolean;
  headerLabelY: number;
  headerLineY: number;
  segmentBandTopY: number;
  segmentBandBottomY: number;
  dependencyBandTopY: number;
  segmentBoundaryXs: number[];
  segmentColumns: InitiativeAttackGraphLayoutSegmentColumn[];
  nodes: InitiativeAttackGraphLayoutNode[];
  edges: InitiativeAttackGraphLayoutEdge[];
}

const HORIZONTAL_PADDING = 32;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 24;
const SEGMENT_HEADER_HEIGHT = 42;
const CONTENT_TOP_GAP = 14;
const NODE_WIDTH = 190;
const NODE_HEIGHT = 72;
const DEPENDENCY_COLUMN_GAP = 28;
const SEGMENT_LANE_GAP = 18;
const ROW_GAP = 18;
const BAND_GAP = 28;
const SEGMENT_COUNT = 10;

const getContentHeight = (nodeCount: number): number =>
  nodeCount > 0 ? nodeCount * NODE_HEIGHT + (nodeCount - 1) * ROW_GAP : 0;

const getDependencyColumnPitch = (): number =>
  NODE_WIDTH + DEPENDENCY_COLUMN_GAP;

const getSegmentLaneWidth = (): number => NODE_WIDTH + SEGMENT_LANE_GAP;

const getSegmentLaneStartX = (segment: number): number =>
  HORIZONTAL_PADDING + (segment - 1) * getSegmentLaneWidth();

const getSegmentNodeX = (segment: number): number =>
  getSegmentLaneStartX(segment) + (getSegmentLaneWidth() - NODE_WIDTH) / 2;

const getDependencyColumnX = (layerIndex: number): number =>
  HORIZONTAL_PADDING + layerIndex * getDependencyColumnPitch();

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
          x: getSegmentNodeX(node.segment),
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
  const hasSegmentBand = segmentContentHeight > 0;
  const segmentHeaderHeight = hasSegmentBand ? SEGMENT_HEADER_HEIGHT : 0;
  const segmentTopY =
    TOP_PADDING + segmentHeaderHeight + (hasSegmentBand ? CONTENT_TOP_GAP : 0);
  const segmentBandTopY = hasSegmentBand
    ? TOP_PADDING + SEGMENT_HEADER_HEIGHT
    : 0;
  const segmentBandBottomY = hasSegmentBand
    ? segmentTopY + segmentContentHeight
    : segmentBandTopY;
  const dependencyTopY =
    hasSegmentBand && dependencyContentHeight > 0
      ? segmentBandBottomY + BAND_GAP
      : TOP_PADDING + 12;
  const dependencyBandTopY = dependencyTopY;
  const maxContentBottomY = Math.max(
    hasSegmentBand ? segmentBandBottomY : 0,
    dependencyContentHeight > 0
      ? dependencyTopY + dependencyContentHeight
      : dependencyTopY
  );

  dependencyPositionedNodes.forEach((positionedNode) => {
    nodeLayoutById.set(positionedNode.nodeId, {
      nodeId: positionedNode.nodeId,
      x: positionedNode.x,
      y: dependencyTopY + positionedNode.stackIndex * (NODE_HEIGHT + ROW_GAP),
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
    const startX = getSegmentLaneStartX(segment);
    const endX = startX + getSegmentLaneWidth();
    const x = getSegmentNodeX(segment);

    return {
      segment,
      x,
      centerX: startX + getSegmentLaneWidth() / 2,
      startX,
      endX,
    };
  });
  const segmentBoundaryXs = hasSegmentBand
    ? [
        ...segmentColumns.map((column) => column.startX),
        segmentColumns[segmentColumns.length - 1]?.endX || HORIZONTAL_PADDING,
      ]
    : [];
  const headerLineY = segmentBandTopY;

  return {
    width:
      Math.max(
        segmentColumns[segmentColumns.length - 1]?.endX || HORIZONTAL_PADDING,
        rightmostNodeX + NODE_WIDTH,
        HORIZONTAL_PADDING
      ) + HORIZONTAL_PADDING,
    height: maxContentBottomY + BOTTOM_PADDING,
    hasSegmentBand,
    headerLabelY: TOP_PADDING + 20,
    headerLineY,
    segmentBandTopY,
    segmentBandBottomY,
    dependencyBandTopY,
    segmentBoundaryXs,
    segmentColumns,
    nodes,
    edges,
  };
};

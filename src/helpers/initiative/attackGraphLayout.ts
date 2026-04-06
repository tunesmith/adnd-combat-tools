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
  reasons: InitiativeAttackGraph['edges'][number]['reasons'];
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

interface InitiativeAttackGraphLayoutNodeSize {
  width: number;
  height: number;
}

interface InitiativeAttackGraphLayoutSegmentLane {
  segment: number;
  startX: number;
  width: number;
  endX: number;
  centerX: number;
  nodeColumnXs: number[];
}

const HORIZONTAL_PADDING = 32;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 24;
const SEGMENT_HEADER_HEIGHT = 42;
const CONTENT_TOP_GAP = 14;
const NODE_COLUMN_WIDTH = 132;
const NODE_HEIGHT = 66;
const SEGMENT_BAND_BOTTOM_PADDING = 12;
const DEPENDENCY_COLUMN_GAP = 28;
const SEGMENT_EMPTY_LANE_WIDTH = 96;
const SEGMENT_LANE_PADDING = 18;
const SEGMENT_SUBCOLUMN_GAP = 18;
const ROW_GAP = 16;
const BAND_GAP = 28;
const SEGMENT_COUNT = 10;
const NORMAL_ARROWHEAD_EXTENSION = 6;
const SPELL_ARROWHEAD_EXTENSION = 10;

const getContentHeight = (rowCount: number): number =>
  rowCount > 0 ? rowCount * NODE_HEIGHT + (rowCount - 1) * ROW_GAP : 0;

const getDependencyColumnPitch = (): number =>
  NODE_COLUMN_WIDTH + DEPENDENCY_COLUMN_GAP;

const getDependencyColumnX = (layerIndex: number): number =>
  HORIZONTAL_PADDING + layerIndex * getDependencyColumnPitch();

const getEdgePath = (
  fromNode: InitiativeAttackGraphLayoutNode,
  toNode: InitiativeAttackGraphLayoutNode,
  reasons: InitiativeAttackGraph['edges'][number]['reasons']
): string => {
  const endOffset = reasons.includes('spell-casting')
    ? SPELL_ARROWHEAD_EXTENSION
    : NORMAL_ARROWHEAD_EXTENSION;
  const fromCenterX = fromNode.x + fromNode.width / 2;
  const toCenterX = toNode.x + toNode.width / 2;
  const fromCenterY = fromNode.y + fromNode.height / 2;
  const toCenterY = toNode.y + toNode.height / 2;
  const horizontalOverlap =
    Math.min(fromNode.x + fromNode.width, toNode.x + toNode.width) -
    Math.max(fromNode.x, toNode.x);

  if (
    Math.abs(fromCenterX - toCenterX) < 8 ||
    horizontalOverlap > Math.min(fromNode.width, toNode.width) * 0.45
  ) {
    const centerX = (fromCenterX + toCenterX) / 2;
    const startY = fromNode.y + fromNode.height;
    const endY =
      startY <= toNode.y ? toNode.y - endOffset : toNode.y + endOffset;
    return `M ${centerX} ${startY} L ${centerX} ${endY}`;
  }

  if (Math.abs(fromCenterY - toCenterY) < 8) {
    const isForward = fromNode.x < toNode.x;
    const startX = isForward ? fromNode.x + fromNode.width : fromNode.x;
    const endX = isForward
      ? toNode.x - endOffset
      : toNode.x + toNode.width + endOffset;

    return `M ${startX} ${fromCenterY} L ${endX} ${toCenterY}`;
  }

  const isForward = fromNode.x < toNode.x;
  const startX = isForward ? fromNode.x + fromNode.width : fromNode.x;
  const endX = isForward
    ? toNode.x - endOffset
    : toNode.x + toNode.width + endOffset;
  const startY = fromCenterY;
  const endY = toCenterY;
  const controlOffset = Math.max(Math.abs(endX - startX) / 2, 42);

  return `M ${startX} ${startY} C ${
    startX + (isForward ? controlOffset : -controlOffset)
  } ${startY}, ${
    endX - (isForward ? controlOffset : -controlOffset)
  } ${endY}, ${endX} ${endY}`;
};

const buildSegmentLanes = (
  graph: InitiativeAttackGraph,
  graphNodeById: Map<string, typeof graph.nodes[number]>,
  layerIndexByNodeId: Map<string, number>
): InitiativeAttackGraphLayoutSegmentLane[] => {
  const nodesBySegment = new Map<number, string[]>();

  graph.nodes.forEach((node) => {
    if (node.segment === undefined) {
      return;
    }

    const existing = nodesBySegment.get(node.segment) || [];
    existing.push(node.id);
    nodesBySegment.set(node.segment, existing);
  });

  let cursorX = HORIZONTAL_PADDING;

  return Array.from({ length: SEGMENT_COUNT }, (_, index) => {
    const segment = index + 1;
    const nodeIds = nodesBySegment.get(segment) || [];
    const sameSegmentEdges = graph.edges.filter((edge) => {
      const fromNode = graphNodeById.get(edge.fromNodeId);
      const toNode = graphNodeById.get(edge.toNodeId);

      return fromNode?.segment === segment && toNode?.segment === segment;
    });

    const adjacency = new Map<string, string[]>();
    nodeIds.forEach((nodeId) => adjacency.set(nodeId, []));
    sameSegmentEdges.forEach((edge) => {
      adjacency.get(edge.fromNodeId)?.push(edge.toNodeId);
      adjacency.get(edge.toNodeId)?.push(edge.fromNodeId);
    });

    const orderedNodeIds = [...nodeIds].sort((leftNodeId, rightNodeId) => {
      const leftLayer =
        layerIndexByNodeId.get(leftNodeId) ?? Number.MAX_SAFE_INTEGER;
      const rightLayer =
        layerIndexByNodeId.get(rightNodeId) ?? Number.MAX_SAFE_INTEGER;

      if (leftLayer !== rightLayer) {
        return leftLayer - rightLayer;
      }

      return leftNodeId.localeCompare(rightNodeId);
    });

    const visited = new Set<string>();
    const components: string[][] = [];

    orderedNodeIds.forEach((nodeId) => {
      if (visited.has(nodeId)) {
        return;
      }

      const stack = [nodeId];
      const component: string[] = [];
      visited.add(nodeId);

      while (stack.length > 0) {
        const currentNodeId = stack.pop();

        if (!currentNodeId) {
          continue;
        }

        component.push(currentNodeId);
        (adjacency.get(currentNodeId) || []).forEach((neighborNodeId) => {
          if (visited.has(neighborNodeId)) {
            return;
          }

          visited.add(neighborNodeId);
          stack.push(neighborNodeId);
        });
      }

      components.push(component);
    });

    const contentWidth =
      components.length > 0
        ? components.length * NODE_COLUMN_WIDTH +
          (components.length - 1) * SEGMENT_SUBCOLUMN_GAP
        : 0;
    const width = Math.max(
      SEGMENT_EMPTY_LANE_WIDTH,
      components.length > 0
        ? contentWidth + SEGMENT_LANE_PADDING * 2
        : SEGMENT_EMPTY_LANE_WIDTH
    );
    const contentStartX =
      cursorX + Math.max((width - contentWidth) / 2, SEGMENT_LANE_PADDING);
    const nodeColumnXs = components.map(
      (_component, componentIndex) =>
        contentStartX +
        componentIndex * (NODE_COLUMN_WIDTH + SEGMENT_SUBCOLUMN_GAP)
    );
    const lane = {
      segment,
      startX: cursorX,
      width,
      endX: cursorX + width,
      centerX: cursorX + width / 2,
      nodeColumnXs,
    };

    cursorX = lane.endX;
    return lane;
  });
};

export const buildInitiativeAttackGraphLayout = (
  graph: InitiativeAttackGraph,
  nodeSizeById?: Record<string, InitiativeAttackGraphLayoutNodeSize>
): InitiativeAttackGraphLayout => {
  const nodeLayoutById = new Map<string, InitiativeAttackGraphLayoutNode>();
  const graphNodeById = new Map(
    graph.nodes.map((graphNode) => [graphNode.id, graphNode] as const)
  );
  const dependencyStackCountByKey = new Map<string, number>();
  const dependencyPositionedNodes: Array<{
    nodeId: string;
    x: number;
    stackIndex: number;
  }> = [];
  const layerIndexByNodeId = new Map<string, number>();

  graph.layers.forEach((layer, layerIndex) => {
    layer.forEach((nodeId) => {
      layerIndexByNodeId.set(nodeId, layerIndex);
    });
  });

  const segmentLanes = buildSegmentLanes(
    graph,
    graphNodeById,
    layerIndexByNodeId
  );
  const segmentedNodesBySegment = new Map<number, string[]>();

  graph.nodes.forEach((node) => {
    if (node.segment === undefined) {
      return;
    }

    const existing = segmentedNodesBySegment.get(node.segment) || [];
    existing.push(node.id);
    segmentedNodesBySegment.set(node.segment, existing);
  });

  const segmentRowCount = Math.max(
    0,
    ...Array.from(segmentedNodesBySegment.values(), (nodeIds) => {
      const uniqueLayerIndices = new Set(
        nodeIds.map((nodeId) => layerIndexByNodeId.get(nodeId) ?? 0)
      );

      return uniqueLayerIndices.size;
    })
  );
  const segmentContentHeight = getContentHeight(segmentRowCount);
  const hasSegmentBand = segmentContentHeight > 0;
  const segmentHeaderHeight = hasSegmentBand ? SEGMENT_HEADER_HEIGHT : 0;
  const segmentTopY =
    TOP_PADDING + segmentHeaderHeight + (hasSegmentBand ? CONTENT_TOP_GAP : 0);
  const segmentBandTopY = hasSegmentBand
    ? TOP_PADDING + SEGMENT_HEADER_HEIGHT
    : 0;
  const segmentBandBottomY = hasSegmentBand
    ? segmentTopY + segmentContentHeight + SEGMENT_BAND_BOTTOM_PADDING
    : segmentBandTopY;

  graph.layers.forEach((layer, layerIndex) => {
    layer.forEach((nodeId) => {
      const node = graphNodeById.get(nodeId);

      if (!node || node.segment !== undefined) {
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

  const dependencyContentHeight = getContentHeight(
    Math.max(
      0,
      ...Array.from(dependencyStackCountByKey.values(), (count) => count)
    )
  );
  const dependencyTopY =
    hasSegmentBand && dependencyContentHeight > 0
      ? segmentBandBottomY + BAND_GAP
      : TOP_PADDING + 12;
  const dependencyBandTopY = dependencyTopY;
  const segmentRowIndexByKey = new Map<string, number>();

  segmentLanes.forEach((segmentLane) => {
    const nodeIds = segmentedNodesBySegment.get(segmentLane.segment) || [];
    const uniqueLayerIndices = Array.from(
      new Set(nodeIds.map((nodeId) => layerIndexByNodeId.get(nodeId) ?? 0))
    ).sort((leftIndex, rightIndex) => leftIndex - rightIndex);

    uniqueLayerIndices.forEach((layerIndex, rowIndex) => {
      segmentRowIndexByKey.set(
        `${segmentLane.segment}:${layerIndex}`,
        rowIndex
      );
    });

    const sameSegmentEdges = graph.edges.filter((edge) => {
      const fromNode = graphNodeById.get(edge.fromNodeId);
      const toNode = graphNodeById.get(edge.toNodeId);

      return (
        fromNode?.segment === segmentLane.segment &&
        toNode?.segment === segmentLane.segment
      );
    });
    const adjacency = new Map<string, string[]>();
    nodeIds.forEach((nodeId) => adjacency.set(nodeId, []));
    sameSegmentEdges.forEach((edge) => {
      adjacency.get(edge.fromNodeId)?.push(edge.toNodeId);
      adjacency.get(edge.toNodeId)?.push(edge.fromNodeId);
    });

    const orderedNodeIds = [...nodeIds].sort((leftNodeId, rightNodeId) => {
      const leftLayer =
        layerIndexByNodeId.get(leftNodeId) ?? Number.MAX_SAFE_INTEGER;
      const rightLayer =
        layerIndexByNodeId.get(rightNodeId) ?? Number.MAX_SAFE_INTEGER;

      if (leftLayer !== rightLayer) {
        return leftLayer - rightLayer;
      }

      return leftNodeId.localeCompare(rightNodeId);
    });
    const visited = new Set<string>();
    const componentIndexByNodeId = new Map<string, number>();
    let componentIndex = 0;

    orderedNodeIds.forEach((nodeId) => {
      if (visited.has(nodeId)) {
        return;
      }

      const stack = [nodeId];
      visited.add(nodeId);

      while (stack.length > 0) {
        const currentNodeId = stack.pop();

        if (!currentNodeId) {
          continue;
        }

        componentIndexByNodeId.set(currentNodeId, componentIndex);
        (adjacency.get(currentNodeId) || []).forEach((neighborNodeId) => {
          if (visited.has(neighborNodeId)) {
            return;
          }

          visited.add(neighborNodeId);
          stack.push(neighborNodeId);
        });
      }

      componentIndex += 1;
    });

    nodeIds.forEach((nodeId) => {
      const node = graphNodeById.get(nodeId);
      if (!node) {
        return;
      }

      const layerIndex = layerIndexByNodeId.get(nodeId) ?? 0;
      const rowIndex =
        segmentRowIndexByKey.get(`${segmentLane.segment}:${layerIndex}`) ?? 0;
      const localColumnIndex = componentIndexByNodeId.get(nodeId) ?? 0;
      const nodeSize = nodeSizeById?.[nodeId];
      const width = nodeSize?.width ?? NODE_COLUMN_WIDTH;
      const height = nodeSize?.height ?? NODE_HEIGHT;
      const columnX =
        segmentLane.nodeColumnXs[localColumnIndex] ??
        segmentLane.startX + SEGMENT_LANE_PADDING;
      const x = columnX + (NODE_COLUMN_WIDTH - width) / 2;

      nodeLayoutById.set(nodeId, {
        nodeId,
        x,
        y: segmentTopY + rowIndex * (NODE_HEIGHT + ROW_GAP),
        width,
        height,
      });
    });
  });

  dependencyPositionedNodes.forEach((positionedNode) => {
    const nodeSize = nodeSizeById?.[positionedNode.nodeId];
    const width = nodeSize?.width ?? NODE_COLUMN_WIDTH;
    const height = nodeSize?.height ?? NODE_HEIGHT;
    nodeLayoutById.set(positionedNode.nodeId, {
      nodeId: positionedNode.nodeId,
      x: positionedNode.x + (NODE_COLUMN_WIDTH - width) / 2,
      y: dependencyTopY + positionedNode.stackIndex * (NODE_HEIGHT + ROW_GAP),
      width,
      height,
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
        path: getEdgePath(fromNode, toNode, edge.reasons),
        reasons: edge.reasons,
      },
    ];
  });

  const rightmostNodeX = Math.max(
    HORIZONTAL_PADDING,
    ...nodes.map((node) => node.x)
  );
  const segmentColumns = segmentLanes.map((segmentLane) => ({
    segment: segmentLane.segment,
    x:
      segmentLane.nodeColumnXs[0] ??
      segmentLane.centerX - NODE_COLUMN_WIDTH / 2,
    centerX: segmentLane.centerX,
    startX: segmentLane.startX,
    endX: segmentLane.endX,
  }));
  const segmentBoundaryXs = hasSegmentBand
    ? [
        ...segmentColumns.map((column) => column.startX),
        segmentColumns[segmentColumns.length - 1]?.endX || HORIZONTAL_PADDING,
      ]
    : [];
  const maxContentBottomY = Math.max(
    hasSegmentBand ? segmentBandBottomY : 0,
    dependencyContentHeight > 0
      ? dependencyTopY + dependencyContentHeight
      : dependencyTopY
  );
  const headerLineY = segmentBandTopY;
  const segmentBandWidth = hasSegmentBand
    ? segmentColumns[segmentColumns.length - 1]?.endX || HORIZONTAL_PADDING
    : HORIZONTAL_PADDING;

  return {
    width:
      Math.max(
        segmentBandWidth,
        rightmostNodeX +
          Math.max(...nodes.map((node) => node.width), NODE_COLUMN_WIDTH),
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

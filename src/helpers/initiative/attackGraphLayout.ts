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
  spellColumnCount: number;
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

const getSmallestAvailableRow = (usedRows: Set<number>): number => {
  let rowIndex = 0;

  while (usedRows.has(rowIndex)) {
    rowIndex += 1;
  }

  return rowIndex;
};

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
    const spellNodeIds = nodeIds.filter((nodeId) => {
      const node = graphNodeById.get(nodeId);
      return node?.kind === 'spell-start' || node?.kind === 'spell-completion';
    });
    const nonSpellNodeIds = nodeIds.filter((nodeId) => {
      const node = graphNodeById.get(nodeId);
      return node?.kind !== 'spell-start' && node?.kind !== 'spell-completion';
    });
    const sameSegmentEdges = graph.edges.filter((edge) => {
      const fromNode = graphNodeById.get(edge.fromNodeId);
      const toNode = graphNodeById.get(edge.toNodeId);

      return fromNode?.segment === segment && toNode?.segment === segment;
    });

    const adjacency = new Map<string, string[]>();
    nonSpellNodeIds.forEach((nodeId) => adjacency.set(nodeId, []));
    sameSegmentEdges.forEach((edge) => {
      if (!adjacency.has(edge.fromNodeId) || !adjacency.has(edge.toNodeId)) {
        return;
      }

      adjacency.get(edge.fromNodeId)?.push(edge.toNodeId);
      adjacency.get(edge.toNodeId)?.push(edge.fromNodeId);
    });

    const orderedNodeIds = [...nonSpellNodeIds].sort(
      (leftNodeId, rightNodeId) => {
        const leftLayer =
          layerIndexByNodeId.get(leftNodeId) ?? Number.MAX_SAFE_INTEGER;
        const rightLayer =
          layerIndexByNodeId.get(rightNodeId) ?? Number.MAX_SAFE_INTEGER;

        if (leftLayer !== rightLayer) {
          return leftLayer - rightLayer;
        }

        return leftNodeId.localeCompare(rightNodeId);
      }
    );

    const visited = new Set<string>();
    const spellColumnCount =
      segment === 1 &&
      spellNodeIds.some((nodeId) => {
        const node = graphNodeById.get(nodeId);
        return node?.kind === 'spell-completion';
      })
        ? 2
        : spellNodeIds.length > 0
        ? 1
        : 0;
    const components: string[][] = Array.from(
      { length: spellColumnCount },
      () => []
    );
    const componentIndexByNodeId = new Map<string, number>();

    spellNodeIds.forEach((nodeId) => {
      const node = graphNodeById.get(nodeId);
      const spellColumnIndex =
        spellColumnCount > 1 && node?.kind === 'spell-completion' ? 1 : 0;

      componentIndexByNodeId.set(nodeId, spellColumnIndex);
      components[spellColumnIndex]?.push(nodeId);
    });

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
      const componentIndex = components.length - 1;
      component.forEach((componentNodeId) => {
        componentIndexByNodeId.set(componentNodeId, componentIndex);
      });
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
      spellColumnCount,
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

  const spellChainRowIndexByNodeId = new Map<string, number>();
  graph.edges
    .filter((edge) => edge.reasons.includes('spell-casting'))
    .map((edge) => ({
      startNodeId: edge.fromNodeId,
      completionNodeId: edge.toNodeId,
      completionSegment:
        graphNodeById.get(edge.toNodeId)?.segment ?? Number.MAX_SAFE_INTEGER,
      startLayerIndex:
        layerIndexByNodeId.get(edge.fromNodeId) ?? Number.MAX_SAFE_INTEGER,
      completionLayerIndex:
        layerIndexByNodeId.get(edge.toNodeId) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((left, right) => {
      if (left.completionSegment !== right.completionSegment) {
        return left.completionSegment - right.completionSegment;
      }

      if (left.completionLayerIndex !== right.completionLayerIndex) {
        return left.completionLayerIndex - right.completionLayerIndex;
      }

      if (left.startLayerIndex !== right.startLayerIndex) {
        return left.startLayerIndex - right.startLayerIndex;
      }

      return left.startNodeId.localeCompare(right.startNodeId);
    })
    .forEach((spellChain, rowIndex) => {
      spellChainRowIndexByNodeId.set(spellChain.startNodeId, rowIndex);
      spellChainRowIndexByNodeId.set(spellChain.completionNodeId, rowIndex);
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
      const usedRows = new Set<number>();
      nodeIds.forEach((nodeId) => {
        const spellChainRowIndex = spellChainRowIndexByNodeId.get(nodeId);
        if (spellChainRowIndex !== undefined) {
          usedRows.add(spellChainRowIndex);
        }
      });

      const nonSpellLayerIndices = Array.from(
        new Set(
          nodeIds
            .filter((nodeId) => !spellChainRowIndexByNodeId.has(nodeId))
            .map((nodeId) => layerIndexByNodeId.get(nodeId) ?? 0)
        )
      ).sort((leftIndex, rightIndex) => leftIndex - rightIndex);

      nonSpellLayerIndices.forEach(() => {
        usedRows.add(getSmallestAvailableRow(usedRows));
      });

      return usedRows.size;
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
    const spellNodeIds = nodeIds.filter((nodeId) => {
      const node = graphNodeById.get(nodeId);
      return node?.kind === 'spell-start' || node?.kind === 'spell-completion';
    });
    const nonSpellNodeIds = nodeIds.filter((nodeId) => {
      const node = graphNodeById.get(nodeId);
      return node?.kind !== 'spell-start' && node?.kind !== 'spell-completion';
    });
    const usedRows = new Set<number>();
    nodeIds.forEach((nodeId) => {
      const spellChainRowIndex = spellChainRowIndexByNodeId.get(nodeId);
      if (spellChainRowIndex !== undefined) {
        segmentRowIndexByKey.set(nodeId, spellChainRowIndex);
        usedRows.add(spellChainRowIndex);
      }
    });

    const nonSpellLayerIndices = Array.from(
      new Set(
        nodeIds
          .filter((nodeId) => !spellChainRowIndexByNodeId.has(nodeId))
          .map((nodeId) => layerIndexByNodeId.get(nodeId) ?? 0)
      )
    ).sort((leftIndex, rightIndex) => leftIndex - rightIndex);

    nonSpellLayerIndices.forEach((layerIndex) => {
      const rowIndex = getSmallestAvailableRow(usedRows);
      usedRows.add(rowIndex);
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
    nonSpellNodeIds.forEach((nodeId) => adjacency.set(nodeId, []));
    sameSegmentEdges.forEach((edge) => {
      if (!adjacency.has(edge.fromNodeId) || !adjacency.has(edge.toNodeId)) {
        return;
      }

      adjacency.get(edge.fromNodeId)?.push(edge.toNodeId);
      adjacency.get(edge.toNodeId)?.push(edge.fromNodeId);
    });

    const orderedNodeIds = [...nonSpellNodeIds].sort(
      (leftNodeId, rightNodeId) => {
        const leftLayer =
          layerIndexByNodeId.get(leftNodeId) ?? Number.MAX_SAFE_INTEGER;
        const rightLayer =
          layerIndexByNodeId.get(rightNodeId) ?? Number.MAX_SAFE_INTEGER;

        if (leftLayer !== rightLayer) {
          return leftLayer - rightLayer;
        }

        return leftNodeId.localeCompare(rightNodeId);
      }
    );
    const visited = new Set<string>();
    const componentIndexByNodeId = new Map<string, number>();
    if (spellNodeIds.length > 0) {
      spellNodeIds.forEach((nodeId) => {
        const node = graphNodeById.get(nodeId);
        const spellColumnIndex =
          segmentLane.spellColumnCount > 1 && node?.kind === 'spell-completion'
            ? 1
            : 0;

        componentIndexByNodeId.set(nodeId, spellColumnIndex);
      });
    }
    let componentIndex = segmentLane.spellColumnCount;

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
        segmentRowIndexByKey.get(nodeId) ??
        segmentRowIndexByKey.get(`${segmentLane.segment}:${layerIndex}`) ??
        0;
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

  graph.layers.forEach((layer) => {
    layer.forEach((nodeId) => {
      const graphNode = graphNodeById.get(nodeId);
      const targetLayoutNode = nodeLayoutById.get(nodeId);

      if (
        !graphNode ||
        graphNode.segment !== undefined ||
        !targetLayoutNode
      ) {
        return;
      }

      let requiredX = targetLayoutNode.x;
      graph.edges.forEach((edge) => {
        if (edge.toNodeId !== nodeId) {
          return;
        }

        const sourceLayoutNode = nodeLayoutById.get(edge.fromNodeId);
        if (!sourceLayoutNode) {
          return;
        }

        requiredX = Math.max(
          requiredX,
          sourceLayoutNode.x + sourceLayoutNode.width + DEPENDENCY_COLUMN_GAP
        );
      });

      if (requiredX > targetLayoutNode.x) {
        targetLayoutNode.x = requiredX;
      }
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

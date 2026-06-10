import { useMemo, useState } from 'react';
import {
  buildInitiativeAttackGraphNodeDisplayById,
  getInitiativeAttackGraphNodeLineYs,
} from '../../helpers/initiative/attackGraphDisplay';
import { buildInitiativeAttackGraphLayout } from '../../helpers/initiative/attackGraphLayout';
import type { InitiativeResolvedRound } from '../../helpers/initiative/resolvedRound';
import type { InitiativeAttackNode } from '../../types/initiative';
import styles from './initiativeAttackGraphView.module.css';

interface InitiativeAttackGraphViewProps {
  resolvedRound: InitiativeResolvedRound;
  markerIdPrefix?: string;
  minHeightRem?: number;
  readableText?: boolean;
  showEmptySegmentLanes?: boolean;
}

const getGraphNodeFill = (side: InitiativeAttackNode['side']): string =>
  side === 'party' ? '#6c8d35' : '#a65042';

export const InitiativeAttackGraphView = ({
  resolvedRound,
  markerIdPrefix = 'initiative-dag',
  minHeightRem,
  readableText = false,
  showEmptySegmentLanes = false,
}: InitiativeAttackGraphViewProps) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | undefined>(
    undefined
  );
  const { attackGraph } = resolvedRound;
  const attackNodeById = useMemo(
    () => new Map(attackGraph.nodes.map((node) => [node.id, node] as const)),
    [attackGraph.nodes]
  );
  const graphNodeDisplayById = useMemo(
    () => buildInitiativeAttackGraphNodeDisplayById(resolvedRound),
    [resolvedRound]
  );
  const graphLayout = useMemo(
    () =>
      buildInitiativeAttackGraphLayout(
        attackGraph,
        Object.fromEntries(
          Object.entries(graphNodeDisplayById).map(([nodeId, display]) => [
            nodeId,
            {
              width: display.width,
              height: display.height,
            },
          ])
        ),
        { showEmptySegmentBand: showEmptySegmentLanes }
      ),
    [attackGraph, graphNodeDisplayById, showEmptySegmentLanes]
  );
  const arrowheadId = `${markerIdPrefix}-arrowhead`;
  const highlightedArrowheadId = `${markerIdPrefix}-arrowhead-highlighted`;
  const spellArrowheadId = `${markerIdPrefix}-arrowhead-spell`;
  const highlightedSpellArrowheadId = `${markerIdPrefix}-arrowhead-spell-highlighted`;

  if (attackGraph.nodes.length === 0) {
    return (
      <div className={styles['emptyGraph']}>
        Select targets or record structured actions to draw the initiative DAG.
      </div>
    );
  }

  return (
    <div
      className={[
        styles['graphViewport'],
        readableText ? styles['graphViewportReadable'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={minHeightRem ? { minHeight: `${minHeightRem}rem` } : undefined}
    >
      <div
        className={styles['graphCanvas']}
        data-graph-canvas={'true'}
        style={{
          width: graphLayout.width,
          height: graphLayout.height,
        }}
      >
        <svg
          className={styles['graphSvg']}
          viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
          width={graphLayout.width}
          height={graphLayout.height}
          aria-label={'Initiative precedence graph'}
          onMouseMove={(event) => {
            const target = event.target;

            if (!(target instanceof Element)) {
              return;
            }

            const nodeElement = target.closest('[data-graph-node="true"]');
            const nextHoveredNodeId =
              nodeElement?.getAttribute('data-graph-node-id') || undefined;

            setHoveredNodeId((previous) =>
              previous === nextHoveredNodeId ? previous : nextHoveredNodeId
            );
          }}
          onMouseLeave={() => setHoveredNodeId(undefined)}
        >
          <defs>
            <marker
              id={arrowheadId}
              viewBox={'0 0 10 10'}
              refX={'4'}
              refY={'5'}
              markerUnits={'userSpaceOnUse'}
              markerWidth={'8'}
              markerHeight={'8'}
              orient={'auto-start-reverse'}
            >
              <path
                d={'M 0 0 L 10 5 L 0 10 z'}
                className={styles['graphArrowhead']}
              />
            </marker>
            <marker
              id={highlightedArrowheadId}
              viewBox={'0 0 10 10'}
              refX={'4'}
              refY={'5'}
              markerUnits={'userSpaceOnUse'}
              markerWidth={'8'}
              markerHeight={'8'}
              orient={'auto-start-reverse'}
            >
              <path
                d={'M 0 0 L 10 5 L 0 10 z'}
                className={`${styles['graphArrowhead']} ${styles['graphArrowheadSelected']}`}
              />
            </marker>
            <marker
              id={spellArrowheadId}
              viewBox={'0 0 14 14'}
              refX={'4'}
              refY={'7'}
              markerUnits={'userSpaceOnUse'}
              markerWidth={'12'}
              markerHeight={'12'}
              orient={'auto-start-reverse'}
            >
              <path
                d={'M 0 0 L 14 7 L 0 14 z'}
                className={styles['graphArrowhead']}
              />
            </marker>
            <marker
              id={highlightedSpellArrowheadId}
              viewBox={'0 0 14 14'}
              refX={'4'}
              refY={'7'}
              markerUnits={'userSpaceOnUse'}
              markerWidth={'12'}
              markerHeight={'12'}
              orient={'auto-start-reverse'}
            >
              <path
                d={'M 0 0 L 14 7 L 0 14 z'}
                className={`${styles['graphArrowhead']} ${styles['graphArrowheadSelected']}`}
              />
            </marker>
          </defs>

          {graphLayout.hasSegmentBand ? (
            <>
              {graphLayout.segmentColumns.map((segmentColumn, columnIndex) => (
                <rect
                  key={`segment-lane-${segmentColumn.segment}`}
                  x={segmentColumn.startX}
                  y={graphLayout.headerLineY}
                  width={segmentColumn.endX - segmentColumn.startX}
                  height={
                    graphLayout.segmentBandBottomY - graphLayout.headerLineY
                  }
                  className={[
                    styles['graphSegmentLane'],
                    columnIndex % 2 === 0
                      ? styles['graphSegmentLaneEven']
                      : styles['graphSegmentLaneOdd'],
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              ))}
              <line
                x1={graphLayout.segmentBoundaryXs[0] || 0}
                y1={graphLayout.headerLineY}
                x2={
                  graphLayout.segmentBoundaryXs[
                    graphLayout.segmentBoundaryXs.length - 1
                  ] || 0
                }
                y2={graphLayout.headerLineY}
                className={styles['graphSegmentHeaderLine']}
              />
              <line
                x1={graphLayout.segmentBoundaryXs[0] || 0}
                y1={graphLayout.segmentBandBottomY}
                x2={
                  graphLayout.segmentBoundaryXs[
                    graphLayout.segmentBoundaryXs.length - 1
                  ] || 0
                }
                y2={graphLayout.segmentBandBottomY}
                className={styles['graphSegmentBandLine']}
              />
              {graphLayout.segmentColumns.map((segmentColumn) => (
                <text
                  key={`segment-column-${segmentColumn.segment}`}
                  x={segmentColumn.centerX}
                  y={graphLayout.headerLabelY}
                  textAnchor={'middle'}
                  className={styles['graphSegmentColumnLabel']}
                >
                  {segmentColumn.segment}
                </text>
              ))}
              {graphLayout.segmentBoundaryXs.map((boundaryX) => (
                <line
                  key={`segment-boundary-${boundaryX}`}
                  x1={boundaryX}
                  y1={graphLayout.headerLineY}
                  x2={boundaryX}
                  y2={graphLayout.segmentBandBottomY}
                  className={styles['graphSegmentGuide']}
                />
              ))}
            </>
          ) : null}

          {graphLayout.simultaneousGroups.map((group) => (
            <rect
              key={`simultaneous-group-${group.nodeIds.join('-')}`}
              x={group.x}
              y={group.y}
              width={group.width}
              height={group.height}
              rx={18}
              className={styles['graphSimultaneousGroup']}
            />
          ))}

          {graphLayout.edges.map((edge) => {
            const isHighlighted =
              hoveredNodeId !== undefined &&
              (edge.fromNodeId === hoveredNodeId ||
                edge.toNodeId === hoveredNodeId);
            const isSpellCastingEdge = edge.reasons.includes('spell-casting');

            return (
              <path
                key={`${edge.fromNodeId}-${edge.toNodeId}`}
                d={edge.path}
                className={[
                  styles['graphEdge'],
                  isSpellCastingEdge ? styles['graphEdgeSpellCasting'] : '',
                  isHighlighted ? styles['graphEdgeSelected'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                markerEnd={
                  isSpellCastingEdge
                    ? isHighlighted
                      ? `url(#${highlightedSpellArrowheadId})`
                      : `url(#${spellArrowheadId})`
                    : isHighlighted
                    ? `url(#${highlightedArrowheadId})`
                    : `url(#${arrowheadId})`
                }
              />
            );
          })}

          {graphLayout.nodes.map((layoutNode) => {
            const node = attackNodeById.get(layoutNode.nodeId);
            if (!node) {
              return null;
            }

            const display = graphNodeDisplayById[node.id];
            if (!display) {
              return null;
            }

            const lineYs = getInitiativeAttackGraphNodeLineYs(
              layoutNode.height,
              display.lines.length
            );

            return (
              <g
                key={layoutNode.nodeId}
                transform={`translate(${layoutNode.x} ${layoutNode.y})`}
                data-graph-node={'true'}
                data-graph-node-id={node.id}
                aria-label={`${display.combatantName}, target ${display.targetLabel}, ${display.actionLabel}`}
                onFocus={() => setHoveredNodeId(node.id)}
                onBlur={() =>
                  setHoveredNodeId((previous) =>
                    previous === node.id ? undefined : previous
                  )
                }
                tabIndex={0}
              >
                <rect
                  x={0}
                  y={0}
                  width={layoutNode.width}
                  height={layoutNode.height}
                  rx={16}
                  style={{ fill: getGraphNodeFill(node.side) }}
                  className={[
                    styles['graphNodeCard'],
                    node.side === 'party'
                      ? styles['graphNodeParty']
                      : styles['graphNodeEnemy'],
                    hoveredNodeId === node.id
                      ? styles['graphNodeSelected']
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
                {display.lines.map((line, index) => (
                  <text
                    key={`${layoutNode.nodeId}-line-${index}`}
                    x={layoutNode.width / 2}
                    y={lineYs[index]}
                    textAnchor={'middle'}
                    dominantBaseline={'middle'}
                    className={[
                      line.kind === 'name'
                        ? styles['graphNodeName']
                        : line.kind === 'target'
                        ? styles['graphNodeTarget']
                        : styles['graphNodeAction'],
                      line.isSecondary
                        ? styles['graphNodeActionSecondary']
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {line.text}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

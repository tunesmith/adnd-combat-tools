import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { SingleValue } from 'react-select';
import Select from 'react-select';
import { buildInitiativeAttackGraph } from '../../helpers/initiative/attackGraph';
import { buildInitiativeAttackGraphLayout } from '../../helpers/initiative/attackGraphLayout';
import { buildInitiativeRoundResolutionViewModel } from '../../helpers/initiative/roundResolutionViewModel';
import { resolveInitiativeRound } from '../../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../../helpers/initiative/scenario';
import customStyles from '../../helpers/selectCustomStyles';
import { MONSTER } from '../../tables/attackerClass';
import {
  canSetAgainstCharge,
  getWeaponInfo,
  getWeaponOptions,
} from '../../tables/weapon';
import type {
  InitiativeAttackEdgeReason,
  InitiativeAttackNode,
  InitiativeDeclaredAction,
  InitiativeScenarioDraft,
  InitiativeScenarioDraftCombatant,
} from '../../types/initiative';
import type { WeaponOption } from '../../types/option';
import styles from './initiativePlayground.module.css';

type InitiativePlaytestSide = 'party' | 'enemy';
type InitiativePlaytestStateSide = 'party' | 'enemies';

interface InitiativePlaytestCombatant {
  key: number;
  name: string;
  declaredAction: InitiativeDeclaredAction;
  movementRate: string;
  weaponId: number;
  targetCombatantKeys: number[];
}

interface InitiativePlaytestState {
  label: string;
  partyInitiative: string;
  enemyInitiative: string;
  nextCombatantKey: number;
  party: InitiativePlaytestCombatant[];
  enemies: InitiativePlaytestCombatant[];
  pairDistances: Record<string, string>;
}

interface InitiativePlaytestEditorTarget {
  side: InitiativePlaytestSide;
  combatantKey: number;
}

interface InitiativePlaytestAttackEditorTarget {
  attackingSide: InitiativePlaytestSide;
  attackerKey: number;
  targetKey: number;
  action: InitiativeDeclaredAction;
  distanceInches: string;
}

const ALL_WEAPON_OPTIONS = getWeaponOptions(MONSTER);
const ACTION_OPTIONS: Array<{
  value: InitiativeDeclaredAction;
  label: string;
}> = [
  { value: 'open-melee', label: 'Open melee' },
  { value: 'close', label: 'Close' },
  { value: 'charge', label: 'Charge' },
  { value: 'set-vs-charge', label: 'Set vs charge' },
  { value: 'missile', label: 'Missile' },
];

const parseInitiative = (value: string): number => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const isSingleTargetDeclarationAction = (
  declaredAction: InitiativeDeclaredAction
): boolean =>
  declaredAction === 'close' ||
  declaredAction === 'charge' ||
  declaredAction === 'set-vs-charge';

const requiresDistanceInput = (
  declaredAction: InitiativeDeclaredAction
): boolean => declaredAction === 'close' || declaredAction === 'charge';

const getPairDistanceKey = (
  partyCombatantKey: number,
  enemyCombatantKey: number
): string => `${partyCombatantKey}:${enemyCombatantKey}`;

const getDefaultDeclaredActionForWeaponId = (
  weaponId: number
): InitiativeDeclaredAction =>
  getWeaponInfo(weaponId)?.weaponType === 'missile' ? 'missile' : 'open-melee';

const formatDeclaredAction = (
  declaredAction: InitiativeDeclaredAction
): string =>
  ACTION_OPTIONS.find((option) => option.value === declaredAction)?.label ||
  declaredAction;

const getAvailableActionOptions = (
  weaponId: number
): Array<{
  value: InitiativeDeclaredAction;
  label: string;
}> =>
  ACTION_OPTIONS.filter(
    (option) =>
      option.value !== 'set-vs-charge' || canSetAgainstCharge(weaponId)
  );

const normalizeDeclaredActionForWeapon = (
  declaredAction: InitiativeDeclaredAction,
  weaponId: number
): InitiativeDeclaredAction =>
  declaredAction === 'set-vs-charge' && !canSetAgainstCharge(weaponId)
    ? getDefaultDeclaredActionForWeaponId(weaponId)
    : declaredAction;

const createCombatant = (
  key: number,
  name: string,
  weaponId: number,
  targetCombatantKeys: number[] = [],
  declaredAction: InitiativeDeclaredAction = getDefaultDeclaredActionForWeaponId(
    weaponId
  ),
  movementRate = '12'
): InitiativePlaytestCombatant => ({
  key,
  name,
  declaredAction,
  movementRate,
  weaponId,
  targetCombatantKeys,
});

const createMixedPreset = (): InitiativePlaytestState => ({
  label: 'Mixed Open Melee',
  partyInitiative: '4',
  enemyInitiative: '4',
  nextCombatantKey: 5,
  party: [
    createCombatant(1, 'Aldred', 17, [3]),
    createCombatant(2, 'Bera', 16),
  ],
  enemies: [
    createCombatant(3, 'Gnoll', 2, [1]),
    createCombatant(4, 'Ghoul', 1),
  ],
  pairDistances: {},
});

const createEnemyEdgePreset = (): InitiativePlaytestState => ({
  label: 'Enemy Initiative Edge',
  partyInitiative: '2',
  enemyInitiative: '5',
  nextCombatantKey: 5,
  party: [createCombatant(1, 'Hugh', 2, [3]), createCombatant(2, 'Lysa', 17)],
  enemies: [
    createCombatant(3, 'Orc', 1, [1]),
    createCombatant(4, 'Orc Archer', 16),
  ],
  pairDistances: {},
});

const createScrumPreset = (): InitiativePlaytestState => ({
  label: 'Ambiguous Scrum',
  partyInitiative: '6',
  enemyInitiative: '1',
  nextCombatantKey: 6,
  party: [
    createCombatant(1, 'Moryn', 2, [4]),
    createCombatant(2, 'Sella', 3, [4]),
    createCombatant(3, 'Tarn', 16),
  ],
  enemies: [
    createCombatant(4, 'Bugbear', 1, [1]),
    createCombatant(5, 'Kobold', 1),
  ],
  pairDistances: {},
});

const createChargePreset = (): InitiativePlaytestState => ({
  label: 'Charge Contact',
  partyInitiative: '3',
  enemyInitiative: '5',
  nextCombatantKey: 5,
  party: [
    createCombatant(1, 'Garran', 56, [3], 'charge', '12'),
    createCombatant(2, 'Ysra', 49, [], 'missile', '12'),
  ],
  enemies: [
    createCombatant(3, 'Hobgoblin', 57, [1], 'open-melee', '9'),
    createCombatant(4, 'Goblin Archer', 16, [], 'missile', '6'),
  ],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '4',
  },
});

const createSetVsChargePreset = (): InitiativePlaytestState => ({
  label: 'Set vs Charge',
  partyInitiative: '2',
  enemyInitiative: '5',
  nextCombatantKey: 4,
  party: [createCombatant(1, 'Doran', 50, [3], 'set-vs-charge', '12')],
  enemies: [createCombatant(3, 'Raider', 56, [1], 'charge', '12')],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '4',
  },
});

const createLargeBattlePreset = (): InitiativePlaytestState => ({
  label: 'Large Mixed Battle',
  partyInitiative: '4',
  enemyInitiative: '4',
  nextCombatantKey: 11,
  party: [
    createCombatant(1, 'Aldred', 56, [6], 'open-melee', '12'),
    createCombatant(2, 'Doran', 50, [7], 'set-vs-charge', '12'),
    createCombatant(3, 'Ysra', 49, [9], 'missile', '12'),
    createCombatant(4, 'Mave', 55, [8], 'close', '9'),
    createCombatant(5, 'Garran', 56, [10], 'charge', '12'),
  ],
  enemies: [
    createCombatant(6, 'Gnoll Captain', 2, [1], 'open-melee', '12'),
    createCombatant(7, 'Raider', 56, [2], 'charge', '12'),
    createCombatant(8, 'Orc Skirmisher', 41, [4], 'close', '9'),
    createCombatant(9, 'Goblin Archer', 16, [3], 'missile', '6'),
    createCombatant(10, 'Hobgoblin Guard', 59, [5], 'open-melee', '9'),
  ],
  pairDistances: {
    [getPairDistanceKey(2, 7)]: '4',
    [getPairDistanceKey(4, 8)]: '6',
    [getPairDistanceKey(5, 10)]: '4',
  },
});

const buildDraftCombatants = (
  side: InitiativePlaytestSide,
  combatants: InitiativePlaytestCombatant[],
  pairDistances: Record<string, string>
): InitiativeScenarioDraftCombatant[] =>
  combatants.map((combatant) => ({
    combatantKey: combatant.key,
    name: combatant.name.trim() || undefined,
    declaredAction: combatant.declaredAction,
    movementRate: parseOptionalNumber(combatant.movementRate),
    weaponId: combatant.weaponId,
    targetDeclarations: combatant.targetCombatantKeys.map(
      (targetCombatantKey) => ({
        targetCombatantKey,
        distanceInches: parseOptionalNumber(
          pairDistances[
            side === 'party'
              ? getPairDistanceKey(combatant.key, targetCombatantKey)
              : getPairDistanceKey(targetCombatantKey, combatant.key)
          ] || ''
        ),
      })
    ),
  }));

const buildDraftFromState = (
  state: InitiativePlaytestState
): InitiativeScenarioDraft => ({
  label: state.label.trim() || 'Initiative Playtest',
  partyInitiative: parseInitiative(state.partyInitiative),
  enemyInitiative: parseInitiative(state.enemyInitiative),
  party: buildDraftCombatants('party', state.party, state.pairDistances),
  enemies: buildDraftCombatants('enemy', state.enemies, state.pairDistances),
});

const getDefaultWeaponIdForSide = (side: InitiativePlaytestSide): number =>
  side === 'party' ? 17 : 1;

const getStateSide = (
  side: InitiativePlaytestSide
): InitiativePlaytestStateSide => (side === 'party' ? 'party' : 'enemies');

const getNextCombatantName = (
  side: InitiativePlaytestSide,
  count: number
): string => `${side === 'party' ? 'Party' : 'Enemy'} ${count + 1}`;

const getCombatantDisplayName = (
  side: InitiativePlaytestSide,
  combatant: InitiativePlaytestCombatant,
  index: number
): string => combatant.name.trim() || getNextCombatantName(side, index);

const getWeaponSummary = (weaponId: number): string => {
  const weaponInfo = getWeaponInfo(weaponId);

  if (weaponInfo?.weaponType === 'melee') {
    return `WSF ${weaponInfo.speedFactor}`;
  }

  if (weaponInfo?.weaponType === 'missile') {
    return `FR ${weaponInfo.fireRate}`;
  }

  return weaponInfo?.weaponType || 'natural';
};

const getCombatantMeta = (combatant: InitiativePlaytestCombatant): string =>
  `MV ${combatant.movementRate.trim() || '12'}" · ${getWeaponSummary(
    combatant.weaponId
  )}`;

const isNonMissileWeaponId = (weaponId: number): boolean =>
  getWeaponInfo(weaponId)?.weaponType !== 'missile';

const getGraphNodeSourceLabel = (
  source: InitiativeAttackNode['source']
): string =>
  source === 'routine-component'
    ? 'Routine component'
    : source === 'timing-bonus'
    ? 'Timing bonus'
    : 'Movement contact';

const getGraphEdgeReasonLabel = (reason: InitiativeAttackEdgeReason): string =>
  reason === 'simple-initiative'
    ? 'baseline side initiative'
    : reason === 'direct-melee'
    ? 'duel timing rule'
    : 'movement contact rule';

const formatGraphEdgeReasons = (
  reasons: InitiativeAttackEdgeReason[]
): string => reasons.map(getGraphEdgeReasonLabel).join(', ');

const getGraphLayerIndex = (layers: string[][], nodeId: string): number =>
  layers.findIndex((layer) => layer.includes(nodeId)) + 1;

const truncateGraphText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

const getGraphActionLines = (text: string): string[] => {
  const [actionLabel, suffixLabel] = text.split(' · ');

  if (!actionLabel || !suffixLabel) {
    return [truncateGraphText(text, 20)];
  }

  return [
    truncateGraphText(actionLabel, 16),
    truncateGraphText(suffixLabel, 16),
  ];
};

type GraphNodeDisplayLineKind = 'name' | 'target' | 'action';

interface GraphNodeDisplayLine {
  text: string;
  kind: GraphNodeDisplayLineKind;
  isSecondary?: boolean;
}

interface GraphNodeDisplay {
  combatantName: string;
  targetLabel: string;
  actionLabel: string;
  lines: GraphNodeDisplayLine[];
  width: number;
  height: number;
}

const GRAPH_NODE_MIN_WIDTH = 102;
const GRAPH_NODE_MAX_WIDTH = 132;
const GRAPH_NODE_HEIGHT = 66;
const GRAPH_NODE_HORIZONTAL_PADDING = 14;
const GRAPH_NODE_LINE_GAP = 14;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const estimateGraphNodeLineWidth = (
  text: string,
  kind: GraphNodeDisplayLineKind
): number =>
  text.length * (kind === 'name' ? 6.6 : kind === 'target' ? 5.8 : 5.2);

const getGraphNodeWidth = (lines: GraphNodeDisplayLine[]): number =>
  clamp(
    Math.max(
      ...lines.map(
        (line) =>
          estimateGraphNodeLineWidth(line.text, line.kind) +
          GRAPH_NODE_HORIZONTAL_PADDING * 2
      )
    ),
    GRAPH_NODE_MIN_WIDTH,
    GRAPH_NODE_MAX_WIDTH
  );

const getGraphNodeLineYs = (height: number, lineCount: number): number[] => {
  const totalSpan = (lineCount - 1) * GRAPH_NODE_LINE_GAP;
  const centerY = height / 2 + 1;

  return Array.from(
    { length: lineCount },
    (_unusedValue, index) =>
      centerY - totalSpan / 2 + index * GRAPH_NODE_LINE_GAP
  );
};

const InitiativePlayground = () => {
  const [state, setState] =
    useState<InitiativePlaytestState>(createMixedPreset);
  const [editorTarget, setEditorTarget] = useState<
    InitiativePlaytestEditorTarget | undefined
  >(undefined);
  const [attackEditorTarget, setAttackEditorTarget] = useState<
    InitiativePlaytestAttackEditorTarget | undefined
  >(undefined);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<
    string | undefined
  >(undefined);
  const scenario = useMemo(
    () => buildInitiativeScenario(buildDraftFromState(state)),
    [state]
  );
  const resolution = useMemo(
    () => resolveInitiativeRound(scenario),
    [scenario]
  );
  const attackGraph = useMemo(
    () => buildInitiativeAttackGraph(scenario, resolution),
    [resolution, scenario]
  );
  const viewModel = useMemo(
    () => buildInitiativeRoundResolutionViewModel(scenario, resolution),
    [resolution, scenario]
  );
  const simpleOrderCard = viewModel.cards.find(
    (card) => card.kind === 'simple-order'
  );
  const attackNodeById = useMemo(
    () => new Map(attackGraph.nodes.map((node) => [node.id, node] as const)),
    [attackGraph.nodes]
  );
  const combatantById = useMemo(
    () =>
      new Map(
        scenario.party
          .concat(scenario.enemies)
          .map((combatant) => [combatant.id, combatant] as const)
      ),
    [scenario.enemies, scenario.party]
  );
  const graphNodeDisplayById = useMemo(
    () =>
      Object.fromEntries(
        attackGraph.nodes.map((node) => {
          const combatantName =
            viewModel.combatantNameById[node.combatantId] || node.combatantId;
          const combatant = combatantById.get(node.combatantId);

          let targetLabel = 'No target';
          if (combatant?.targetIds.length === 1) {
            const targetId = combatant.targetIds[0];
            targetLabel = targetId
              ? viewModel.combatantNameById[targetId] || targetId
              : 'No target';
          } else if ((combatant?.targetIds.length || 0) > 1) {
            targetLabel = 'Multiple targets';
          }

          const actionLabel = combatant
            ? `${formatDeclaredAction(combatant.declaredAction)} · ${
                node.label
              }`
            : 'Unknown action';
          const actionLines = getGraphActionLines(actionLabel);
          const lines: GraphNodeDisplayLine[] = [
            {
              text: truncateGraphText(combatantName, 18),
              kind: 'name',
            },
            {
              text: truncateGraphText(`→ ${targetLabel}`, 18),
              kind: 'target',
            },
            ...actionLines.map((actionLine, index) => ({
              text: actionLine,
              kind: 'action' as const,
              isSecondary: index > 0,
            })),
          ];

          return [
            node.id,
            {
              combatantName,
              targetLabel,
              actionLabel,
              lines,
              width: getGraphNodeWidth(lines),
              height: GRAPH_NODE_HEIGHT,
            } as GraphNodeDisplay,
          ];
        })
      ),
    [attackGraph.nodes, combatantById, viewModel.combatantNameById]
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
        )
      ),
    [attackGraph, graphNodeDisplayById]
  );
  const menuPortalTarget =
    typeof document !== 'undefined' ? document.body : undefined;
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  const updateLabel = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((previous) => ({
      ...previous,
      label: value,
    }));
  };

  const updateInitiative = (
    field: 'partyInitiative' | 'enemyInitiative',
    value: string
  ) => {
    setState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateCombatant = (
    side: InitiativePlaytestSide,
    combatantKey: number,
    changes: Partial<InitiativePlaytestCombatant>
  ) => {
    const stateSide = getStateSide(side);

    setState((previous) => ({
      ...previous,
      [stateSide]: previous[stateSide].map((combatant) =>
        combatant.key === combatantKey
          ? (() => {
              const updatedCombatant = { ...combatant, ...changes };

              if (
                changes.declaredAction &&
                isSingleTargetDeclarationAction(changes.declaredAction) &&
                updatedCombatant.targetCombatantKeys.length > 1
              ) {
                updatedCombatant.targetCombatantKeys =
                  updatedCombatant.targetCombatantKeys.slice(0, 1);
              }

              if (changes.weaponId !== undefined) {
                updatedCombatant.declaredAction =
                  normalizeDeclaredActionForWeapon(
                    updatedCombatant.declaredAction,
                    changes.weaponId
                  );
              }

              return updatedCombatant;
            })()
          : combatant
      ),
    }));
  };

  const openAttackEditor = (
    attackingSide: InitiativePlaytestSide,
    attackerKey: number,
    targetKey: number
  ) => {
    const attackingCombatant = state[getStateSide(attackingSide)].find(
      (combatant) => combatant.key === attackerKey
    );

    if (!attackingCombatant) {
      return;
    }

    const pairKey =
      attackingSide === 'party'
        ? getPairDistanceKey(attackerKey, targetKey)
        : getPairDistanceKey(targetKey, attackerKey);

    setAttackEditorTarget({
      attackingSide,
      attackerKey,
      targetKey,
      action: attackingCombatant.declaredAction,
      distanceInches: state.pairDistances[pairKey] || '',
    });
  };

  const addCombatant = (side: InitiativePlaytestSide) => {
    const stateSide = getStateSide(side);

    setState((previous) => {
      const nextCombatant = createCombatant(
        previous.nextCombatantKey,
        getNextCombatantName(side, previous[stateSide].length),
        getDefaultWeaponIdForSide(side)
      );

      return {
        ...previous,
        nextCombatantKey: previous.nextCombatantKey + 1,
        [stateSide]: previous[stateSide].concat(nextCombatant),
      };
    });
  };

  const removeCombatant = (
    side: InitiativePlaytestSide,
    combatantKey: number
  ) => {
    const stateSide = getStateSide(side);
    const opposingStateSide: InitiativePlaytestStateSide =
      side === 'party' ? 'enemies' : 'party';

    setState((previous) => ({
      ...previous,
      pairDistances: Object.fromEntries(
        Object.entries(previous.pairDistances).filter(([pairKey]) => {
          const [partyCombatantKey, enemyCombatantKey] = pairKey
            .split(':')
            .map((value) => parseInt(value, 10));

          if (side === 'party') {
            return partyCombatantKey !== combatantKey;
          }

          return enemyCombatantKey !== combatantKey;
        })
      ),
      [stateSide]: previous[stateSide].filter(
        (combatant) => combatant.key !== combatantKey
      ),
      [opposingStateSide]: previous[opposingStateSide].map((combatant) =>
        combatant.targetCombatantKeys.includes(combatantKey)
          ? {
              ...combatant,
              targetCombatantKeys: combatant.targetCombatantKeys.filter(
                (targetKey) => targetKey !== combatantKey
              ),
            }
          : combatant
      ),
    }));
    setEditorTarget((previous) =>
      previous &&
      previous.side === side &&
      previous.combatantKey === combatantKey
        ? undefined
        : previous
    );
  };

  const loadPreset = (presetFactory: () => InitiativePlaytestState) => {
    setState(presetFactory());
  };

  const saveAttackDeclaration = () => {
    if (!attackEditorTarget) {
      return;
    }

    const { attackingSide, attackerKey, targetKey, action, distanceInches } =
      attackEditorTarget;
    const stateSide = getStateSide(attackingSide);
    const pairKey =
      attackingSide === 'party'
        ? getPairDistanceKey(attackerKey, targetKey)
        : getPairDistanceKey(targetKey, attackerKey);

    setState((previous) => ({
      ...previous,
      pairDistances: {
        ...previous.pairDistances,
        [pairKey]: distanceInches,
      },
      [stateSide]: previous[stateSide].map((combatant) => {
        if (combatant.key !== attackerKey) {
          return combatant;
        }

        const nextTargetCombatantKeys = combatant.targetCombatantKeys.includes(
          targetKey
        )
          ? isSingleTargetDeclarationAction(action)
            ? [targetKey]
            : combatant.targetCombatantKeys
          : isSingleTargetDeclarationAction(action)
          ? [targetKey]
          : combatant.targetCombatantKeys.concat(targetKey);

        return {
          ...combatant,
          declaredAction: action,
          targetCombatantKeys: nextTargetCombatantKeys,
        };
      }),
    }));

    setAttackEditorTarget(undefined);
  };

  const clearAttackDeclaration = () => {
    if (!attackEditorTarget) {
      return;
    }

    const { attackingSide, attackerKey, targetKey } = attackEditorTarget;
    const stateSide = getStateSide(attackingSide);
    const pairKey =
      attackingSide === 'party'
        ? getPairDistanceKey(attackerKey, targetKey)
        : getPairDistanceKey(targetKey, attackerKey);

    setState((previous) => ({
      ...previous,
      pairDistances: Object.fromEntries(
        Object.entries(previous.pairDistances).filter(
          ([existingPairKey]) => existingPairKey !== pairKey
        )
      ),
      [stateSide]: previous[stateSide].map((combatant) =>
        combatant.key === attackerKey
          ? {
              ...combatant,
              targetCombatantKeys: combatant.targetCombatantKeys.filter(
                (existingTargetKey) => existingTargetKey !== targetKey
              ),
            }
          : combatant
      ),
    }));

    setAttackEditorTarget(undefined);
  };

  const attackNodeLabelById = useMemo(
    () =>
      Object.fromEntries(
        attackGraph.nodes.map((node) => [
          node.id,
          `${
            viewModel.combatantNameById[node.combatantId] || node.combatantId
          } ${node.label}`,
        ])
      ),
    [attackGraph.nodes, viewModel.combatantNameById]
  );
  const toggleSelectedGraphNode = (nodeId: string) => {
    setSelectedGraphNodeId((previous) =>
      previous === nodeId ? undefined : nodeId
    );
  };
  const selectedGraphNode = attackGraph.nodes.find(
    (node) => node.id === selectedGraphNodeId
  );
  const selectedGraphNodeLayer = selectedGraphNode
    ? getGraphLayerIndex(attackGraph.layers, selectedGraphNode.id)
    : 0;
  const selectedGraphIncomingEdges = selectedGraphNode
    ? attackGraph.edges.filter((edge) => edge.toNodeId === selectedGraphNode.id)
    : [];
  const selectedGraphOutgoingEdges = selectedGraphNode
    ? attackGraph.edges.filter(
        (edge) => edge.fromNodeId === selectedGraphNode.id
      )
    : [];
  const selectedGraphRelatedCards = selectedGraphNode
    ? viewModel.cards.filter(
        (card) =>
          card.kind !== 'simple-order' &&
          card.combatantIds.includes(selectedGraphNode.combatantId)
      )
    : [];
  const editedCombatant =
    editorTarget !== undefined
      ? state[getStateSide(editorTarget.side)].find(
          (combatant) => combatant.key === editorTarget.combatantKey
        )
      : undefined;
  const editedCombatantIndex =
    editorTarget !== undefined
      ? state[getStateSide(editorTarget.side)].findIndex(
          (combatant) => combatant.key === editorTarget.combatantKey
        )
      : -1;
  const editedCombatantDisplayName =
    editedCombatant && editorTarget && editedCombatantIndex >= 0
      ? getCombatantDisplayName(
          editorTarget.side,
          editedCombatant,
          editedCombatantIndex
        )
      : undefined;
  const attackEditedAttacker =
    attackEditorTarget !== undefined
      ? state[getStateSide(attackEditorTarget.attackingSide)].find(
          (combatant) => combatant.key === attackEditorTarget.attackerKey
        )
      : undefined;
  const attackEditedTargetSide: InitiativePlaytestSide | undefined =
    attackEditorTarget
      ? attackEditorTarget.attackingSide === 'party'
        ? 'enemy'
        : 'party'
      : undefined;
  const attackEditedTargetCombatants =
    attackEditedTargetSide !== undefined
      ? state[getStateSide(attackEditedTargetSide)]
      : [];
  const attackEditedTargetIndex =
    attackEditorTarget !== undefined
      ? attackEditedTargetCombatants.findIndex(
          (combatant) => combatant.key === attackEditorTarget.targetKey
        )
      : -1;
  const attackEditedTargetCombatant =
    attackEditedTargetIndex >= 0
      ? attackEditedTargetCombatants[attackEditedTargetIndex]
      : undefined;
  const attackEditedAttackerIndex =
    attackEditorTarget !== undefined
      ? state[getStateSide(attackEditorTarget.attackingSide)].findIndex(
          (combatant) => combatant.key === attackEditorTarget.attackerKey
        )
      : -1;
  const attackEditedAttackerName =
    attackEditedAttacker && attackEditorTarget && attackEditedAttackerIndex >= 0
      ? getCombatantDisplayName(
          attackEditorTarget.attackingSide,
          attackEditedAttacker,
          attackEditedAttackerIndex
        )
      : undefined;
  const attackEditedTargetName =
    attackEditedTargetCombatant && attackEditedTargetSide !== undefined
      ? getCombatantDisplayName(
          attackEditedTargetSide,
          attackEditedTargetCombatant,
          attackEditedTargetIndex
        )
      : undefined;

  return (
    <div className={styles['page']}>
      <div className={styles['hero']}>
        <div>
          <div className={styles['eyebrow']}>AD&amp;D 1e Initiative</div>
          <h1 className={styles['title']}>Initiative Playground</h1>
          <p className={styles['lede']}>
            This page is for playtesting the current rules slice: simple side
            initiative, conservative direct melee pairing, open-melee weapon
            speed factor resolution, charge/close contact handling, set versus
            charge, and generic attack routines with named components.
          </p>
        </div>
        <div className={styles['presetBar']}>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createMixedPreset)}
          >
            Mixed Example
          </button>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createEnemyEdgePreset)}
          >
            Enemy Edge
          </button>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createScrumPreset)}
          >
            Ambiguous Scrum
          </button>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createChargePreset)}
          >
            Charge Contact
          </button>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createSetVsChargePreset)}
          >
            Set vs Charge
          </button>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => loadPreset(createLargeBattlePreset)}
          >
            Large Mixed
          </button>
        </div>
      </div>

      <div className={styles['layout']}>
        <section className={styles['panel']}>
          <div className={styles['matrixSection']}>
            <div className={styles['matrixHeader']}>
              <h3 className={styles['matrixTitle']}>Engagement Matrix</h3>
              <p className={styles['matrixCopy']}>
                Party combatants run across the top, enemies run down the side.
                Click `P→E` when the party column attacks the enemy row, `E→P`
                for the reverse, and use the declaration modal to set the action
                plus any inch distance for that directed attack. Clean
                open-melee mutual targets light up as duels. Click a row or
                column header to edit persistent combatant metadata.
              </p>
            </div>

            {state.party.length > 0 && state.enemies.length > 0 ? (
              <div className={styles['matrixWrap']}>
                <table className={styles['matrixTable']}>
                  <colgroup>
                    <col className={styles['matrixLabelColumn']} />
                    {state.party.map((partyCombatant) => (
                      <col
                        key={`party-column-${partyCombatant.key}`}
                        className={styles['matrixCombatantColumn']}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={styles['matrixCorner']}>
                        <div className={styles['matrixCornerTop']}>
                          <div className={styles['matrixCornerHeading']}>
                            <span className={styles['matrixLegendLabel']}>
                              Party vs Enemy
                            </span>
                            <span className={styles['matrixLegendMeta']}>
                              `P→E` and `E→P` are the declared attacks.
                            </span>
                          </div>
                          <button
                            type={'button'}
                            className={[
                              styles['addButton'],
                              styles['matrixCornerActionParty'],
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => addCombatant('party')}
                          >
                            Add party
                          </button>
                        </div>
                        <div className={styles['matrixSetupGrid']}>
                          <label
                            className={[
                              styles['fieldLabel'],
                              styles['matrixSetupField'],
                              styles['matrixSetupFieldWide'],
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <span className={styles['matrixSetupLabel']}>
                              Scenario
                            </span>
                            <input
                              className={[
                                styles['textInput'],
                                styles['matrixSetupInput'],
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              value={state.label}
                              onChange={updateLabel}
                            />
                          </label>
                          <div className={styles['matrixSetupPair']}>
                            <label
                              className={[
                                styles['fieldLabel'],
                                styles['matrixSetupField'],
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <span className={styles['matrixSetupLabel']}>
                                Party init
                              </span>
                              <input
                                className={[
                                  styles['textInput'],
                                  styles['matrixSetupInput'],
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                inputMode={'numeric'}
                                value={state.partyInitiative}
                                onChange={(event) =>
                                  updateInitiative(
                                    'partyInitiative',
                                    event.target.value
                                  )
                                }
                              />
                            </label>
                            <label
                              className={[
                                styles['fieldLabel'],
                                styles['matrixSetupField'],
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <span className={styles['matrixSetupLabel']}>
                                Enemy init
                              </span>
                              <input
                                className={[
                                  styles['textInput'],
                                  styles['matrixSetupInput'],
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                inputMode={'numeric'}
                                value={state.enemyInitiative}
                                onChange={(event) =>
                                  updateInitiative(
                                    'enemyInitiative',
                                    event.target.value
                                  )
                                }
                              />
                            </label>
                          </div>
                        </div>
                        <div className={styles['matrixCornerBottom']}>
                          <button
                            type={'button'}
                            className={[
                              styles['addButton'],
                              styles['matrixCornerActionEnemy'],
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => addCombatant('enemy')}
                          >
                            Add enemy
                          </button>
                        </div>
                      </th>
                      {state.party.map((partyCombatant, partyIndex) => (
                        <th
                          key={`party-header-${partyCombatant.key}`}
                          className={styles['matrixColumnHeader']}
                        >
                          <button
                            type={'button'}
                            className={styles['matrixCombatantButton']}
                            onClick={() =>
                              setEditorTarget({
                                side: 'party',
                                combatantKey: partyCombatant.key,
                              })
                            }
                          >
                            <span className={styles['matrixCombatantName']}>
                              {getCombatantDisplayName(
                                'party',
                                partyCombatant,
                                partyIndex
                              )}
                            </span>
                            <span className={styles['matrixCombatantMeta']}>
                              {getCombatantMeta(partyCombatant)}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.enemies.map((enemyCombatant, enemyIndex) => {
                      return (
                        <tr key={`enemy-row-${enemyCombatant.key}`}>
                          <th className={styles['matrixRowHeader']}>
                            <button
                              type={'button'}
                              className={styles['matrixCombatantButton']}
                              onClick={() =>
                                setEditorTarget({
                                  side: 'enemy',
                                  combatantKey: enemyCombatant.key,
                                })
                              }
                            >
                              <span className={styles['matrixCombatantName']}>
                                {getCombatantDisplayName(
                                  'enemy',
                                  enemyCombatant,
                                  enemyIndex
                                )}
                              </span>
                              <span className={styles['matrixCombatantMeta']}>
                                {getCombatantMeta(enemyCombatant)}
                              </span>
                            </button>
                          </th>
                          {state.party.map((partyCombatant, partyIndex) => {
                            const partyTargetsEnemy =
                              partyCombatant.targetCombatantKeys.includes(
                                enemyCombatant.key
                              );
                            const enemyTargetsParty =
                              enemyCombatant.targetCombatantKeys.includes(
                                partyCombatant.key
                              );
                            const isMutualTarget =
                              partyTargetsEnemy && enemyTargetsParty;
                            const isDuel =
                              isMutualTarget &&
                              partyCombatant.declaredAction === 'open-melee' &&
                              enemyCombatant.declaredAction === 'open-melee' &&
                              isNonMissileWeaponId(partyCombatant.weaponId) &&
                              isNonMissileWeaponId(enemyCombatant.weaponId);
                            const pairDistance =
                              state.pairDistances[
                                getPairDistanceKey(
                                  partyCombatant.key,
                                  enemyCombatant.key
                                )
                              ] || '';
                            const partyDeclarationLabel = partyTargetsEnemy
                              ? `${formatDeclaredAction(
                                  partyCombatant.declaredAction
                                )}${
                                  requiresDistanceInput(
                                    partyCombatant.declaredAction
                                  ) && pairDistance
                                    ? ` · ${pairDistance}"`
                                    : ''
                                }`
                              : '';
                            const enemyDeclarationLabel = enemyTargetsParty
                              ? `${formatDeclaredAction(
                                  enemyCombatant.declaredAction
                                )}${
                                  requiresDistanceInput(
                                    enemyCombatant.declaredAction
                                  ) && pairDistance
                                    ? ` · ${pairDistance}"`
                                    : ''
                                }`
                              : '';

                            return (
                              <td
                                key={`matrix-${enemyCombatant.key}-${partyCombatant.key}`}
                                className={[
                                  styles['matrixCell'],
                                  isDuel ? styles['matrixCellDuel'] : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <div className={styles['matrixCellBody']}>
                                  <div className={styles['matrixCellActions']}>
                                    <button
                                      type={'button'}
                                      className={[
                                        styles['matrixToggle'],
                                        styles['matrixToggleEnemy'],
                                        enemyTargetsParty
                                          ? styles['matrixToggleActiveEnemy']
                                          : styles['matrixToggleIdle'],
                                      ]
                                        .filter(Boolean)
                                        .join(' ')}
                                      aria-label={`Declare enemy attack from ${getCombatantDisplayName(
                                        'enemy',
                                        enemyCombatant,
                                        enemyIndex
                                      )} to ${getCombatantDisplayName(
                                        'party',
                                        partyCombatant,
                                        partyIndex
                                      )}`}
                                      onClick={() =>
                                        openAttackEditor(
                                          'enemy',
                                          enemyCombatant.key,
                                          partyCombatant.key
                                        )
                                      }
                                    >
                                      {enemyTargetsParty ? (
                                        <>
                                          <span
                                            className={
                                              styles['matrixToggleLabel']
                                            }
                                          >
                                            E&rarr;P
                                          </span>
                                          <span
                                            className={
                                              styles['matrixToggleMeta']
                                            }
                                          >
                                            {enemyDeclarationLabel}
                                          </span>
                                        </>
                                      ) : null}
                                    </button>
                                    <button
                                      type={'button'}
                                      className={[
                                        styles['matrixToggle'],
                                        styles['matrixToggleParty'],
                                        partyTargetsEnemy
                                          ? styles['matrixToggleActiveParty']
                                          : styles['matrixToggleIdle'],
                                      ]
                                        .filter(Boolean)
                                        .join(' ')}
                                      aria-label={`Declare party attack from ${getCombatantDisplayName(
                                        'party',
                                        partyCombatant,
                                        partyIndex
                                      )} to ${getCombatantDisplayName(
                                        'enemy',
                                        enemyCombatant,
                                        enemyIndex
                                      )}`}
                                      onClick={() =>
                                        openAttackEditor(
                                          'party',
                                          partyCombatant.key,
                                          enemyCombatant.key
                                        )
                                      }
                                    >
                                      {partyTargetsEnemy ? (
                                        <>
                                          <span
                                            className={
                                              styles['matrixToggleLabel']
                                            }
                                          >
                                            P&rarr;E
                                          </span>
                                          <span
                                            className={
                                              styles['matrixToggleMeta']
                                            }
                                          >
                                            {partyDeclarationLabel}
                                          </span>
                                        </>
                                      ) : null}
                                    </button>
                                  </div>
                                  {isDuel ? (
                                    <span className={styles['matrixBadge']}>
                                      Duel
                                    </span>
                                  ) : isMutualTarget ? (
                                    <span className={styles['matrixBadge']}>
                                      Mutual target
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles['matrixEmpty']}>
                <div>
                  Add at least one party combatant and one enemy combatant to
                  use the engagement matrix.
                </div>
                <div className={styles['matrixLegendActions']}>
                  <button
                    type={'button'}
                    className={styles['addButton']}
                    onClick={() => addCombatant('party')}
                  >
                    Add party
                  </button>
                  <button
                    type={'button'}
                    className={styles['addButton']}
                    onClick={() => addCombatant('enemy')}
                  >
                    Add enemy
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles['panel']}>
          <div className={styles['graphPanel']}>
            <div className={styles['graphHeader']}>
              <h2 className={styles['graphTitle']}>Precedence DAG</h2>
              <p className={styles['graphCopy']}>
                The graph only contains attack relations justified by baseline
                initiative or a narrower melee timing rule. Segment-aware
                actions occupy the upper swim-lane band; unsegmented attacks
                stay in the freeform precedence band below. Click a node to
                toggle its local rule detail panel.
              </p>
            </div>
            <div className={styles['summaryStrip']}>
              <div
                className={[
                  styles['summaryCell'],
                  styles['summaryCellBaseline'],
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={styles['summaryLabel']}>Baseline</span>
                <span
                  className={[
                    styles['summaryValue'],
                    styles['summaryValueLong'],
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {simpleOrderCard?.summary || resolution.simpleOrder}
                </span>
              </div>
              <div className={styles['summaryCell']}>
                <span className={styles['summaryLabel']}>Duels</span>
                <span className={styles['summaryValue']}>
                  {resolution.directMeleeEngagements.length}
                </span>
              </div>
              <div className={styles['summaryCell']}>
                <span className={styles['summaryLabel']}>Movement</span>
                <span className={styles['summaryValue']}>
                  {resolution.movementResolutions.length}
                </span>
              </div>
              <div className={styles['summaryCell']}>
                <span className={styles['summaryLabel']}>Unresolved</span>
                <span className={styles['summaryValue']}>
                  {resolution.unresolvedMeleeCandidateIds.length}
                </span>
              </div>
            </div>
            <div className={styles['graphViewportShell']}>
              <div className={styles['graphViewport']}>
                {attackGraph.nodes.length > 0 ? (
                  <>
                    <svg
                      className={styles['graphSvg']}
                      viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                      width={graphLayout.width}
                      height={graphLayout.height}
                      aria-label={'Initiative precedence graph'}
                    >
                      <defs>
                        <marker
                          id={'initiative-dag-arrowhead'}
                          viewBox={'0 0 8 8'}
                          refX={'7'}
                          refY={'4'}
                          markerWidth={'7'}
                          markerHeight={'7'}
                          orient={'auto-start-reverse'}
                        >
                          <path
                            d={'M 0 0 L 6 3 L 0 6 z'}
                            className={styles['graphArrowhead']}
                          />
                        </marker>
                      </defs>

                      {graphLayout.hasSegmentBand ? (
                        <>
                          {graphLayout.segmentColumns.map(
                            (segmentColumn, columnIndex) => (
                              <rect
                                key={`segment-lane-${segmentColumn.segment}`}
                                x={segmentColumn.startX}
                                y={graphLayout.headerLineY}
                                width={
                                  segmentColumn.endX - segmentColumn.startX
                                }
                                height={
                                  graphLayout.segmentBandBottomY -
                                  graphLayout.headerLineY
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
                            )
                          )}
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
                            <g key={`segment-column-${segmentColumn.segment}`}>
                              <text
                                x={segmentColumn.centerX}
                                y={graphLayout.headerLabelY}
                                textAnchor={'middle'}
                                className={styles['graphSegmentColumnLabel']}
                              >
                                {segmentColumn.segment}
                              </text>
                            </g>
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

                      {graphLayout.edges.map((edge) => {
                        const isSelected =
                          selectedGraphNode !== undefined &&
                          (edge.fromNodeId === selectedGraphNode.id ||
                            edge.toNodeId === selectedGraphNode.id);

                        return (
                          <path
                            key={`${edge.fromNodeId}-${edge.toNodeId}`}
                            d={edge.path}
                            className={[
                              styles['graphEdge'],
                              isSelected ? styles['graphEdgeSelected'] : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            markerEnd={'url(#initiative-dag-arrowhead)'}
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

                        const isSelected = selectedGraphNode?.id === node.id;
                        const lineYs = getGraphNodeLineYs(
                          layoutNode.height,
                          display.lines.length
                        );

                        return (
                          <g
                            key={layoutNode.nodeId}
                            transform={`translate(${layoutNode.x} ${layoutNode.y})`}
                            role={'button'}
                            tabIndex={0}
                            aria-label={`${display.combatantName}, target ${display.targetLabel}, ${display.actionLabel}`}
                            onClick={() => toggleSelectedGraphNode(node.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleSelectedGraphNode(node.id);
                              }
                            }}
                          >
                            <rect
                              x={0}
                              y={0}
                              width={layoutNode.width}
                              height={layoutNode.height}
                              rx={16}
                              style={{
                                fill: isSelected
                                  ? '#ae7c32'
                                  : node.side === 'party'
                                  ? '#6d8e3a'
                                  : '#8d623c',
                              }}
                              className={[
                                styles['graphNodeCard'],
                                node.side === 'party'
                                  ? styles['graphNodeParty']
                                  : styles['graphNodeEnemy'],
                                isSelected ? styles['graphNodeSelected'] : '',
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
                    {selectedGraphNode ? (
                      <aside className={styles['graphInspectorOverlay']}>
                        <div className={styles['graphInspector']}>
                          <div className={styles['graphInspectorHeader']}>
                            <div className={styles['graphInspectorTitle']}>
                              {attackNodeLabelById[selectedGraphNode.id] ||
                                selectedGraphNode.id}
                            </div>
                            <button
                              type={'button'}
                              className={styles['graphInspectorButton']}
                              onClick={() => setSelectedGraphNodeId(undefined)}
                            >
                              Dismiss
                            </button>
                          </div>
                          <div className={styles['graphInspectorMeta']}>
                            <span>
                              Side:{' '}
                              {selectedGraphNode.side === 'party'
                                ? 'Party'
                                : 'Enemy'}
                            </span>
                            <span>Layer: {selectedGraphNodeLayer}</span>
                            {selectedGraphNode.segment !== undefined ? (
                              <span>Segment: {selectedGraphNode.segment}</span>
                            ) : null}
                            <span>
                              Source:{' '}
                              {getGraphNodeSourceLabel(
                                selectedGraphNode.source
                              )}
                            </span>
                          </div>

                          <div className={styles['graphInspectorSection']}>
                            <h4 className={styles['graphSubhead']}>
                              Blocked By
                            </h4>
                            {selectedGraphIncomingEdges.length > 0 ? (
                              <ol className={styles['graphInspectorList']}>
                                {selectedGraphIncomingEdges.map((edge) => (
                                  <li
                                    key={`incoming-${edge.fromNodeId}-${edge.toNodeId}`}
                                    className={styles['graphInspectorItem']}
                                  >
                                    <span className={styles['stepLabel']}>
                                      {attackNodeLabelById[edge.fromNodeId] ||
                                        edge.fromNodeId}
                                    </span>
                                    <span className={styles['stepDetail']}>
                                      {formatGraphEdgeReasons(edge.reasons)}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <div className={styles['graphInspectorEmpty']}>
                                No explicit blockers. This attack is currently
                                enabled at the left edge of the graph.
                              </div>
                            )}
                          </div>

                          <div className={styles['graphInspectorSection']}>
                            <h4 className={styles['graphSubhead']}>Blocks</h4>
                            {selectedGraphOutgoingEdges.length > 0 ? (
                              <ol className={styles['graphInspectorList']}>
                                {selectedGraphOutgoingEdges.map((edge) => (
                                  <li
                                    key={`outgoing-${edge.fromNodeId}-${edge.toNodeId}`}
                                    className={styles['graphInspectorItem']}
                                  >
                                    <span className={styles['stepLabel']}>
                                      {attackNodeLabelById[edge.toNodeId] ||
                                        edge.toNodeId}
                                    </span>
                                    <span className={styles['stepDetail']}>
                                      {formatGraphEdgeReasons(edge.reasons)}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <div className={styles['graphInspectorEmpty']}>
                                This node adds no further precedence. Any
                                remaining relative order is underdetermined at
                                this rules slice.
                              </div>
                            )}
                          </div>

                          {selectedGraphRelatedCards.length > 0 ? (
                            <div className={styles['graphInspectorSection']}>
                              <h4 className={styles['graphSubhead']}>
                                Related Calls
                              </h4>
                              <ol className={styles['graphInspectorList']}>
                                {selectedGraphRelatedCards.map((card) => (
                                  <li
                                    key={`related-${card.id}`}
                                    className={styles['graphInspectorItem']}
                                  >
                                    <span className={styles['stepLabel']}>
                                      {card.title}
                                    </span>
                                    <span className={styles['stepDetail']}>
                                      {card.summary}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ) : null}
                        </div>
                      </aside>
                    ) : null}
                  </>
                ) : (
                  <div className={styles['graphEmpty']}>
                    Add combatants to generate a precedence graph.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      {editedCombatant && editorTarget && modalRoot
        ? createPortal(
            <>
              <div
                className={styles['modalShadow']}
                onClick={() => setEditorTarget(undefined)}
              />
              <div
                className={styles['modal']}
                role={'dialog'}
                aria-modal={'true'}
                aria-labelledby={'initiative-editor-title'}
              >
                <div
                  id={'initiative-editor-title'}
                  className={styles['modalTitle']}
                >
                  {editorTarget.side === 'party'
                    ? 'Edit Party Combatant'
                    : 'Edit Enemy Combatant'}
                </div>
                <p className={styles['modalText']}>
                  Target declarations are edited from the engagement matrix. Use
                  this modal to change the combatant label, movement, or weapon.
                </p>
                <label
                  className={styles['modalLabel']}
                  htmlFor={`initiative-name-${editedCombatant.key}`}
                >
                  Name
                </label>
                <input
                  id={`initiative-name-${editedCombatant.key}`}
                  className={styles['textInput']}
                  type={'text'}
                  value={editedCombatant.name}
                  onChange={(event) =>
                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      name: event.target.value,
                    })
                  }
                />
                <label className={styles['modalLabel']}>Weapon</label>
                <Select
                  instanceId={`initiative-weapon-${editedCombatant.key}`}
                  styles={customStyles}
                  menuPortalTarget={menuPortalTarget}
                  menuPosition={'fixed'}
                  value={
                    ALL_WEAPON_OPTIONS.find(
                      (option) => option.value === editedCombatant.weaponId
                    ) || null
                  }
                  options={ALL_WEAPON_OPTIONS}
                  onChange={(option: SingleValue<WeaponOption>) => {
                    if (!option) {
                      return;
                    }

                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      weaponId: option.value,
                    });
                  }}
                />
                <label
                  className={styles['modalLabel']}
                  htmlFor={`initiative-move-${editedCombatant.key}`}
                >
                  Movement rate
                </label>
                <input
                  id={`initiative-move-${editedCombatant.key}`}
                  className={styles['textInput']}
                  inputMode={'decimal'}
                  type={'text'}
                  value={editedCombatant.movementRate}
                  onChange={(event) =>
                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      movementRate: event.target.value,
                    })
                  }
                />
                <div className={styles['modalMeta']}>
                  <span className={styles['modalMetaLabel']}>
                    Current display
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {editedCombatantDisplayName}
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {getCombatantMeta(editedCombatant)}
                  </span>
                </div>
                <div className={styles['modalActions']}>
                  <button
                    type={'button'}
                    className={styles['modalButtonDanger']}
                    onClick={() =>
                      removeCombatant(editorTarget.side, editedCombatant.key)
                    }
                  >
                    Remove combatant
                  </button>
                  <button
                    type={'button'}
                    className={styles['modalButton']}
                    onClick={() => setEditorTarget(undefined)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </>,
            modalRoot
          )
        : null}
      {attackEditorTarget &&
      attackEditedAttacker &&
      attackEditedTargetName &&
      modalRoot
        ? createPortal(
            <>
              <div
                className={styles['modalShadow']}
                onClick={() => setAttackEditorTarget(undefined)}
              />
              <div
                className={styles['modal']}
                role={'dialog'}
                aria-modal={'true'}
                aria-labelledby={'initiative-attack-editor-title'}
              >
                <div
                  id={'initiative-attack-editor-title'}
                  className={styles['modalTitle']}
                >
                  Edit Attack Declaration
                </div>
                <p className={styles['modalText']}>
                  Set the action for <strong>{attackEditedAttackerName}</strong>{' '}
                  against <strong>{attackEditedTargetName}</strong>. In this
                  rules slice, the chosen action applies to that
                  combatant&apos;s current round, while any inch distance is
                  stored for this specific target.
                </p>
                <label
                  className={styles['modalLabel']}
                  htmlFor={'initiative-attack-action'}
                >
                  Action
                </label>
                <select
                  id={'initiative-attack-action'}
                  className={styles['selectInput']}
                  value={attackEditorTarget.action}
                  onChange={(event) =>
                    setAttackEditorTarget((previous) =>
                      previous
                        ? {
                            ...previous,
                            action: event.target
                              .value as InitiativeDeclaredAction,
                          }
                        : previous
                    )
                  }
                >
                  {getAvailableActionOptions(attackEditedAttacker.weaponId).map(
                    (option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    )
                  )}
                </select>
                {requiresDistanceInput(attackEditorTarget.action) ? (
                  <>
                    <label
                      className={styles['modalLabel']}
                      htmlFor={'initiative-attack-distance'}
                    >
                      Distance to {attackEditedTargetName} (inches)
                    </label>
                    <input
                      id={'initiative-attack-distance'}
                      className={styles['textInput']}
                      inputMode={'decimal'}
                      type={'text'}
                      placeholder={'e.g. 4'}
                      value={attackEditorTarget.distanceInches}
                      onChange={(event) =>
                        setAttackEditorTarget((previous) =>
                          previous
                            ? {
                                ...previous,
                                distanceInches: event.target.value,
                              }
                            : previous
                        )
                      }
                    />
                    <p className={styles['modalHint']}>
                      Enter the current effective range in tabletop inches. The
                      DM can translate from the actual battlefield during play.
                    </p>
                  </>
                ) : null}
                <div className={styles['modalMeta']}>
                  <span className={styles['modalMetaLabel']}>
                    Current declaration
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {attackEditedAttackerName} → {attackEditedTargetName}
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {formatDeclaredAction(attackEditorTarget.action)}
                    {requiresDistanceInput(attackEditorTarget.action) &&
                    attackEditorTarget.distanceInches.trim().length > 0
                      ? ` · ${attackEditorTarget.distanceInches}"`
                      : ''}
                  </span>
                </div>
                <div className={styles['modalActions']}>
                  <button
                    type={'button'}
                    className={styles['modalButtonDanger']}
                    onClick={clearAttackDeclaration}
                  >
                    Clear attack
                  </button>
                  <div className={styles['modalActionGroup']}>
                    <button
                      type={'button'}
                      className={styles['modalButton']}
                      onClick={() => setAttackEditorTarget(undefined)}
                    >
                      Cancel
                    </button>
                    <button
                      type={'button'}
                      className={styles['modalButton']}
                      onClick={saveAttackDeclaration}
                    >
                      Save attack
                    </button>
                  </div>
                </div>
              </div>
            </>,
            modalRoot
          )
        : null}
    </div>
  );
};

export default InitiativePlayground;

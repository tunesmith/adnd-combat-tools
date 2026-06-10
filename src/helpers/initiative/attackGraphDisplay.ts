import type { InitiativeResolvedRound } from './resolvedRound';
import type {
  InitiativeAttackNode,
  InitiativeDeclaredAction,
  InitiativeScenarioCombatant,
} from '../../types/initiative';

type InitiativeAttackGraphNodeLineKind = 'name' | 'target' | 'action';

interface InitiativeAttackGraphNodeLine {
  text: string;
  kind: InitiativeAttackGraphNodeLineKind;
  isSecondary?: boolean;
}

interface InitiativeAttackGraphNodeDisplay {
  combatantName: string;
  targetLabel: string;
  actionTitle: string;
  actionMeta: string | undefined;
  actionLabel: string;
  lines: InitiativeAttackGraphNodeLine[];
  width: number;
  height: number;
}

interface InitiativeAttackGraphDisplayOptions {
  targetPrefix?: string;
}

const GRAPH_NODE_MIN_WIDTH = 102;
const GRAPH_NODE_MAX_WIDTH = 164;
const GRAPH_NODE_MIN_HEIGHT = 66;
const GRAPH_NODE_HORIZONTAL_PADDING = 14;
const GRAPH_NODE_LINE_GAP = 14;
const GRAPH_NODE_NAME_CHAR_WIDTH = 6.6;
const GRAPH_NODE_TARGET_CHAR_WIDTH = 5.8;
const GRAPH_NODE_ACTION_CHAR_WIDTH = 5.2;

const ACTION_LABELS: Record<InitiativeDeclaredAction, string> = {
  none: 'No combat action',
  'open-melee': 'Open melee',
  close: 'Move/Close',
  charge: 'Charge',
  'set-vs-charge': 'Set vs charge',
  missile: 'Missile',
  'turn-undead': 'Turn undead',
  'magical-device': 'Magical device',
  'spell-casting': 'Cast spell',
};

const truncateGraphText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;

const wrapGraphText = (
  text: string,
  maxLength: number,
  maxLines: number
): string[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxLength) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= maxLines) {
    return lines.map((line) => truncateGraphText(line, maxLength));
  }

  const visibleLines = lines.slice(0, maxLines);
  const remainingText = lines.slice(maxLines - 1).join(' ');
  visibleLines[maxLines - 1] = truncateGraphText(remainingText, maxLength);

  return visibleLines;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const normalizeActionLabel = (value: string | undefined): string =>
  (value || '').trim();

const formatDeclaredAction = (
  declaredAction: InitiativeDeclaredAction
): string => ACTION_LABELS[declaredAction];

const getGraphNodeActionDetail = (
  node: InitiativeAttackNode,
  combatant: InitiativeScenarioCombatant | undefined
): string | undefined => {
  if (node.kind === 'spell-start') {
    return 'start';
  }

  if (node.kind === 'spell-completion') {
    return 'complete';
  }

  if (
    node.kind === 'attack' &&
    node.source === 'routine-component' &&
    node.label === 'attack 1' &&
    (combatant?.attackRoutine.components.length || 0) <= 1
  ) {
    return undefined;
  }

  return node.label;
};

const getGraphActionLines = (
  actionTitle: string,
  actionDetail: string | undefined,
  hasCustomLabel: boolean
): string[] => {
  if (hasCustomLabel) {
    const labelLines = wrapGraphText(actionTitle, 20, 2);
    return actionDetail
      ? labelLines.concat(truncateGraphText(actionDetail, 20))
      : labelLines;
  }

  if (!actionDetail) {
    return [truncateGraphText(actionTitle, 20)];
  }

  return [
    truncateGraphText(actionTitle, 18),
    truncateGraphText(actionDetail, 18),
  ];
};

const estimateGraphNodeLineWidth = (
  text: string,
  kind: InitiativeAttackGraphNodeLineKind
): number =>
  text.length *
  (kind === 'name'
    ? GRAPH_NODE_NAME_CHAR_WIDTH
    : kind === 'target'
    ? GRAPH_NODE_TARGET_CHAR_WIDTH
    : GRAPH_NODE_ACTION_CHAR_WIDTH);

const getGraphNodeWidth = (lines: InitiativeAttackGraphNodeLine[]): number =>
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

const getGraphNodeHeight = (lineCount: number): number =>
  Math.max(
    GRAPH_NODE_MIN_HEIGHT,
    24 + Math.max(0, lineCount - 1) * GRAPH_NODE_LINE_GAP
  );

export const getInitiativeAttackGraphNodeLineYs = (
  height: number,
  lineCount: number
): number[] => {
  const totalSpan = (lineCount - 1) * GRAPH_NODE_LINE_GAP;
  const centerY = height / 2 + 1;

  return Array.from(
    { length: lineCount },
    (_unusedValue, index) =>
      centerY - totalSpan / 2 + index * GRAPH_NODE_LINE_GAP
  );
};

const buildCombatantById = (
  resolvedRound: InitiativeResolvedRound
): Map<string, InitiativeScenarioCombatant> =>
  new Map(
    resolvedRound.scenario.party
      .concat(resolvedRound.scenario.enemies)
      .map((combatant) => [combatant.id, combatant] as const)
  );

const getTargetLabel = (
  node: InitiativeAttackNode,
  combatant: InitiativeScenarioCombatant | undefined,
  combatantNameById: Record<string, string>
): string => {
  if (node.targetId) {
    return combatantNameById[node.targetId] || node.targetId;
  }

  if (combatant?.targetIds.length === 1) {
    const targetId = combatant.targetIds[0];
    return targetId ? combatantNameById[targetId] || targetId : 'No target';
  }

  if ((combatant?.targetIds.length || 0) > 1) {
    return 'Multiple targets';
  }

  return 'No target';
};

export const buildInitiativeAttackGraphNodeDisplayById = (
  resolvedRound: InitiativeResolvedRound,
  options: InitiativeAttackGraphDisplayOptions = {}
): Record<string, InitiativeAttackGraphNodeDisplay> => {
  const combatantById = buildCombatantById(resolvedRound);
  const targetPrefix = options.targetPrefix || '->';

  return Object.fromEntries(
    resolvedRound.attackGraph.nodes.map((node) => {
      const combatantName =
        resolvedRound.viewModel.combatantNameById[node.combatantId] ||
        node.combatantId;
      const combatant = combatantById.get(node.combatantId);
      const targetLabel = getTargetLabel(
        node,
        combatant,
        resolvedRound.viewModel.combatantNameById
      );
      const customActionLabel = normalizeActionLabel(
        node.actionLabel || combatant?.actionLabel
      );
      const actionTitle = combatant
        ? customActionLabel || formatDeclaredAction(combatant.declaredAction)
        : 'Unknown action';
      const actionDetail = getGraphNodeActionDetail(node, combatant);
      const actionType = combatant
        ? formatDeclaredAction(combatant.declaredAction)
        : undefined;
      const actionMeta = combatant
        ? customActionLabel
          ? [actionType, actionDetail]
              .filter((value): value is string => Boolean(value))
              .join(', ')
          : actionDetail
        : actionDetail;
      const actionLabel = actionMeta
        ? `${actionTitle}, ${actionMeta}`
        : actionTitle;
      const actionLines = getGraphActionLines(
        actionTitle,
        actionDetail,
        Boolean(customActionLabel)
      );
      const lines: InitiativeAttackGraphNodeLine[] = [
        {
          text: truncateGraphText(combatantName, 18),
          kind: 'name',
        },
        {
          text: truncateGraphText(`${targetPrefix} ${targetLabel}`, 18),
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
          actionTitle,
          actionMeta: actionMeta || undefined,
          actionLabel,
          lines,
          width: getGraphNodeWidth(lines),
          height: getGraphNodeHeight(lines.length),
        },
      ];
    })
  );
};

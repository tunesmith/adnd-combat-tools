import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, TextareaHTMLAttributes } from 'react';
import {
  addCombatant,
  createInitialTrackerState,
  insertRoundAfterActive,
  removeActiveRound,
  removeCombatant,
  updateCombatant,
} from '../../helpers/trackerState';
import type {
  TrackerActionDeclaration,
  TrackerAttackHand,
  TrackerCombatant,
  TrackerCellState,
  TrackerCombatantRoundState,
  TrackerRound,
  TrackerState,
} from '../../types/tracker';
import type {
  InitiativeAttackNode,
  InitiativeDeclaredAction,
  InitiativeScenarioCombatant,
  InitiativeTimingOverride,
} from '../../types/initiative';
import {
  decodeTrackerState,
  encodeTrackerState,
  encodeTrackerStateSync,
} from '../../helpers/trackerCodec';
import {
  buildTrackerShareHash,
  buildTrackerSharePath,
  buildTrackerShareUrl,
  getTrackerEncodedStateFromUrlText,
} from '../../helpers/trackerUrl';
import {
  deleteTrackerLocalDraft,
  getOrCreateTrackerSessionDraftId,
  listTrackerLocalDrafts,
  saveTrackerLocalDraft,
  setTrackerSessionDraftId,
  type TrackerLocalDraftRecord,
} from '../../helpers/trackerLocalDrafts';
import TrackerCell from './TrackerCell';
import TrackerCombatantInput from './TrackerCombatantInput';
import styles from './tracker.module.css';
import { getTrackerCombatantWidestLineWidth } from '../../helpers/trackerCombatantDisplay';
import {
  buildIntentionWizardEntries,
  replaceIntentionWizardEntry,
  type IntentionWizardEntry,
} from '../../helpers/trackerIntentionsWizard';
import {
  buildCombatWizardEntries,
  type CombatWizardEntry,
} from '../../helpers/trackerCombatWizard';
import {
  buildTrackerAttackDetail,
  getTrackerWeaponAdjustmentSummary,
  shouldShowTrackerEffectiveArmorClass,
  type TrackerAttackDetail,
} from '../../helpers/trackerAttackDetail';
import {
  ACTIVATION_SEGMENT_OPTIONS,
  SPELL_CASTING_TIME_OPTIONS,
  formatCastingSegments,
  parseActivationSegments,
  parseCastingSegments,
} from '../../helpers/initiative/actionSegments';
import { buildInitiativeAttackGraphNodeDisplayById } from '../../helpers/initiative/attackGraphDisplay';
import {
  buildInitiativeGraphEnabledNodeIds,
  buildInitiativeGraphInspectorModel,
  getNextInitiativeGraphReadyNodeIdAfterResolving,
  type InitiativeGraphNodeStatus,
} from '../../helpers/initiative/graphInspector';
import { resolveTrackerRoundInitiative } from '../../helpers/initiative/trackerRoundResolution';
import { InitiativeAttackGraphView } from '../initiative/InitiativeAttackGraphView';
import { InitiativeGraphInspectorPanel } from '../initiative/InitiativeGraphInspectorPanel';
import {
  getDefaultTrackerDeclaredAction,
  getTrackerActionDeclarations,
} from '../../helpers/trackerActionDeclarations';
import {
  canSetAgainstCharge,
  getWeaponInfo,
  getWeaponOptions,
} from '../../tables/weapon';

interface CombatTrackerProps {
  rememberedState?: TrackerState;
  loadedFromEncodedState?: boolean;
}

type TrackerSide = 'party' | 'enemy';
type AttackDetailDirection = 'enemyToParty' | 'partyToEnemy';
type RoundField = 'partyInitiative' | 'enemyInitiative' | 'summary';
type RoundCombatantField = keyof TrackerCombatantRoundState;
type CellField = Extract<
  keyof TrackerCellState,
  'enemyToParty' | 'partyToEnemy'
>;
type CellVisibilityField = Extract<
  keyof TrackerCellState,
  'enemyToPartyVisible' | 'partyToEnemyVisible'
>;
type CellActionIdsField = Extract<
  keyof TrackerCellState,
  'enemyToPartyActionIds' | 'partyToEnemyActionIds'
>;

interface AttackDetailTarget {
  enemyIndex: number;
  partyIndex: number;
  direction: AttackDetailDirection;
  hand: TrackerAttackHand;
}

interface CellActionAssignmentTarget {
  enemyIndex: number;
  partyIndex: number;
  direction: AttackDetailDirection;
}

interface SelectedCellActionAssignment {
  sourceName: string;
  targetName: string;
  rowIndex: number;
  columnIndex: number;
  field: CellActionIdsField;
  options: CellActionOption[];
}

interface CombatTargetEditorScope {
  side: TrackerSide;
  index: number;
  combatantName: string;
  targetIndices: number[];
}

type TrackerActionEditorMode = InitiativeDeclaredAction;

interface TrackerActionEditorTarget {
  side: TrackerSide;
  index: number;
  selectedActionId: string;
}

interface TrackerActionEditorDraft {
  id: string;
  mode: TrackerActionEditorMode;
  label: string;
  initiativeTiming: InitiativeTimingOverride;
  distanceInches: string;
  activationSegments: string;
  castingSegments: string;
  attackRoutineCount: string;
}

const INITIATIVE_TIMING_OPTIONS: Array<{
  value: InitiativeTimingOverride;
  label: string;
}> = [
  { value: 'normal', label: 'Normal initiative' },
  { value: 'wins-initiative', label: 'Wins initiative' },
  { value: 'loses-initiative', label: 'Loses initiative' },
];

const ACTION_EDITOR_MODE_OPTIONS: Array<{
  value: TrackerActionEditorMode;
  label: string;
}> = [
  { value: 'none', label: 'No combat action' },
  { value: 'open-melee', label: 'Open melee' },
  { value: 'close', label: 'Move/Close' },
  { value: 'charge', label: 'Charge' },
  { value: 'set-vs-charge', label: 'Set vs charge' },
  { value: 'missile', label: 'Missile' },
  { value: 'turn-undead', label: 'Turn undead' },
  { value: 'magical-device', label: 'Magical device' },
  { value: 'spell-casting', label: 'Cast spell' },
];

const getAvailableActionEditorModeOptions = (
  weaponId: number | undefined
): typeof ACTION_EDITOR_MODE_OPTIONS =>
  ACTION_EDITOR_MODE_OPTIONS.filter(
    (option) =>
      option.value !== 'set-vs-charge' ||
      (weaponId !== undefined && canSetAgainstCharge(weaponId))
  );

const normalizeActionEditorModeForWeapon = (
  declaredAction: InitiativeDeclaredAction,
  weaponId: number | undefined,
  defaultDeclaredAction: InitiativeDeclaredAction
): InitiativeDeclaredAction =>
  declaredAction === 'set-vs-charge' &&
  (weaponId === undefined || !canSetAgainstCharge(weaponId))
    ? defaultDeclaredAction
    : declaredAction;

type TrackerAction =
  | { type: 'replace-state'; state: TrackerState }
  | { type: 'set-title'; value: string }
  | { type: 'set-round-label'; value: string }
  | { type: 'select-round'; index: number }
  | { type: 'set-round-field'; field: RoundField; value: string }
  | {
      type: 'set-cell-visibility';
      rowIndex: number;
      columnIndex: number;
      field: CellVisibilityField;
      value: boolean;
    }
  | {
      type: 'set-cell';
      rowIndex: number;
      columnIndex: number;
      field: CellField;
      value: string;
    }
  | {
      type: 'set-cell-action-ids';
      rowIndex: number;
      columnIndex: number;
      field: CellActionIdsField;
      actionIds: string[] | undefined;
    }
  | {
      type: 'set-party-state';
      index: number;
      field: RoundCombatantField;
      value: string;
    }
  | {
      type: 'set-enemy-state';
      index: number;
      field: RoundCombatantField;
      value: string;
    }
  | {
      type: 'set-combatant-actions';
      side: TrackerSide;
      index: number;
      intention: string;
      actionDeclarations: TrackerActionDeclaration[];
    }
  | {
      type: 'update-combatant';
      side: TrackerSide;
      index: number;
      combatant: TrackerCombatant;
    }
  | { type: 'add-combatant'; side: TrackerSide; key: number }
  | { type: 'remove-combatant'; side: TrackerSide; index: number }
  | { type: 'advance-round' }
  | { type: 'remove-round' };

const partyFieldDefinitions: { key: RoundCombatantField; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'action', label: 'Intention' },
  { key: 'result', label: 'Result' },
  { key: 'effect', label: 'Current Effect' },
  { key: 'notes', label: 'Notes' },
];

const enemyFieldDefinitions = partyFieldDefinitions;
const PARTY_COLUMN_MIN_WIDTH_PX = 112;
const LOCAL_DRAFT_AUTOSAVE_MS = 750;
const URL_WARNING_THRESHOLD = 6000;

const SHARE_URL_COPIED_MS = 2200;
const GRAPH_POPOVER_WIDTH = 320;
const GRAPH_POPOVER_GAP = 14;
const GRAPH_POPOVER_MARGIN = 10;
const GRAPH_POPOVER_FALLBACK_HEIGHT = 320;
const GRAPH_POPOVER_MAX_HEIGHT = 448;

type AutoHeightTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange' | 'value'
> & {
  value: string;
  onChange: (value: string) => void;
};

const AutoHeightTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoHeightTextareaProps
>(function AutoHeightTextarea(
  { className, onInput, value, onChange, rows = 1, ...props },
  forwardedRef
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    resizeTextarea();
  }, [value]);

  return (
    <textarea
      {...props}
      ref={(node) => {
        textareaRef.current = node;

        if (!forwardedRef) {
          return;
        }

        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
          return;
        }

        forwardedRef.current = node;
      }}
      rows={rows}
      className={className}
      value={value}
      onInput={(event) => {
        resizeTextarea();
        onInput?.(event);
      }}
      onChange={(event) => onChange(event.target.value)}
    />
  );
});

const updateCurrentRound = (
  state: TrackerState,
  updater: (round: TrackerRound) => TrackerRound
): TrackerState => ({
  ...state,
  rounds: state.rounds.map((round, roundIndex) =>
    roundIndex === state.activeRound ? updater(round) : round
  ),
});

const getNextCombatantKey = (state: TrackerState): number =>
  Math.max(
    0,
    ...state.rounds.flatMap((round) =>
      round.party.concat(round.enemies).map((combatant) => combatant.key)
    )
  ) + 1;

const formatDraftNameSummary = (names: string[]): string => {
  if (names.length === 0) {
    return 'Unnamed';
  }

  if (names.length <= 2) {
    return names.join(', ');
  }

  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
};

const formatDraftSavedAt = (updatedAt: number): string =>
  new Date(updatedAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatDraftTitle = (draft: TrackerLocalDraftRecord): string =>
  draft.title?.trim()
    ? draft.title
    : `${formatDraftNameSummary(draft.partyNames)} vs ${formatDraftNameSummary(
        draft.enemyNames
      )}`;

const getActionCombatant = (
  round: TrackerRound,
  side: TrackerSide,
  index: number
): TrackerCombatant | undefined =>
  side === 'party' ? round.party[index] : round.enemies[index];

const getActionRoundState = (
  round: TrackerRound,
  side: TrackerSide,
  index: number
): TrackerCombatantRoundState | undefined =>
  side === 'party' ? round.partyStates[index] : round.enemyStates[index];

const getStructuredActionsForCombatant = (
  round: TrackerRound,
  side: TrackerSide,
  index: number
): TrackerActionDeclaration[] => {
  const combatant = getActionCombatant(round, side, index);

  if (!combatant) {
    return [];
  }

  return (round.actions || []).filter(
    (action) => action.side === side && action.combatantKey === combatant.key
  );
};

interface CellActionOption {
  id: string;
  title: string;
  summary: string;
}

const getActionIdsField = (
  direction: AttackDetailDirection
): CellActionIdsField =>
  direction === 'partyToEnemy'
    ? 'partyToEnemyActionIds'
    : 'enemyToPartyActionIds';

const getCellActionIds = (
  cell: TrackerCellState,
  direction: AttackDetailDirection
): string[] => cell[getActionIdsField(direction)] || [];

const filterActionIds = (
  actionIds: string[] | undefined,
  validActionIds: Set<string>
): string[] | undefined => {
  const nextActionIds = (actionIds || []).filter((actionId) =>
    validActionIds.has(actionId)
  );

  return nextActionIds.length > 0 ? nextActionIds : undefined;
};

const pruneCellActionAssignments = (
  round: TrackerRound,
  side: TrackerSide,
  index: number,
  validActionIds: Set<string>
): TrackerRound => ({
  ...round,
  cells: round.cells.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      if (side === 'party' && columnIndex === index) {
        return {
          ...cell,
          partyToEnemyActionIds: filterActionIds(
            cell.partyToEnemyActionIds,
            validActionIds
          ),
        };
      }

      if (side === 'enemy' && rowIndex === index) {
        return {
          ...cell,
          enemyToPartyActionIds: filterActionIds(
            cell.enemyToPartyActionIds,
            validActionIds
          ),
        };
      }

      return cell;
    })
  ),
});

const getTrackerActionId = (
  side: TrackerSide,
  combatantKey: number,
  actionId: string
): string => `${side}:${combatantKey}:${actionId}`;

const getMainTrackerActionId = (
  side: TrackerSide,
  combatantKey: number
): string => getTrackerActionId(side, combatantKey, 'main');

const getNextTrackerActionId = (
  side: TrackerSide,
  combatantKey: number,
  drafts: TrackerActionEditorDraft[]
): string => {
  let actionNumber = drafts.length + 1;
  let actionId = getTrackerActionId(
    side,
    combatantKey,
    `action-${actionNumber}`
  );
  const existingIds = new Set(drafts.map((draft) => draft.id));

  while (existingIds.has(actionId)) {
    actionNumber += 1;
    actionId = getTrackerActionId(side, combatantKey, `action-${actionNumber}`);
  }

  return actionId;
};

const getActionDirection = (side: TrackerSide): AttackDetailDirection =>
  side === 'party' ? 'partyToEnemy' : 'enemyToParty';

const getActionTargetSide = (side: TrackerSide): TrackerSide =>
  side === 'party' ? 'enemy' : 'party';

const formatDistanceInches = (distanceInches: number): string =>
  Number.isInteger(distanceInches)
    ? distanceInches.toString()
    : distanceInches.toFixed(1).replace(/\.0$/, '');

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmedValue);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseAttackRoutineCount = (value: string): number | undefined => {
  const parsed = parseOptionalNumber(value);

  if (parsed === undefined) {
    return undefined;
  }

  return Math.max(1, Math.floor(parsed));
};

const requiresActionDistanceInput = (
  declaredAction: InitiativeDeclaredAction
): boolean => declaredAction === 'close' || declaredAction === 'charge';

const hasCombatWizardInitiatives = (
  round: TrackerRound | undefined
): boolean => {
  if (!round) {
    return false;
  }

  return (
    round.partyInitiative.trim().length > 0 &&
    round.enemyInitiative.trim().length > 0
  );
};

const requiresAttackRoutineCountInput = (
  declaredAction: InitiativeDeclaredAction,
  weaponId: number | undefined
): boolean =>
  declaredAction === 'open-melee' &&
  (weaponId === undefined || getWeaponInfo(weaponId)?.weaponType !== 'missile');

const formatDistanceActionIntention = (
  declaredAction: InitiativeDeclaredAction,
  label: string,
  distanceInches: number
): string => {
  const actionLabel = formatDeclaredAction(declaredAction);
  const distanceText = `${formatDistanceInches(distanceInches)}"`;
  return label
    ? `${label} (${distanceText})`
    : `${actionLabel} ${distanceText}`;
};

const formatSpellCastingIntention = (
  label: string,
  castingSegments: number
): string => {
  const timingText = formatCastingSegments(castingSegments);
  return label ? `${label} (${timingText})` : `Cast spell (${timingText})`;
};

const formatActivationSegments = (
  activationSegments: number | undefined
): string => {
  if (activationSegments === undefined) {
    return 'no activation time';
  }

  if (activationSegments >= 10) {
    return '10+ segments';
  }

  return `${activationSegments} ${
    activationSegments === 1 ? 'segment' : 'segments'
  }`;
};

const formatMagicalDeviceIntention = (
  label: string,
  activationSegments: number | undefined
): string => {
  const timingText = formatActivationSegments(activationSegments);
  return label ? `${label} (${timingText})` : `Magical device (${timingText})`;
};

const formatDeclaredAction = (
  declaredAction: TrackerActionDeclaration['declaredAction']
): string => {
  switch (declaredAction) {
    case 'none':
      return 'No combat action';
    case 'open-melee':
      return 'Open melee';
    case 'close':
      return 'Move/Close';
    case 'charge':
      return 'Charge';
    case 'set-vs-charge':
      return 'Set vs charge';
    case 'missile':
      return 'Missile';
    case 'turn-undead':
      return 'Turn undead';
    case 'magical-device':
      return 'Magical device';
    case 'spell-casting':
      return 'Cast spell';
  }
};

const getActionInitiativeTiming = (
  action: Pick<TrackerActionDeclaration, 'initiativeTiming'> | undefined
): InitiativeTimingOverride => action?.initiativeTiming || 'normal';

const getSavedInitiativeTiming = (
  initiativeTiming: InitiativeTimingOverride
): InitiativeTimingOverride | undefined =>
  initiativeTiming === 'normal' ? undefined : initiativeTiming;

const formatInitiativeTimingMeta = (
  initiativeTiming: InitiativeTimingOverride | undefined
): string | undefined => {
  if (!initiativeTiming || initiativeTiming === 'normal') {
    return undefined;
  }

  return initiativeTiming === 'wins-initiative'
    ? 'Wins initiative'
    : 'Loses initiative';
};

const formatAttackRoutineCountMeta = (
  attackRoutineCount: number | undefined
): string | undefined => {
  if (attackRoutineCount === undefined || attackRoutineCount <= 1) {
    return undefined;
  }

  return `${attackRoutineCount} routines`;
};

const getSavedAttackRoutineCount = (
  draft: TrackerActionEditorDraft,
  weaponId: number | undefined
): number | undefined => {
  if (!requiresAttackRoutineCountInput(draft.mode, weaponId)) {
    return undefined;
  }

  const attackRoutineCount = parseAttackRoutineCount(draft.attackRoutineCount);
  return attackRoutineCount !== undefined && attackRoutineCount > 1
    ? attackRoutineCount
    : undefined;
};

const getActionSummaryLines = (
  action: TrackerActionDeclaration | undefined,
  fallbackIntention: string
): string[] => {
  if (!action) {
    return fallbackIntention.trim() ? [fallbackIntention.trim()] : [];
  }

  if (requiresActionDistanceInput(action.declaredAction)) {
    const distanceText =
      action.actionDistanceInches !== undefined
        ? `${formatDistanceInches(action.actionDistanceInches)}"`
        : undefined;
    const label = action.actionLabel?.trim();
    const timingText = formatInitiativeTimingMeta(action.initiativeTiming);
    const actionLabel = formatDeclaredAction(action.declaredAction);

    return [
      label || actionLabel,
      [[actionLabel, distanceText].filter(Boolean).join(' '), timingText]
        .filter(Boolean)
        .join(' · '),
    ];
  }

  if (action.declaredAction === 'spell-casting') {
    const castingText =
      action.castingSegments !== undefined
        ? formatCastingSegments(action.castingSegments)
        : undefined;
    const label = action.actionLabel?.trim();
    const timingText = formatInitiativeTimingMeta(action.initiativeTiming);

    return [
      label || 'Cast spell',
      ['Cast spell', castingText, timingText].filter(Boolean).join(' · '),
    ];
  }

  if (action.declaredAction === 'magical-device') {
    const label = action.actionLabel?.trim();
    const activationText =
      action.activationSegments !== undefined
        ? formatActivationSegments(action.activationSegments)
        : undefined;
    const timingText = formatInitiativeTimingMeta(action.initiativeTiming);

    return [
      label || 'Magical device',
      ['Magical device', activationText, timingText]
        .filter(Boolean)
        .join(' · '),
    ];
  }

  const label =
    action.actionLabel ||
    action.intention ||
    formatDeclaredAction(action.declaredAction);
  const timingText = formatInitiativeTimingMeta(action.initiativeTiming);
  const attackRoutineCountText =
    action.declaredAction === 'open-melee'
      ? formatAttackRoutineCountMeta(action.attackRoutineCount)
      : undefined;
  const metaLine = [
    action.actionLabel
      ? formatDeclaredAction(action.declaredAction)
      : undefined,
    attackRoutineCountText,
    timingText,
  ]
    .filter(Boolean)
    .join(' · ');

  return metaLine ? [label, metaLine] : [label];
};

const getActionListSummaryLines = (
  actions: TrackerActionDeclaration[],
  fallbackIntention: string
): string[] => {
  if (actions.length === 0) {
    return fallbackIntention.trim() ? [fallbackIntention.trim()] : [];
  }

  if (actions.length === 1) {
    return getActionSummaryLines(actions[0], fallbackIntention);
  }

  return actions.flatMap((action, actionIndex) => {
    const lines = getActionSummaryLines(action, '');
    const title = actionIndex === 0 ? 'Main' : `Action ${actionIndex + 1}`;
    const primary = lines[0] || formatDeclaredAction(action.declaredAction);
    const secondary = lines[1];

    return [`${title}: ${primary}`, ...(secondary ? [secondary] : [])];
  });
};

const getCellActionOptions = (
  actions: TrackerActionDeclaration[]
): CellActionOption[] =>
  actions.flatMap((action, actionIndex) => {
    if (action.usesGridTargets === false) {
      return [];
    }

    const lines = getActionSummaryLines(action, '');
    const summary =
      lines.join(' · ') || formatDeclaredAction(action.declaredAction);

    return [
      {
        id: action.id,
        title: actionIndex === 0 ? 'Main' : `Action ${actionIndex + 1}`,
        summary,
      },
    ];
  });

const getCellActionAssignmentLabel = (
  options: CellActionOption[],
  assignedActionIds: string[]
): string | undefined => {
  if (options.length < 2) {
    return undefined;
  }

  const optionIds = new Set(options.map((option) => option.id));
  const selectedActionIds = assignedActionIds.filter((actionId) =>
    optionIds.has(actionId)
  );

  if (
    selectedActionIds.length === 0 ||
    selectedActionIds.length === options.length
  ) {
    return 'All actions';
  }

  if (selectedActionIds.length === 1) {
    return options.find((option) => option.id === selectedActionIds[0])?.title;
  }

  return `${selectedActionIds.length} actions`;
};

const getActionDraftSummary = (draft: TrackerActionEditorDraft): string => {
  const label = draft.label.trim();
  const actionType = formatDeclaredAction(draft.mode);
  const title = label || actionType;
  const actionTypeMeta = label ? actionType : undefined;
  const timingText = formatInitiativeTimingMeta(draft.initiativeTiming);
  const attackRoutineCountText =
    draft.mode === 'open-melee'
      ? formatAttackRoutineCountMeta(
          parseAttackRoutineCount(draft.attackRoutineCount)
        )
      : undefined;

  return [title, actionTypeMeta, attackRoutineCountText, timingText]
    .filter(Boolean)
    .join(' · ');
};

const createActionEditorDraft = (
  action: TrackerActionDeclaration | undefined,
  fallbackIntention: string,
  fallbackActionId: string,
  defaultDeclaredAction: InitiativeDeclaredAction,
  weaponId: number | undefined
): TrackerActionEditorDraft => {
  if (
    action?.declaredAction &&
    requiresActionDistanceInput(action.declaredAction)
  ) {
    return {
      id: action.id,
      mode: action.declaredAction,
      label: action.actionLabel || '',
      initiativeTiming: getActionInitiativeTiming(action),
      distanceInches:
        action.actionDistanceInches !== undefined
          ? formatDistanceInches(action.actionDistanceInches)
          : '',
      activationSegments: '',
      castingSegments: '1',
      attackRoutineCount: '1',
    };
  }

  if (action?.declaredAction === 'spell-casting') {
    return {
      id: action.id,
      mode: 'spell-casting',
      label: action.actionLabel || '',
      initiativeTiming: getActionInitiativeTiming(action),
      distanceInches: '',
      activationSegments: '',
      castingSegments:
        action.castingSegments !== undefined
          ? action.castingSegments.toString()
          : '1',
      attackRoutineCount: '1',
    };
  }

  if (action?.declaredAction === 'magical-device') {
    return {
      id: action.id,
      mode: 'magical-device',
      label: action.actionLabel || '',
      initiativeTiming: getActionInitiativeTiming(action),
      distanceInches: '',
      activationSegments:
        action.activationSegments !== undefined
          ? action.activationSegments.toString()
          : '',
      castingSegments: '1',
      attackRoutineCount: '1',
    };
  }

  return {
    id: action?.id || fallbackActionId,
    mode: normalizeActionEditorModeForWeapon(
      action?.declaredAction || defaultDeclaredAction,
      weaponId,
      defaultDeclaredAction
    ),
    label: action?.actionLabel || action?.intention || fallbackIntention,
    initiativeTiming: getActionInitiativeTiming(action),
    distanceInches: '',
    activationSegments: '',
    castingSegments: '1',
    attackRoutineCount:
      action?.attackRoutineCount !== undefined
        ? action.attackRoutineCount.toString()
        : '1',
  };
};

const createAddedActionEditorDraft = (
  id: string,
  defaultDeclaredAction: InitiativeDeclaredAction
): TrackerActionEditorDraft => ({
  id,
  mode: defaultDeclaredAction,
  label: '',
  initiativeTiming: 'normal',
  distanceInches: '',
  activationSegments: '',
  castingSegments: '1',
  attackRoutineCount: '1',
});

type BuildActionDeclarationResult =
  | {
      ok: true;
      intention: string;
      actionDeclarations: TrackerActionDeclaration[];
    }
  | {
      ok: false;
      error: string;
    };

const buildActionDeclarationsFromDrafts = ({
  side,
  index,
  combatant,
  roundState,
  drafts,
}: {
  side: TrackerSide;
  index: number;
  combatant: TrackerCombatant;
  roundState: TrackerCombatantRoundState | undefined;
  drafts: TrackerActionEditorDraft[];
}): BuildActionDeclarationResult => {
  const defaultDeclaredAction = getDefaultTrackerDeclaredAction(combatant);
  const effectiveDrafts = drafts.length
    ? drafts
    : [
        createActionEditorDraft(
          undefined,
          roundState?.action || '',
          getMainTrackerActionId(side, combatant.key),
          defaultDeclaredAction,
          combatant.weapon
        ),
      ];
  const mustStoreExplicitActions =
    effectiveDrafts.length > 1 ||
    effectiveDrafts.some(
      (draft) =>
        draft.mode !== defaultDeclaredAction ||
        getSavedInitiativeTiming(draft.initiativeTiming) !== undefined ||
        getSavedAttackRoutineCount(draft, combatant.weapon) !== undefined
    );
  const actionDeclarations: TrackerActionDeclaration[] = [];

  for (const draft of effectiveDrafts) {
    const label = draft.label.trim();
    const savedInitiativeTiming = getSavedInitiativeTiming(
      draft.initiativeTiming
    );
    const attackRoutineCountInput = draft.attackRoutineCount.trim();
    const savedAttackRoutineCount = getSavedAttackRoutineCount(
      draft,
      combatant.weapon
    );

    if (
      requiresAttackRoutineCountInput(draft.mode, combatant.weapon) &&
      attackRoutineCountInput.length > 0 &&
      parseAttackRoutineCount(attackRoutineCountInput) === undefined
    ) {
      return {
        ok: false,
        error: 'Attack routines this round must be a number.',
      };
    }

    const actionDeclarationBase = {
      id: draft.id,
      source: 'intention' as const,
      side,
      direction: getActionDirection(side),
      combatantKey: combatant.key,
      combatantIndex: index,
      targetSide: getActionTargetSide(side),
      ...(savedInitiativeTiming
        ? { initiativeTiming: savedInitiativeTiming }
        : {}),
      weaponId: combatant.weapon,
      result: roundState?.result || '',
      targetDeclarations: [],
    };

    if (
      !requiresActionDistanceInput(draft.mode) &&
      draft.mode !== 'spell-casting' &&
      draft.mode !== 'magical-device'
    ) {
      if (mustStoreExplicitActions) {
        actionDeclarations.push({
          ...actionDeclarationBase,
          declaredAction: draft.mode,
          ...(label ? { actionLabel: label } : {}),
          ...(savedAttackRoutineCount !== undefined
            ? { attackRoutineCount: savedAttackRoutineCount }
            : {}),
          intention: label || formatDeclaredAction(draft.mode),
        });
      }

      continue;
    }

    if (draft.mode === 'spell-casting') {
      const castingSegments = parseCastingSegments(draft.castingSegments);

      if (castingSegments === undefined) {
        return { ok: false, error: 'Cast spell needs a casting time.' };
      }

      const intention = formatSpellCastingIntention(label, castingSegments);
      actionDeclarations.push({
        ...actionDeclarationBase,
        declaredAction: 'spell-casting',
        ...(label ? { actionLabel: label } : {}),
        castingSegments,
        intention,
      });
      continue;
    }

    if (draft.mode === 'magical-device') {
      const activationSegmentInput = draft.activationSegments.trim();
      const activationSegments =
        activationSegmentInput.length > 0
          ? parseActivationSegments(activationSegmentInput)
          : undefined;

      if (
        activationSegmentInput.length > 0 &&
        activationSegments === undefined
      ) {
        return {
          ok: false,
          error: 'Magical device activation time is invalid.',
        };
      }

      const intention = formatMagicalDeviceIntention(label, activationSegments);
      actionDeclarations.push({
        ...actionDeclarationBase,
        declaredAction: 'magical-device',
        ...(label ? { actionLabel: label } : {}),
        ...(activationSegments !== undefined ? { activationSegments } : {}),
        intention,
      });
      continue;
    }

    const distanceInches = Number(draft.distanceInches);

    if (!Number.isFinite(distanceInches) || distanceInches <= 0) {
      return {
        ok: false,
        error: `${formatDeclaredAction(
          draft.mode
        )} needs a distance greater than 0".`,
      };
    }

    const intention = formatDistanceActionIntention(
      draft.mode,
      label,
      distanceInches
    );
    actionDeclarations.push({
      ...actionDeclarationBase,
      declaredAction: draft.mode,
      ...(label ? { actionLabel: label } : {}),
      actionDistanceInches: distanceInches,
      intention,
    });
  }

  return {
    ok: true,
    intention:
      actionDeclarations.length > 0
        ? actionDeclarations.map((action) => action.intention).join('; ')
        : effectiveDrafts[0]?.label.trim() || '',
    actionDeclarations,
  };
};

const getActionEditorDrafts = ({
  actions,
  fallbackIntention,
  mainActionId,
  defaultDeclaredAction,
  weaponId,
}: {
  actions: TrackerActionDeclaration[];
  fallbackIntention: string;
  mainActionId: string;
  defaultDeclaredAction: InitiativeDeclaredAction;
  weaponId: number | undefined;
}): TrackerActionEditorDraft[] =>
  actions.length > 0
    ? actions.map((action) =>
        createActionEditorDraft(
          action,
          '',
          mainActionId,
          defaultDeclaredAction,
          weaponId
        )
      )
    : [
        createActionEditorDraft(
          undefined,
          fallbackIntention,
          mainActionId,
          defaultDeclaredAction,
          weaponId
        ),
      ];

const getIntentionWizardActionDrafts = (
  round: TrackerRound,
  entry: IntentionWizardEntry
): TrackerActionEditorDraft[] => {
  const combatant = getActionCombatant(round, entry.side, entry.index);
  const roundState = getActionRoundState(round, entry.side, entry.index);

  if (!combatant) {
    return [];
  }

  return getActionEditorDrafts({
    actions: getStructuredActionsForCombatant(round, entry.side, entry.index),
    fallbackIntention: roundState?.action || '',
    mainActionId: getMainTrackerActionId(entry.side, combatant.key),
    defaultDeclaredAction: getDefaultTrackerDeclaredAction(combatant),
    weaponId: combatant.weapon,
  });
};

const getDefaultCombatWizardActionId = (
  round: TrackerRound,
  entry: CombatWizardEntry | undefined
): string => getCombatWizardActionsForEntry(round, entry)[0]?.id || '';

const getCombatWizardActionsForEntry = (
  round: TrackerRound,
  entry: CombatWizardEntry | undefined
): TrackerActionDeclaration[] => {
  const combatant = entry
    ? getActionCombatant(round, entry.side, entry.index)
    : undefined;

  if (!entry || !combatant) {
    return [];
  }

  return getTrackerActionDeclarations(round).filter(
    (action) =>
      action.side === entry.side && action.combatantKey === combatant.key
  );
};

const getCombatFlowActionForCombatant = (
  round: TrackerRound,
  combatant: InitiativeScenarioCombatant | undefined
): TrackerActionDeclaration | undefined => {
  if (!combatant?.actionId) {
    return undefined;
  }

  const sourceCombatantKey =
    combatant.ownerCombatantKey ?? combatant.combatantKey;

  return getTrackerActionDeclarations(round).find(
    (action) =>
      action.id === combatant.actionId &&
      action.side === combatant.side &&
      action.combatantKey === sourceCombatantKey
  );
};

const getUniqueTargetIndices = (targetIndices: number[]): number[] =>
  Array.from(new Set(targetIndices));

const getCombatFlowNodeTargetIndices = (
  node: InitiativeAttackNode,
  combatant: InitiativeScenarioCombatant,
  action: TrackerActionDeclaration | undefined,
  combatants: InitiativeScenarioCombatant[]
): number[] => {
  if (action?.usesGridTargets === false) {
    return [];
  }

  if (node.targetId) {
    const target = combatants.find(
      (candidate) =>
        candidate.id === node.targetId && candidate.side !== combatant.side
    );

    return target ? [target.index] : [];
  }

  if (action) {
    return getUniqueTargetIndices(
      action.targetDeclarations.map(
        (targetDeclaration) => targetDeclaration.targetCombatantIndex
      )
    );
  }

  return getUniqueTargetIndices(
    combatant.targetIds.flatMap((targetId) => {
      const target = combatants.find(
        (candidate) =>
          candidate.id === targetId && candidate.side !== combatant.side
      );

      return target ? [target.index] : [];
    })
  );
};

const formatCombatFlowNodeTiming = (node: InitiativeAttackNode): string => {
  if (node.segment !== undefined) {
    return `Segment ${node.segment}`;
  }

  if (node.kind === 'spell-start') {
    return 'Spell starts';
  }

  if (node.kind === 'spell-completion') {
    return 'Spell completes';
  }

  return 'Unsegmented';
};

const trackerReducer = (
  state: TrackerState,
  action: TrackerAction
): TrackerState => {
  switch (action.type) {
    case 'replace-state':
      return action.state;
    case 'set-title':
      return {
        ...state,
        title: action.value || undefined,
      };
    case 'set-round-label':
      return updateCurrentRound(state, (round) => ({
        ...round,
        label: action.value,
      }));
    case 'select-round':
      return {
        ...state,
        activeRound: action.index,
      };
    case 'set-round-field':
      return updateCurrentRound(state, (round) => ({
        ...round,
        [action.field]: action.value,
      }));
    case 'set-cell-visibility':
      return updateCurrentRound(state, (round) => ({
        ...round,
        cells: round.cells.map((row, rowIndex) =>
          rowIndex === action.rowIndex
            ? row.map((cell, columnIndex) =>
                columnIndex === action.columnIndex
                  ? {
                      ...cell,
                      [action.field]: action.value,
                    }
                  : cell
              )
            : row
        ),
      }));
    case 'set-cell':
      return updateCurrentRound(state, (round) => ({
        ...round,
        cells: round.cells.map((row, rowIndex) =>
          rowIndex === action.rowIndex
            ? row.map((cell, columnIndex) =>
                columnIndex === action.columnIndex
                  ? {
                      ...cell,
                      [action.field]: action.value,
                      ...(action.field === 'enemyToParty'
                        ? { enemyToPartyVisible: true }
                        : { partyToEnemyVisible: true }),
                    }
                  : cell
              )
            : row
        ),
      }));
    case 'set-cell-action-ids':
      return updateCurrentRound(state, (round) => ({
        ...round,
        cells: round.cells.map((row, rowIndex) =>
          rowIndex === action.rowIndex
            ? row.map((cell, columnIndex) =>
                columnIndex === action.columnIndex
                  ? {
                      ...cell,
                      [action.field]: action.actionIds,
                      ...(action.field === 'enemyToPartyActionIds'
                        ? { enemyToPartyVisible: true }
                        : { partyToEnemyVisible: true }),
                    }
                  : cell
              )
            : row
        ),
      }));
    case 'set-party-state':
      return updateCurrentRound(state, (round) => ({
        ...round,
        partyStates: round.partyStates.map((partyState, partyIndex) =>
          partyIndex === action.index
            ? {
                ...partyState,
                [action.field]: action.value,
              }
            : partyState
        ),
      }));
    case 'set-enemy-state':
      return updateCurrentRound(state, (round) => ({
        ...round,
        enemyStates: round.enemyStates.map((enemyState, enemyIndex) =>
          enemyIndex === action.index
            ? {
                ...enemyState,
                [action.field]: action.value,
              }
            : enemyState
        ),
      }));
    case 'set-combatant-actions':
      return updateCurrentRound(state, (round) => {
        const combatant = getActionCombatant(round, action.side, action.index);

        if (!combatant) {
          return round;
        }

        const nextActions = (round.actions || []).filter(
          (roundAction) =>
            !(
              roundAction.side === action.side &&
              roundAction.combatantKey === combatant.key
            )
        );
        const combinedActions = nextActions.concat(action.actionDeclarations);
        const nextRound = pruneCellActionAssignments(
          {
            ...round,
            actions: combinedActions.length > 0 ? combinedActions : undefined,
          },
          action.side,
          action.index,
          new Set(
            action.actionDeclarations.map((declaration) => declaration.id)
          )
        );

        if (action.side === 'party') {
          return {
            ...nextRound,
            partyStates: nextRound.partyStates.map((partyState, partyIndex) =>
              partyIndex === action.index
                ? {
                    ...partyState,
                    action: action.intention,
                  }
                : partyState
            ),
          };
        }

        return {
          ...nextRound,
          enemyStates: nextRound.enemyStates.map((enemyState, enemyIndex) =>
            enemyIndex === action.index
              ? {
                  ...enemyState,
                  action: action.intention,
                }
              : enemyState
          ),
        };
      });
    case 'update-combatant':
      return updateCombatant(
        state,
        action.side,
        action.index,
        action.combatant
      );
    case 'add-combatant':
      return addCombatant(state, action.side, action.key);
    case 'remove-combatant': {
      const activeRound = state.rounds[state.activeRound];
      if (
        (action.side === 'party' && (activeRound?.party.length || 0) <= 1) ||
        (action.side === 'enemy' && (activeRound?.enemies.length || 0) <= 1)
      ) {
        return state;
      }
      return removeCombatant(state, action.side, action.index);
    }
    case 'advance-round':
      return insertRoundAfterActive(state);
    case 'remove-round':
      return removeActiveRound(state);
    default:
      return state;
  }
};

const CombatTracker = ({
  rememberedState,
  loadedFromEncodedState = false,
}: CombatTrackerProps) => {
  const initialState = useMemo<TrackerState>(
    () => rememberedState || createInitialTrackerState(),
    [rememberedState]
  );
  const initialStateRef = useRef<TrackerState>(initialState);
  const [encodedTrackerState, setEncodedTrackerState] = useState<
    string | undefined
  >(undefined);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [savedDrafts, setSavedDrafts] = useState<TrackerLocalDraftRecord[]>([]);
  const [showRecoverModal, setShowRecoverModal] = useState<boolean>(false);
  const [recoverError, setRecoverError] = useState<string | undefined>(
    undefined
  );
  const [autosavePaused, setAutosavePaused] = useState<boolean>(false);
  const [hasLocalDraft, setHasLocalDraft] = useState<boolean>(false);
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState<number | undefined>(
    undefined
  );
  const [recoveringDraftId, setRecoveringDraftId] = useState<
    string | undefined
  >(undefined);
  const [showUrlWarning, setShowUrlWarning] = useState<boolean>(false);
  const [urlWarningLength, setUrlWarningLength] = useState<number>(0);
  const [addressBarUrlTruncated, setAddressBarUrlTruncated] =
    useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareModalUrl, setShareModalUrl] = useState<string | undefined>(
    undefined
  );
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importUrlValue, setImportUrlValue] = useState<string>('');
  const [importError, setImportError] = useState<string | undefined>(undefined);
  const [importingShareUrl, setImportingShareUrl] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);
  const [showDeleteRoundModal, setShowDeleteRoundModal] =
    useState<boolean>(false);
  const [showIntentionsWizard, setShowIntentionsWizard] =
    useState<boolean>(false);
  const [intentionWizardEntries, setIntentionWizardEntries] = useState<
    IntentionWizardEntry[]
  >([]);
  const [intentionWizardIndex, setIntentionWizardIndex] = useState<number>(0);
  const [intentionResolvedOnEntry, setIntentionResolvedOnEntry] =
    useState<boolean>(false);
  const [
    intentionWizardAnchorKeysByRound,
    setIntentionWizardAnchorKeysByRound,
  ] = useState<Record<number, number | undefined>>({});
  const [showCombatWizard, setShowCombatWizard] = useState<boolean>(false);
  const [combatWizardIndex, setCombatWizardIndex] = useState<number>(0);
  const [combatResolvedOnEntry, setCombatResolvedOnEntry] =
    useState<boolean>(false);
  const [combatWizardSelectedActionId, setCombatWizardSelectedActionId] =
    useState<string>('');
  const [combatWizardAnchorKeysByRound, setCombatWizardAnchorKeysByRound] =
    useState<Record<number, number | undefined>>({});
  const [attackDetailTarget, setAttackDetailTarget] = useState<
    AttackDetailTarget | undefined
  >(undefined);
  const [cellActionAssignmentTarget, setCellActionAssignmentTarget] = useState<
    CellActionAssignmentTarget | undefined
  >(undefined);
  const [cellActionAssignmentDraftIds, setCellActionAssignmentDraftIds] =
    useState<string[]>([]);
  const [cellActionAssignmentError, setCellActionAssignmentError] = useState<
    string | undefined
  >(undefined);
  const [actionEditorTarget, setActionEditorTarget] = useState<
    TrackerActionEditorTarget | undefined
  >(undefined);
  const [actionEditorDrafts, setActionEditorDrafts] = useState<
    TrackerActionEditorDraft[]
  >([]);
  const [actionEditorError, setActionEditorError] = useState<
    string | undefined
  >(undefined);
  const [intentionWizardActionDrafts, setIntentionWizardActionDrafts] =
    useState<TrackerActionEditorDraft[]>([]);
  const [intentionWizardSelectedActionId, setIntentionWizardSelectedActionId] =
    useState<string>('');
  const [intentionWizardActionError, setIntentionWizardActionError] = useState<
    string | undefined
  >(undefined);
  const [
    combatFlowCompletedNodeIdsByRound,
    setCombatFlowCompletedNodeIdsByRound,
  ] = useState<Record<number, string[]>>({});
  const [
    combatFlowSelectedNodeIdsByRound,
    setCombatFlowSelectedNodeIdsByRound,
  ] = useState<Record<number, string | undefined>>({});
  const [combatFlowGraphInspectorNodeId, setCombatFlowGraphInspectorNodeId] =
    useState<string | undefined>(undefined);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleDraft, setTitleDraft] = useState<string>('');
  const [isEditingRoundLabel, setIsEditingRoundLabel] =
    useState<boolean>(false);
  const [roundLabelDraft, setRoundLabelDraft] = useState<string>('');
  const idCounter = useRef<number>(getNextCombatantKey(initialState));
  const pausedEncodedState = useRef<string | undefined>(undefined);
  const urlWarningShown = useRef<boolean>(false);
  const recoverPromptHandled = useRef<boolean>(false);
  const shareTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const importTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const combatResultTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const combatFlowGraphInspectorRef = useRef<HTMLDivElement | null>(null);
  const combatFlowGraphContainerRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const roundLabelInputRef = useRef<HTMLInputElement | null>(null);
  const moreActionsRef = useRef<HTMLDivElement | null>(null);
  const [combatFlowGraphInspectorHeight, setCombatFlowGraphInspectorHeight] =
    useState<number>(GRAPH_POPOVER_FALLBACK_HEIGHT);
  const [
    combatFlowGraphInspectorPosition,
    setCombatFlowGraphInspectorPosition,
  ] = useState<CSSProperties | undefined>(undefined);

  const [state, dispatch] = useReducer(trackerReducer, initialState);
  const currentRound = state.rounds[state.activeRound];
  const currentRoundLabel = currentRound?.label || '';
  const trackerTitle = state.title || '';
  const currentIntentionWizardEntry =
    intentionWizardEntries[intentionWizardIndex];
  const selectedAttackDetail = useMemo<TrackerAttackDetail | undefined>(() => {
    if (!currentRound || !attackDetailTarget) {
      return undefined;
    }

    const enemyCombatant = currentRound.enemies[attackDetailTarget.enemyIndex];
    const partyCombatant = currentRound.party[attackDetailTarget.partyIndex];

    if (!enemyCombatant || !partyCombatant) {
      return undefined;
    }

    const attacker =
      attackDetailTarget.direction === 'enemyToParty'
        ? enemyCombatant
        : partyCombatant;
    const attackWeapon =
      attackDetailTarget.hand === 'offHand'
        ? attacker.offHandWeapon
        : attacker.weapon;

    if (!attackWeapon) {
      return undefined;
    }

    return attackDetailTarget.direction === 'enemyToParty'
      ? buildTrackerAttackDetail(
          enemyCombatant,
          partyCombatant,
          `Enemy ${attackDetailTarget.enemyIndex + 1}`,
          `Party ${attackDetailTarget.partyIndex + 1}`,
          attackWeapon
        )
      : buildTrackerAttackDetail(
          partyCombatant,
          enemyCombatant,
          `Party ${attackDetailTarget.partyIndex + 1}`,
          `Enemy ${attackDetailTarget.enemyIndex + 1}`,
          attackWeapon
        );
  }, [attackDetailTarget, currentRound]);
  const selectedAttackHasOffHand = useMemo<boolean>(() => {
    if (!currentRound || !attackDetailTarget) {
      return false;
    }

    const attacker =
      attackDetailTarget.direction === 'enemyToParty'
        ? currentRound.enemies[attackDetailTarget.enemyIndex]
        : currentRound.party[attackDetailTarget.partyIndex];

    return Boolean(attacker?.offHandWeapon);
  }, [attackDetailTarget, currentRound]);
  const selectedCellActionAssignment = useMemo(():
    | SelectedCellActionAssignment
    | undefined => {
    if (!currentRound || !cellActionAssignmentTarget) {
      return undefined;
    }

    const enemyCombatant =
      currentRound.enemies[cellActionAssignmentTarget.enemyIndex];
    const partyCombatant =
      currentRound.party[cellActionAssignmentTarget.partyIndex];
    const cell =
      currentRound.cells[cellActionAssignmentTarget.enemyIndex]?.[
        cellActionAssignmentTarget.partyIndex
      ];

    if (!enemyCombatant || !partyCombatant || !cell) {
      return undefined;
    }

    const sourceSide =
      cellActionAssignmentTarget.direction === 'partyToEnemy'
        ? 'party'
        : 'enemy';
    const sourceIndex =
      sourceSide === 'party'
        ? cellActionAssignmentTarget.partyIndex
        : cellActionAssignmentTarget.enemyIndex;
    const sourceName =
      sourceSide === 'party'
        ? partyCombatant.name || `Party ${sourceIndex + 1}`
        : enemyCombatant.name || `Enemy ${sourceIndex + 1}`;
    const targetName =
      sourceSide === 'party'
        ? enemyCombatant.name ||
          `Enemy ${cellActionAssignmentTarget.enemyIndex + 1}`
        : partyCombatant.name ||
          `Party ${cellActionAssignmentTarget.partyIndex + 1}`;
    const options = getCellActionOptions(
      getStructuredActionsForCombatant(currentRound, sourceSide, sourceIndex)
    );

    return {
      sourceName,
      targetName,
      rowIndex: cellActionAssignmentTarget.enemyIndex,
      columnIndex: cellActionAssignmentTarget.partyIndex,
      field: getActionIdsField(cellActionAssignmentTarget.direction),
      options,
    };
  }, [cellActionAssignmentTarget, currentRound]);
  const canOpenCombatWizard = hasCombatWizardInitiatives(currentRound);
  const combatWizardEntries = useMemo<CombatWizardEntry[]>(
    () => (currentRound ? buildCombatWizardEntries(currentRound) : []),
    [currentRound]
  );
  const resolvedInitiativeRound = useMemo(
    () =>
      currentRound && canOpenCombatWizard
        ? resolveTrackerRoundInitiative(currentRound)
        : undefined,
    [canOpenCombatWizard, currentRound]
  );
  const combatFlowNodeDisplayById = useMemo(
    () =>
      resolvedInitiativeRound
        ? buildInitiativeAttackGraphNodeDisplayById(resolvedInitiativeRound, {
            targetPrefix: '→',
          })
        : {},
    [resolvedInitiativeRound]
  );
  const combatFlowGraphNodeIds = useMemo(
    () =>
      new Set(
        resolvedInitiativeRound?.attackGraph.nodes.map((node) => node.id) || []
      ),
    [resolvedInitiativeRound]
  );
  const combatFlowCompletedNodeIds = useMemo(
    () =>
      new Set(
        (combatFlowCompletedNodeIdsByRound[state.activeRound] || []).filter(
          (nodeId) => combatFlowGraphNodeIds.has(nodeId)
        )
      ),
    [
      combatFlowCompletedNodeIdsByRound,
      combatFlowGraphNodeIds,
      state.activeRound,
    ]
  );
  const combatFlowGraphNodeStatusById = useMemo<
    Record<string, InitiativeGraphNodeStatus>
  >(
    () =>
      Object.fromEntries(
        Array.from(combatFlowCompletedNodeIds).map((nodeId) => [
          nodeId,
          'resolved' as const,
        ])
      ),
    [combatFlowCompletedNodeIds]
  );
  const combatFlowReadyNodeIds = useMemo(
    () =>
      resolvedInitiativeRound
        ? buildInitiativeGraphEnabledNodeIds(
            resolvedInitiativeRound.attackGraph,
            combatFlowGraphNodeStatusById
          )
        : new Set<string>(),
    [combatFlowGraphNodeStatusById, resolvedInitiativeRound]
  );
  const combatFlowReadyNodes = useMemo(
    () =>
      (resolvedInitiativeRound?.attackGraph.nodes || []).filter((node) =>
        combatFlowReadyNodeIds.has(node.id)
      ),
    [combatFlowReadyNodeIds, resolvedInitiativeRound]
  );
  const combatFlowSelectedNodeId =
    combatFlowSelectedNodeIdsByRound[state.activeRound];
  const selectedCombatFlowNode = combatFlowReadyNodes.find(
    (node) => node.id === combatFlowSelectedNodeId
  );
  const combatFlowGraphInspectorModel = useMemo(
    () =>
      resolvedInitiativeRound && combatFlowGraphInspectorNodeId
        ? buildInitiativeGraphInspectorModel(
            resolvedInitiativeRound,
            combatFlowGraphInspectorNodeId,
            combatFlowGraphNodeStatusById
          )
        : undefined,
    [
      combatFlowGraphInspectorNodeId,
      combatFlowGraphNodeStatusById,
      resolvedInitiativeRound,
    ]
  );
  useLayoutEffect(() => {
    if (!combatFlowGraphInspectorNodeId) {
      setCombatFlowGraphInspectorHeight(GRAPH_POPOVER_FALLBACK_HEIGHT);
      return;
    }

    const inspectorElement = combatFlowGraphInspectorRef.current;

    if (!inspectorElement) {
      return;
    }

    const updateHeight = () => {
      const nextHeight = Math.ceil(inspectorElement.offsetHeight);
      setCombatFlowGraphInspectorHeight((previous) =>
        previous === nextHeight ? previous : nextHeight
      );
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(inspectorElement);
    return () => resizeObserver.disconnect();
  }, [combatFlowGraphInspectorNodeId, combatFlowGraphInspectorModel]);
  useLayoutEffect(() => {
    if (!combatFlowGraphInspectorNodeId) {
      setCombatFlowGraphInspectorPosition(undefined);
      return;
    }

    const updatePosition = () => {
      const graphContainer = combatFlowGraphContainerRef.current;
      const graphNode = Array.from(
        graphContainer?.querySelectorAll<SVGGElement>(
          '[data-graph-node="true"]'
        ) || []
      ).find(
        (nodeElement) =>
          nodeElement.getAttribute('data-graph-node-id') ===
          combatFlowGraphInspectorNodeId
      );

      if (!graphNode || typeof window === 'undefined') {
        setCombatFlowGraphInspectorPosition(undefined);
        return;
      }

      const nodeRect = graphNode.getBoundingClientRect();
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const viewportMaxPopoverHeight = Math.min(
        GRAPH_POPOVER_MAX_HEIGHT,
        Math.max(1, viewportHeight - GRAPH_POPOVER_MARGIN * 2)
      );
      const effectivePopoverHeight = Math.min(
        combatFlowGraphInspectorHeight,
        viewportMaxPopoverHeight
      );
      const preferredRight = nodeRect.right + GRAPH_POPOVER_GAP;
      const placeLeft =
        preferredRight >
        viewportWidth - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_MARGIN;
      const left = placeLeft
        ? Math.max(
            GRAPH_POPOVER_MARGIN,
            nodeRect.left - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_GAP
          )
        : Math.min(
            preferredRight,
            Math.max(
              GRAPH_POPOVER_MARGIN,
              viewportWidth - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_MARGIN
            )
          );
      const top = Math.min(
        Math.max(GRAPH_POPOVER_MARGIN, nodeRect.top - 6),
        Math.max(
          GRAPH_POPOVER_MARGIN,
          viewportHeight - effectivePopoverHeight - GRAPH_POPOVER_MARGIN
        )
      );
      const availablePopoverHeight = Math.max(
        1,
        viewportHeight - top - GRAPH_POPOVER_MARGIN
      );
      const maxPopoverHeight = Math.min(
        viewportMaxPopoverHeight,
        availablePopoverHeight
      );

      setCombatFlowGraphInspectorPosition((previous) =>
        previous?.left === left &&
        previous?.top === top &&
        previous?.maxHeight === `${maxPopoverHeight}px`
          ? previous
          : {
              left,
              top,
              maxHeight: `${maxPopoverHeight}px`,
            }
      );
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [combatFlowGraphInspectorHeight, combatFlowGraphInspectorNodeId]);
  useEffect(() => {
    if (!combatFlowGraphInspectorNodeId || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCombatFlowGraphInspectorNodeId(undefined);
      }
    };
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (combatFlowGraphInspectorRef.current?.contains(target)) {
        return;
      }

      if (target.closest('[data-graph-node="true"]')) {
        return;
      }

      setCombatFlowGraphInspectorNodeId(undefined);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleDocumentClick);
    };
  }, [combatFlowGraphInspectorNodeId]);
  const currentCombatWizardEntry = combatWizardEntries[combatWizardIndex];
  const currentCombatWizardEntryKey = currentCombatWizardEntry?.combatantKey;
  const currentCombatWizardActions = useMemo<TrackerActionDeclaration[]>(
    () =>
      currentCombatWizardEntry && currentRound
        ? getCombatWizardActionsForEntry(currentRound, currentCombatWizardEntry)
        : [],
    [currentCombatWizardEntry, currentRound]
  );
  const selectedCombatWizardAction =
    currentCombatWizardActions.find(
      (action) => action.id === combatWizardSelectedActionId
    ) || currentCombatWizardActions[0];
  const selectedCombatWizardActionTitle = selectedCombatWizardAction
    ? getActionSummaryLines(selectedCombatWizardAction, '')[0] ||
      formatDeclaredAction(selectedCombatWizardAction.declaredAction)
    : undefined;
  const currentCombatWizardTargetIndices = useMemo<number[]>(() => {
    if (!currentRound || !currentCombatWizardEntry) {
      return [];
    }

    if (!selectedCombatWizardAction) {
      return currentCombatWizardEntry.targetIndices;
    }

    if (selectedCombatWizardAction.usesGridTargets === false) {
      return [];
    }

    const gridActionIds = new Set(
      currentCombatWizardActions
        .filter((action) => action.usesGridTargets !== false)
        .map((action) => action.id)
    );

    if (!gridActionIds.has(selectedCombatWizardAction.id)) {
      return [];
    }

    const direction: AttackDetailDirection =
      currentCombatWizardEntry.side === 'party'
        ? 'partyToEnemy'
        : 'enemyToParty';

    return currentCombatWizardEntry.targetIndices.filter((targetIndex) => {
      const cell =
        currentCombatWizardEntry.side === 'party'
          ? currentRound.cells[targetIndex]?.[currentCombatWizardEntry.index]
          : currentRound.cells[currentCombatWizardEntry.index]?.[targetIndex];

      if (!cell) {
        return false;
      }

      const assignedActionIds = getCellActionIds(cell, direction).filter(
        (actionId) => gridActionIds.has(actionId)
      );

      return (
        assignedActionIds.length === 0 ||
        assignedActionIds.includes(selectedCombatWizardAction.id)
      );
    });
  }, [
    currentCombatWizardActions,
    currentCombatWizardEntry,
    currentRound,
    selectedCombatWizardAction,
  ]);
  const hasTrackerChanged = state !== initialStateRef.current;
  const partyColumnStyles = useMemo<CSSProperties[]>(
    () =>
      (currentRound?.party || []).map((combatant) => {
        const widestLineWidth = getTrackerCombatantWidestLineWidth(
          combatant,
          'party'
        );
        const width = Math.max(PARTY_COLUMN_MIN_WIDTH_PX, widestLineWidth);

        return {
          width: `${width}px`,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
        };
      }),
    [currentRound]
  );

  useEffect(() => {
    idCounter.current =
      Math.max(
        0,
        ...state.rounds.flatMap((round) =>
          round.party.concat(round.enemies).map((combatant) => combatant.key)
        )
      ) + 1;
  }, [state.rounds]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const nextDrafts = listTrackerLocalDrafts(window.localStorage);
      const nextDraftId = getOrCreateTrackerSessionDraftId(
        window.sessionStorage
      );
      const currentDraft = nextDrafts.find((draft) => draft.id === nextDraftId);

      setDraftId(nextDraftId);
      setSavedDrafts(nextDrafts);
      setHasLocalDraft(Boolean(currentDraft));
      setLastLocalSaveAt(currentDraft?.updatedAt);

      if (
        !loadedFromEncodedState &&
        !recoverPromptHandled.current &&
        (Boolean(currentDraft) || nextDrafts.length > 0)
      ) {
        setShowRecoverModal(true);
        recoverPromptHandled.current = true;
      }
    } catch (error) {
      console.error('Unable to initialize tracker drafts:', error);
    }
  }, [loadedFromEncodedState]);

  useEffect(() => {
    let active = true;

    encodeTrackerState(state)
      .then((nextEncodedState) => {
        if (!active) {
          return;
        }

        setEncodedTrackerState(nextEncodedState);
      })
      .catch((error) => {
        console.error('An error occurred:', error);
        process.exitCode = 1;
      });

    return () => {
      active = false;
    };
  }, [state]);

  useEffect(() => {
    if (!encodedTrackerState) {
      return;
    }

    const nextUrl = buildTrackerShareUrl(
      window.location.origin,
      window.location.pathname,
      encodedTrackerState
    );
    const nextUrlLength = nextUrl.length;

    setUrlWarningLength(nextUrlLength);

    window.history.replaceState(
      {},
      '',
      buildTrackerSharePath(window.location.pathname, encodedTrackerState)
    );

    const expectedHash = buildTrackerShareHash(encodedTrackerState);

    if (window.location.hash !== expectedHash) {
      setAddressBarUrlTruncated(true);
      if (!urlWarningShown.current) {
        setShowUrlWarning(true);
        urlWarningShown.current = true;
      }
      return;
    }

    setAddressBarUrlTruncated(false);
    urlWarningShown.current = false;
  }, [encodedTrackerState]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !draftId ||
      !encodedTrackerState ||
      !hasTrackerChanged
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        if (
          autosavePaused &&
          encodedTrackerState === pausedEncodedState.current
        ) {
          return;
        }

        if (autosavePaused) {
          setAutosavePaused(false);
          pausedEncodedState.current = undefined;
        }

        const nextDrafts = saveTrackerLocalDraft(
          window.localStorage,
          draftId,
          encodedTrackerState,
          state
        );
        const currentDraft = nextDrafts.find((draft) => draft.id === draftId);

        setSavedDrafts(nextDrafts);
        setHasLocalDraft(Boolean(currentDraft));
        setLastLocalSaveAt(currentDraft?.updatedAt);
      } catch (error) {
        console.error('Unable to save tracker draft:', error);
      }
    }, LOCAL_DRAFT_AUTOSAVE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [autosavePaused, draftId, encodedTrackerState, hasTrackerChanged, state]);

  useEffect(() => {
    if (typeof window === 'undefined' || !draftId || !hasTrackerChanged) {
      return;
    }

    const saveDraftNow = () => {
      try {
        const encodedState = encodeTrackerStateSync(state);

        if (autosavePaused && encodedState === pausedEncodedState.current) {
          return;
        }

        saveTrackerLocalDraft(
          window.localStorage,
          draftId,
          encodedState,
          state
        );
      } catch (error) {
        console.error('Unable to save tracker draft before unload:', error);
      }
    };

    window.addEventListener('pagehide', saveDraftNow);
    window.addEventListener('beforeunload', saveDraftNow);

    return () => {
      window.removeEventListener('pagehide', saveDraftNow);
      window.removeEventListener('beforeunload', saveDraftNow);
    };
  }, [autosavePaused, draftId, hasTrackerChanged, state]);

  useEffect(() => {
    if (
      !showUrlWarning &&
      !showRecoverModal &&
      !showShareModal &&
      !showImportModal &&
      !showIntentionsWizard &&
      !showCombatWizard &&
      !attackDetailTarget &&
      !cellActionAssignmentTarget &&
      !actionEditorTarget
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUrlWarning(false);
        setShowRecoverModal(false);
        setShowShareModal(false);
        setShowImportModal(false);
        setShowDeleteRoundModal(false);
        setShowIntentionsWizard(false);
        setShowCombatWizard(false);
        setAttackDetailTarget(undefined);
        setCellActionAssignmentTarget(undefined);
        setCellActionAssignmentDraftIds([]);
        setCellActionAssignmentError(undefined);
        setActionEditorTarget(undefined);
        setActionEditorDrafts([]);
        setShowMoreActions(false);
        setIntentionWizardActionDrafts([]);
        setIntentionWizardSelectedActionId('');
        setRecoverError(undefined);
        setImportError(undefined);
        setActionEditorError(undefined);
        setIntentionWizardActionError(undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    actionEditorTarget,
    attackDetailTarget,
    cellActionAssignmentTarget,
    showCombatWizard,
    showDeleteRoundModal,
    showIntentionsWizard,
    showImportModal,
    showMoreActions,
    showRecoverModal,
    showShareModal,
    showUrlWarning,
  ]);

  useEffect(() => {
    if (!showMoreActions) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!moreActionsRef.current?.contains(event.target as Node)) {
        setShowMoreActions(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);

    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [showMoreActions]);

  useEffect(() => {
    setShowIntentionsWizard(false);
    setIntentionWizardIndex(0);
    setIntentionResolvedOnEntry(false);
    setShowCombatWizard(false);
    setCombatWizardIndex(0);
    setCombatResolvedOnEntry(false);
    setCellActionAssignmentTarget(undefined);
    setCellActionAssignmentDraftIds([]);
    setCellActionAssignmentError(undefined);
    setActionEditorTarget(undefined);
    setActionEditorError(undefined);
    setIntentionWizardActionDrafts([]);
    setIntentionWizardSelectedActionId('');
    setIntentionWizardActionError(undefined);
  }, [state.activeRound]);

  useEffect(() => {
    if (intentionWizardEntries.length === 0) {
      setIntentionWizardIndex(0);
      setIntentionResolvedOnEntry(false);
      return;
    }

    if (intentionWizardIndex >= intentionWizardEntries.length) {
      const nextIndex = intentionWizardEntries.length - 1;
      setIntentionWizardIndex(nextIndex);
      setIntentionResolvedOnEntry(
        Boolean(intentionWizardEntries[nextIndex]?.intention.trim())
      );
    }
  }, [intentionWizardEntries, intentionWizardIndex]);

  useEffect(() => {
    if (!showIntentionsWizard || !currentIntentionWizardEntry) {
      return;
    }

    setIntentionWizardAnchorKeysByRound((previous) => ({
      ...previous,
      [state.activeRound]: currentIntentionWizardEntry.combatantKey,
    }));
  }, [currentIntentionWizardEntry, showIntentionsWizard, state.activeRound]);

  useEffect(() => {
    if (!currentRound || combatWizardEntries.length === 0) {
      setCombatWizardIndex(0);
      setCombatResolvedOnEntry(false);
      setCombatWizardSelectedActionId('');
      return;
    }

    if (combatWizardIndex >= combatWizardEntries.length) {
      const nextIndex = combatWizardEntries.length - 1;
      const nextEntry = combatWizardEntries[nextIndex];
      setCombatWizardIndex(nextIndex);
      setCombatResolvedOnEntry(Boolean(nextEntry?.result.trim()));
      setCombatWizardSelectedActionId(
        getDefaultCombatWizardActionId(currentRound, nextEntry)
      );
    }
  }, [combatWizardEntries, combatWizardIndex, currentRound]);

  useEffect(() => {
    if (!showCombatWizard || !currentCombatWizardEntry) {
      return;
    }

    setCombatWizardAnchorKeysByRound((previous) => ({
      ...previous,
      [state.activeRound]: currentCombatWizardEntry.combatantKey,
    }));
  }, [currentCombatWizardEntry, showCombatWizard, state.activeRound]);

  useEffect(() => {
    if (!showCombatWizard || !currentCombatWizardEntry) {
      return;
    }

    if (currentCombatWizardActions.length === 0) {
      if (combatWizardSelectedActionId.length > 0) {
        setCombatWizardSelectedActionId('');
      }
      return;
    }

    if (
      !currentCombatWizardActions.some(
        (action) => action.id === combatWizardSelectedActionId
      )
    ) {
      setCombatWizardSelectedActionId(currentCombatWizardActions[0]?.id || '');
    }
  }, [
    combatWizardSelectedActionId,
    currentCombatWizardActions,
    currentCombatWizardEntry,
    showCombatWizard,
  ]);

  useEffect(() => {
    if (!resolvedInitiativeRound) {
      return;
    }

    const savedCompletedNodeIds =
      combatFlowCompletedNodeIdsByRound[state.activeRound] || [];
    const validCompletedNodeIds = savedCompletedNodeIds.filter((nodeId) =>
      combatFlowGraphNodeIds.has(nodeId)
    );

    if (validCompletedNodeIds.length !== savedCompletedNodeIds.length) {
      setCombatFlowCompletedNodeIdsByRound((previous) => ({
        ...previous,
        [state.activeRound]: validCompletedNodeIds,
      }));
    }

    const nextSelectedNodeId = selectedCombatFlowNode?.id;
    if (combatFlowSelectedNodeId !== nextSelectedNodeId) {
      setCombatFlowSelectedNodeIdsByRound((previous) => ({
        ...previous,
        [state.activeRound]: nextSelectedNodeId,
      }));
    }
  }, [
    combatFlowCompletedNodeIdsByRound,
    combatFlowGraphNodeIds,
    combatFlowSelectedNodeId,
    resolvedInitiativeRound,
    selectedCombatFlowNode,
    state.activeRound,
  ]);

  useEffect(() => {
    if (!shareCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShareCopied(false);
    }, SHARE_URL_COPIED_MS);

    return () => window.clearTimeout(timeoutId);
  }, [shareCopied]);

  useEffect(() => {
    if (!showShareModal) {
      return;
    }

    shareTextareaRef.current?.focus();
    shareTextareaRef.current?.select();
  }, [showShareModal]);

  useEffect(() => {
    if (!showImportModal) {
      return;
    }

    importTextareaRef.current?.focus();
  }, [showImportModal]);

  useEffect(() => {
    if (!showCombatWizard || currentCombatWizardEntryKey === undefined) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const textarea = combatResultTextareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      const cursorPosition = textarea.value.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [combatWizardIndex, currentCombatWizardEntryKey, showCombatWizard]);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(trackerTitle);
    }
  }, [isEditingTitle, trackerTitle]);

  useEffect(() => {
    if (!isEditingRoundLabel) {
      setRoundLabelDraft(currentRoundLabel);
    }
  }, [currentRoundLabel, isEditingRoundLabel]);

  useEffect(() => {
    if (!isEditingTitle) {
      return;
    }

    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isEditingRoundLabel) {
      return;
    }

    roundLabelInputRef.current?.focus();
    roundLabelInputRef.current?.select();
  }, [isEditingRoundLabel]);

  if (!currentRound) {
    return <></>;
  }

  const selectedActionEditorDraftIndex = actionEditorTarget
    ? actionEditorDrafts.findIndex(
        (draft) => draft.id === actionEditorTarget.selectedActionId
      )
    : -1;
  const selectedActionEditorDraft =
    selectedActionEditorDraftIndex >= 0
      ? actionEditorDrafts[selectedActionEditorDraftIndex]
      : undefined;
  const selectedIntentionWizardActionDraftIndex =
    intentionWizardSelectedActionId.length > 0
      ? intentionWizardActionDrafts.findIndex(
          (draft) => draft.id === intentionWizardSelectedActionId
        )
      : -1;
  const selectedIntentionWizardActionDraft =
    selectedIntentionWizardActionDraftIndex >= 0
      ? intentionWizardActionDrafts[selectedIntentionWizardActionDraftIndex]
      : undefined;
  const selectedActionEditorCombatant =
    actionEditorTarget && currentRound
      ? getActionCombatant(
          currentRound,
          actionEditorTarget.side,
          actionEditorTarget.index
        )
      : undefined;
  const currentIntentionWizardCombatant =
    currentIntentionWizardEntry && currentRound
      ? getActionCombatant(
          currentRound,
          currentIntentionWizardEntry.side,
          currentIntentionWizardEntry.index
        )
      : undefined;
  const selectedActionEditorModeOptions = getAvailableActionEditorModeOptions(
    selectedActionEditorCombatant?.weapon
  );
  const selectedIntentionWizardModeOptions =
    getAvailableActionEditorModeOptions(
      currentIntentionWizardCombatant?.weapon
    );
  const updateSelectedActionEditorDraft = (
    updater: (draft: TrackerActionEditorDraft) => TrackerActionEditorDraft
  ) => {
    if (!actionEditorTarget) {
      return;
    }

    setActionEditorDrafts((drafts) =>
      drafts.map((draft) =>
        draft.id === actionEditorTarget.selectedActionId
          ? updater(draft)
          : draft
      )
    );
  };

  const nextKey = () => {
    const current = idCounter.current;
    idCounter.current += 1;
    return current;
  };

  const closeRecoverModal = () => {
    setShowRecoverModal(false);
    setRecoverError(undefined);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportError(undefined);
  };

  const closeDeleteRoundModal = () => {
    setShowDeleteRoundModal(false);
  };

  const closeAttackDetailModal = () => {
    setAttackDetailTarget(undefined);
  };

  const closeCellActionAssignmentModal = () => {
    setCellActionAssignmentTarget(undefined);
    setCellActionAssignmentDraftIds([]);
    setCellActionAssignmentError(undefined);
  };

  const closeActionEditor = () => {
    setActionEditorTarget(undefined);
    setActionEditorDrafts([]);
    setActionEditorError(undefined);
  };

  const openCellActionAssignmentEditor = (
    enemyIndex: number,
    partyIndex: number,
    direction: AttackDetailDirection
  ) => {
    const cell = currentRound.cells[enemyIndex]?.[partyIndex];
    const sourceSide = direction === 'partyToEnemy' ? 'party' : 'enemy';
    const sourceIndex = sourceSide === 'party' ? partyIndex : enemyIndex;
    const options = getCellActionOptions(
      getStructuredActionsForCombatant(currentRound, sourceSide, sourceIndex)
    );

    if (!cell || options.length < 2) {
      return;
    }

    const optionIds = new Set(options.map((option) => option.id));
    const assignedActionIds = getCellActionIds(cell, direction).filter(
      (actionId) => optionIds.has(actionId)
    );

    setCellActionAssignmentDraftIds(
      assignedActionIds.length > 0
        ? assignedActionIds
        : options.map((option) => option.id)
    );
    setCellActionAssignmentTarget({
      enemyIndex,
      partyIndex,
      direction,
    });
    setCellActionAssignmentError(undefined);
  };

  const saveCellActionAssignment = () => {
    if (!selectedCellActionAssignment) {
      return;
    }

    const selectedActionIds = selectedCellActionAssignment.options
      .map((option) => option.id)
      .filter((actionId) => cellActionAssignmentDraftIds.includes(actionId));

    if (selectedActionIds.length === 0) {
      setCellActionAssignmentError(
        'Select at least one action for this target.'
      );
      return;
    }

    const actionIds =
      selectedActionIds.length === selectedCellActionAssignment.options.length
        ? undefined
        : selectedActionIds;

    dispatch({
      type: 'set-cell-action-ids',
      rowIndex: selectedCellActionAssignment.rowIndex,
      columnIndex: selectedCellActionAssignment.columnIndex,
      field: selectedCellActionAssignment.field,
      actionIds,
    });
    closeCellActionAssignmentModal();
  };

  const openActionEditor = (side: TrackerSide, index: number) => {
    const combatant = getActionCombatant(currentRound, side, index);
    const actions = getStructuredActionsForCombatant(currentRound, side, index);
    const roundState = getActionRoundState(currentRound, side, index);

    if (!combatant) {
      return;
    }

    const drafts = getActionEditorDrafts({
      actions,
      fallbackIntention: roundState?.action || '',
      mainActionId: getMainTrackerActionId(side, combatant.key),
      defaultDeclaredAction: getDefaultTrackerDeclaredAction(combatant),
      weaponId: combatant.weapon,
    });
    setActionEditorDrafts(drafts);
    setActionEditorTarget({
      side,
      index,
      selectedActionId: drafts[0]?.id || '',
    });
    setActionEditorError(undefined);
  };

  const saveActionEditor = () => {
    if (!actionEditorTarget) {
      return;
    }

    const combatant = getActionCombatant(
      currentRound,
      actionEditorTarget.side,
      actionEditorTarget.index
    );
    const roundState = getActionRoundState(
      currentRound,
      actionEditorTarget.side,
      actionEditorTarget.index
    );

    if (!combatant) {
      return;
    }

    const result = buildActionDeclarationsFromDrafts({
      side: actionEditorTarget.side,
      index: actionEditorTarget.index,
      combatant,
      roundState,
      drafts: actionEditorDrafts,
    });

    if (!result.ok) {
      setActionEditorError(result.error);
      return;
    }

    dispatch({
      type: 'set-combatant-actions',
      side: actionEditorTarget.side,
      index: actionEditorTarget.index,
      intention: result.intention,
      actionDeclarations: result.actionDeclarations,
    });
    closeActionEditor();
  };

  const removeSelectedActionEditorDraft = () => {
    if (actionEditorDrafts.length <= 1 || selectedActionEditorDraftIndex <= 0) {
      return;
    }

    const actionIdToRemove =
      actionEditorDrafts[selectedActionEditorDraftIndex]?.id;
    const nextSelectedActionId =
      actionEditorDrafts[selectedActionEditorDraftIndex - 1]?.id ||
      actionEditorDrafts[0]?.id ||
      '';

    if (!actionIdToRemove) {
      return;
    }

    setActionEditorDrafts((drafts) =>
      drafts.filter((draft) => draft.id !== actionIdToRemove)
    );
    setActionEditorTarget((previous) =>
      previous
        ? {
            ...previous,
            selectedActionId: nextSelectedActionId,
          }
        : previous
    );
  };

  const buildShareUrl = () => {
    if (typeof window === 'undefined' || !encodedTrackerState) {
      return undefined;
    }

    return buildTrackerShareUrl(
      window.location.origin,
      window.location.pathname,
      encodedTrackerState
    );
  };

  const handleCopyShareUrl = async () => {
    const shareUrl = buildShareUrl();

    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setShareModalUrl(undefined);
      setShowShareModal(false);
    } catch (_error) {
      setShareCopied(false);
      setShareModalUrl(shareUrl);
      setShowShareModal(true);
    }
  };

  const openImportModal = () => {
    setImportUrlValue('');
    setImportError(undefined);
    setShowImportModal(true);
    setShowMoreActions(false);
  };

  const handleImportShareUrl = async () => {
    const encodedState = getTrackerEncodedStateFromUrlText(importUrlValue);

    if (!encodedState) {
      setImportError('Paste a combat tracker share URL first.');
      return;
    }

    setImportingShareUrl(true);
    setImportError(undefined);

    try {
      const importedState = await decodeTrackerState(encodedState);
      initialStateRef.current = importedState;
      dispatch({ type: 'replace-state', state: importedState });
      setAutosavePaused(false);
      pausedEncodedState.current = undefined;
      setImportUrlValue('');
      setShowImportModal(false);
    } catch (error) {
      console.error('Unable to import tracker URL:', error);
      setImportError(
        'This share URL could not be decoded. Check that the complete URL was pasted.'
      );
    } finally {
      setImportingShareUrl(false);
    }
  };

  const openTitleEditor = () => {
    setTitleDraft(trackerTitle);
    setIsEditingTitle(true);
  };

  const commitTitleEdit = () => {
    dispatch({
      type: 'set-title',
      value: titleDraft.trim(),
    });
    setIsEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setTitleDraft(trackerTitle);
    setIsEditingTitle(false);
  };

  const openRoundLabelEditor = () => {
    setRoundLabelDraft(currentRoundLabel);
    setIsEditingRoundLabel(true);
  };

  const commitRoundLabelEdit = () => {
    const nextLabel = roundLabelDraft.trim() || currentRoundLabel;
    dispatch({
      type: 'set-round-label',
      value: nextLabel,
    });
    setIsEditingRoundLabel(false);
  };

  const cancelRoundLabelEdit = () => {
    setRoundLabelDraft(currentRoundLabel);
    setIsEditingRoundLabel(false);
  };

  const openIntentionsWizard = () => {
    const nextEntries = buildIntentionWizardEntries(currentRound);
    const anchorKey = intentionWizardAnchorKeysByRound[state.activeRound];
    const anchorIndex = anchorKey
      ? nextEntries.findIndex((entry) => entry.combatantKey === anchorKey)
      : -1;
    const nextIndex = anchorIndex >= 0 ? anchorIndex : 0;

    setIntentionWizardEntries(nextEntries);
    setIntentionWizardIndex(nextIndex);
    setIntentionResolvedOnEntry(
      Boolean(nextEntries[nextIndex]?.intention.trim())
    );
    const nextEntry = nextEntries[nextIndex];
    const nextDrafts = nextEntry
      ? getIntentionWizardActionDrafts(currentRound, nextEntry)
      : [];
    setIntentionWizardActionDrafts(nextDrafts);
    setIntentionWizardSelectedActionId(nextDrafts[0]?.id || '');
    setIntentionWizardActionError(undefined);
    setShowIntentionsWizard(true);
  };

  const closeIntentionsWizard = () => {
    setShowIntentionsWizard(false);
    setIntentionWizardActionDrafts([]);
    setIntentionWizardSelectedActionId('');
    setIntentionWizardActionError(undefined);
  };

  const navigateIntentionsWizard = (nextIndex: number) => {
    if (intentionWizardEntries.length === 0) {
      setIntentionResolvedOnEntry(false);
      setIntentionWizardIndex(0);
      return;
    }

    const boundedIndex = Math.max(
      0,
      Math.min(intentionWizardEntries.length - 1, nextIndex)
    );

    setIntentionResolvedOnEntry(
      Boolean(intentionWizardEntries[boundedIndex]?.intention.trim())
    );
    const nextEntry = intentionWizardEntries[boundedIndex];
    const nextDrafts = nextEntry
      ? getIntentionWizardActionDrafts(currentRound, nextEntry)
      : [];
    setIntentionWizardActionDrafts(nextDrafts);
    setIntentionWizardSelectedActionId(nextDrafts[0]?.id || '');
    setIntentionWizardActionError(undefined);
    setIntentionWizardIndex(boundedIndex);
  };

  const openCombatWizard = () => {
    if (!canOpenCombatWizard) {
      return;
    }

    const nextEntries = buildCombatWizardEntries(currentRound);
    const anchorKey = combatWizardAnchorKeysByRound[state.activeRound];
    const anchorIndex = anchorKey
      ? nextEntries.findIndex((entry) => entry.combatantKey === anchorKey)
      : -1;

    const nextIndex = anchorIndex >= 0 ? anchorIndex : 0;
    const nextEntry = nextEntries[nextIndex];
    setCombatWizardIndex(nextIndex);
    setCombatResolvedOnEntry(Boolean(nextEntry?.result.trim()));
    setCombatWizardSelectedActionId(
      getDefaultCombatWizardActionId(currentRound, nextEntry)
    );
    setShowCombatWizard(true);
  };

  const closeCombatWizard = () => {
    setShowCombatWizard(false);
    setCombatWizardSelectedActionId('');
  };

  const navigateCombatWizard = (nextIndex: number) => {
    if (combatWizardEntries.length === 0) {
      setCombatResolvedOnEntry(false);
      setCombatWizardIndex(0);
      setCombatWizardSelectedActionId('');
      return;
    }

    const boundedIndex = Math.max(
      0,
      Math.min(combatWizardEntries.length - 1, nextIndex)
    );

    setCombatResolvedOnEntry(
      Boolean(combatWizardEntries[boundedIndex]?.result.trim())
    );
    setCombatWizardSelectedActionId(
      getDefaultCombatWizardActionId(
        currentRound,
        combatWizardEntries[boundedIndex]
      )
    );
    setCombatWizardIndex(boundedIndex);
  };

  const selectCombatFlowNode = (nodeId: string) => {
    setCombatFlowSelectedNodeIdsByRound((previous) => ({
      ...previous,
      [state.activeRound]: nodeId,
    }));
  };

  const completeCombatFlowNode = (nodeId: string) => {
    setCombatFlowCompletedNodeIdsByRound((previous) => {
      const completedNodeIds = previous[state.activeRound] || [];

      if (completedNodeIds.includes(nodeId)) {
        return previous;
      }

      return {
        ...previous,
        [state.activeRound]: completedNodeIds.concat(nodeId),
      };
    });
  };

  const markCombatFlowNodeResolved = (nodeId: string) => {
    completeCombatFlowNode(nodeId);
    setCombatFlowSelectedNodeIdsByRound((previous) => ({
      ...previous,
      [state.activeRound]:
        previous[state.activeRound] === nodeId
          ? undefined
          : previous[state.activeRound],
    }));
  };

  const clearCombatFlowNodeResolved = (nodeId: string) => {
    setCombatFlowCompletedNodeIdsByRound((previous) => {
      const completedNodeIds = previous[state.activeRound] || [];

      if (!completedNodeIds.includes(nodeId)) {
        return previous;
      }

      return {
        ...previous,
        [state.activeRound]: completedNodeIds.filter(
          (completedNodeId) => completedNodeId !== nodeId
        ),
      };
    });
  };

  const openCombatFlowGraphNode = (nodeId: string) => {
    setCombatFlowGraphInspectorNodeId(nodeId);

    if (combatFlowReadyNodeIds.has(nodeId)) {
      selectCombatFlowNode(nodeId);
    }
  };

  const markSelectedCombatFlowNodeResolved = () => {
    if (!selectedCombatFlowNode) {
      return;
    }

    markCombatFlowNodeResolved(selectedCombatFlowNode.id);
  };

  const markSelectedCombatFlowNodeResolvedAndSelectNext = () => {
    if (!selectedCombatFlowNode || !resolvedInitiativeRound) {
      return;
    }

    const nextSelectedNodeId = getNextInitiativeGraphReadyNodeIdAfterResolving(
      resolvedInitiativeRound.attackGraph,
      combatFlowGraphNodeStatusById,
      selectedCombatFlowNode.id
    );

    completeCombatFlowNode(selectedCombatFlowNode.id);
    setCombatFlowSelectedNodeIdsByRound((previous) => ({
      ...previous,
      [state.activeRound]: nextSelectedNodeId,
    }));
  };

  const resetCombatFlowProgress = () => {
    setCombatFlowCompletedNodeIdsByRound((previous) => ({
      ...previous,
      [state.activeRound]: [],
    }));
    setCombatFlowSelectedNodeIdsByRound((previous) => ({
      ...previous,
      [state.activeRound]: undefined,
    }));
    setCombatFlowGraphInspectorNodeId(undefined);
  };

  const confirmDeleteRound = () => {
    dispatch({ type: 'remove-round' });
    setShowDeleteRoundModal(false);
  };

  const updateCurrentIntentionWizardEntry = (
    updater: (entry: IntentionWizardEntry) => IntentionWizardEntry
  ) => {
    if (!currentIntentionWizardEntry) {
      return;
    }

    const nextEntry = updater(currentIntentionWizardEntry);
    setIntentionWizardEntries((previousEntries) =>
      replaceIntentionWizardEntry(
        previousEntries,
        intentionWizardIndex,
        nextEntry
      )
    );
  };

  const commitIntentionWizardActionDrafts = (
    drafts: TrackerActionEditorDraft[],
    combatantOverride?: TrackerCombatant
  ): boolean => {
    if (!currentIntentionWizardEntry) {
      return false;
    }

    const combatant =
      combatantOverride ||
      getActionCombatant(
        currentRound,
        currentIntentionWizardEntry.side,
        currentIntentionWizardEntry.index
      );
    const roundState = getActionRoundState(
      currentRound,
      currentIntentionWizardEntry.side,
      currentIntentionWizardEntry.index
    );

    if (!combatant) {
      return false;
    }

    const result = buildActionDeclarationsFromDrafts({
      side: currentIntentionWizardEntry.side,
      index: currentIntentionWizardEntry.index,
      combatant,
      roundState,
      drafts,
    });

    if (!result.ok) {
      setIntentionWizardActionError(result.error);
      return false;
    }

    setIntentionWizardActionError(undefined);
    updateCurrentIntentionWizardEntry((entry) => ({
      ...entry,
      intention: result.intention,
    }));
    dispatch({
      type: 'set-combatant-actions',
      side: currentIntentionWizardEntry.side,
      index: currentIntentionWizardEntry.index,
      intention: result.intention,
      actionDeclarations: result.actionDeclarations,
    });
    return true;
  };

  const updateSelectedIntentionWizardActionDraft = (
    updater: (draft: TrackerActionEditorDraft) => TrackerActionEditorDraft
  ) => {
    if (!selectedIntentionWizardActionDraft) {
      return;
    }

    const nextDrafts = intentionWizardActionDrafts.map((draft) =>
      draft.id === selectedIntentionWizardActionDraft.id
        ? updater(draft)
        : draft
    );

    setIntentionWizardActionDrafts(nextDrafts);
    commitIntentionWizardActionDrafts(nextDrafts);
  };

  const addIntentionWizardAction = () => {
    if (!currentIntentionWizardEntry || !currentIntentionWizardCombatant) {
      return;
    }

    const nextDraft = createAddedActionEditorDraft(
      getNextTrackerActionId(
        currentIntentionWizardEntry.side,
        currentIntentionWizardCombatant.key,
        intentionWizardActionDrafts
      ),
      getDefaultTrackerDeclaredAction(currentIntentionWizardCombatant)
    );
    const nextDrafts = intentionWizardActionDrafts.concat(nextDraft);

    setIntentionWizardActionDrafts(nextDrafts);
    setIntentionWizardSelectedActionId(nextDraft.id);
    commitIntentionWizardActionDrafts(nextDrafts);
  };

  const removeSelectedIntentionWizardAction = () => {
    if (
      intentionWizardActionDrafts.length <= 1 ||
      selectedIntentionWizardActionDraftIndex <= 0
    ) {
      return;
    }

    const nextSelectedActionId =
      intentionWizardActionDrafts[selectedIntentionWizardActionDraftIndex - 1]
        ?.id ||
      intentionWizardActionDrafts[0]?.id ||
      '';
    const nextDrafts = intentionWizardActionDrafts.filter(
      (draft) => draft.id !== selectedIntentionWizardActionDraft?.id
    );

    setIntentionWizardActionDrafts(nextDrafts);
    setIntentionWizardSelectedActionId(nextSelectedActionId);
    commitIntentionWizardActionDrafts(nextDrafts);
  };

  const getActionDraftsForWeaponChange = (
    combatant: TrackerCombatant,
    nextWeapon: number
  ): TrackerActionEditorDraft[] => {
    const oldDefaultAction = getDefaultTrackerDeclaredAction(combatant);
    const nextCombatant = {
      ...combatant,
      weapon: nextWeapon,
    };
    const nextDefaultAction = getDefaultTrackerDeclaredAction(nextCombatant);

    return intentionWizardActionDrafts.map((draft) => {
      const nextMode =
        draft.mode === oldDefaultAction
          ? nextDefaultAction
          : normalizeActionEditorModeForWeapon(
              draft.mode,
              nextWeapon,
              nextDefaultAction
            );

      return {
        ...draft,
        mode: nextMode,
        attackRoutineCount:
          requiresAttackRoutineCountInput(nextMode, nextWeapon) &&
          draft.attackRoutineCount.trim().length === 0
            ? '1'
            : draft.attackRoutineCount,
      };
    });
  };

  const updateIntentionWizardWeapon = (nextWeapon: number) => {
    if (!currentIntentionWizardEntry || !currentIntentionWizardCombatant) {
      return;
    }

    const nextCombatant = {
      ...currentIntentionWizardCombatant,
      weapon: nextWeapon,
    };
    const nextDrafts = getActionDraftsForWeaponChange(
      currentIntentionWizardCombatant,
      nextWeapon
    );

    setIntentionWizardActionDrafts(nextDrafts);
    dispatch({
      type: 'update-combatant',
      side: currentIntentionWizardEntry.side,
      index: currentIntentionWizardEntry.index,
      combatant: nextCombatant,
    });
    commitIntentionWizardActionDrafts(nextDrafts, nextCombatant);
  };

  const renderIntentionWizardWeaponPicker = () => {
    if (!currentIntentionWizardCombatant) {
      return null;
    }

    const weaponOptions = getWeaponOptions(
      currentIntentionWizardCombatant.class
    );
    const weaponOptionsById = new Map(
      weaponOptions.map((weaponOption) => [weaponOption.value, weaponOption])
    );
    const quickWeaponOptions = (
      currentIntentionWizardCombatant.weaponShortlist || []
    ).flatMap((weaponId) => {
      const weaponOption = weaponOptionsById.get(weaponId);
      return weaponOption ? [weaponOption] : [];
    });

    if (quickWeaponOptions.length === 0) {
      return null;
    }

    return (
      <div
        className={`${styles['quickWeaponList']} ${styles['intentionsWizardQuickWeaponList']}`}
      >
        {quickWeaponOptions.map((weaponOption) => (
          <button
            key={weaponOption.value}
            type={'button'}
            className={
              weaponOption.value === currentIntentionWizardCombatant.weapon
                ? styles['quickWeaponButtonActive']
                : styles['quickWeaponButton']
            }
            onClick={() => updateIntentionWizardWeapon(weaponOption.value)}
          >
            {weaponOption.label}
          </button>
        ))}
      </div>
    );
  };

  const renderActionDraftControls = ({
    idPrefix,
    selectedDraft,
    modeOptions,
    combatant,
    updateDraft,
    error,
  }: {
    idPrefix: string;
    selectedDraft: TrackerActionEditorDraft;
    modeOptions: typeof ACTION_EDITOR_MODE_OPTIONS;
    combatant: TrackerCombatant | undefined;
    updateDraft: (
      updater: (draft: TrackerActionEditorDraft) => TrackerActionEditorDraft
    ) => void;
    error: string | undefined;
  }) => (
    <>
      <label className={styles['modalLabel']} htmlFor={`${idPrefix}-mode`}>
        Action
      </label>
      <select
        id={`${idPrefix}-mode`}
        className={styles['actionIntentSelect']}
        value={selectedDraft.mode}
        onChange={(event) =>
          updateDraft((draft) => {
            const nextMode = modeOptions.some(
              (option) => option.value === event.target.value
            )
              ? (event.target.value as TrackerActionEditorMode)
              : modeOptions[0]?.value || 'none';

            return {
              ...draft,
              mode: nextMode,
              castingSegments:
                nextMode === 'spell-casting' &&
                draft.castingSegments.trim().length === 0
                  ? '1'
                  : draft.castingSegments,
              attackRoutineCount:
                requiresAttackRoutineCountInput(nextMode, combatant?.weapon) &&
                draft.attackRoutineCount.trim().length === 0
                  ? '1'
                  : draft.attackRoutineCount,
            };
          })
        }
      >
        {modeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {requiresActionDistanceInput(selectedDraft.mode) ? (
        <>
          <label className={styles['modalLabel']} htmlFor={`${idPrefix}-label`}>
            Label
          </label>
          <input
            id={`${idPrefix}-label`}
            className={styles['actionIntentTextInput']}
            type={'text'}
            value={selectedDraft.label}
            onChange={(event) =>
              updateDraft((draft) => ({
                ...draft,
                label: event.target.value,
              }))
            }
          />
          <label
            className={styles['modalLabel']}
            htmlFor={`${idPrefix}-distance`}
          >
            Distance
          </label>
          <div className={styles['actionIntentDistanceRow']}>
            <input
              id={`${idPrefix}-distance`}
              className={styles['actionIntentDistanceInput']}
              type={'number'}
              inputMode={'decimal'}
              min={'0.1'}
              step={'0.1'}
              value={selectedDraft.distanceInches}
              onChange={(event) =>
                updateDraft((draft) => ({
                  ...draft,
                  distanceInches: event.target.value,
                }))
              }
            />
            <span className={styles['actionIntentDistanceUnit']}>&quot;</span>
          </div>
        </>
      ) : selectedDraft.mode === 'spell-casting' ? (
        <>
          <label className={styles['modalLabel']} htmlFor={`${idPrefix}-label`}>
            Spell or label
          </label>
          <input
            id={`${idPrefix}-label`}
            className={styles['actionIntentTextInput']}
            type={'text'}
            value={selectedDraft.label}
            onChange={(event) =>
              updateDraft((draft) => ({
                ...draft,
                label: event.target.value,
              }))
            }
          />
          <label
            className={styles['modalLabel']}
            htmlFor={`${idPrefix}-casting-segments`}
          >
            Casting time
          </label>
          <select
            id={`${idPrefix}-casting-segments`}
            className={styles['actionIntentSelect']}
            value={selectedDraft.castingSegments}
            onChange={(event) =>
              updateDraft((draft) => ({
                ...draft,
                castingSegments: event.target.value,
              }))
            }
          >
            {SPELL_CASTING_TIME_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className={styles['modalHint']}>
            For scrolls that reproduce spells, use the spell casting time.
          </p>
        </>
      ) : selectedDraft.mode === 'magical-device' ? (
        <>
          <label className={styles['modalLabel']} htmlFor={`${idPrefix}-label`}>
            Device or label
          </label>
          <input
            id={`${idPrefix}-label`}
            className={styles['actionIntentTextInput']}
            type={'text'}
            value={selectedDraft.label}
            onChange={(event) =>
              updateDraft((draft) => ({
                ...draft,
                label: event.target.value,
              }))
            }
          />
          <label
            className={styles['modalLabel']}
            htmlFor={`${idPrefix}-activation-segments`}
          >
            Activation time
          </label>
          <select
            id={`${idPrefix}-activation-segments`}
            className={styles['actionIntentSelect']}
            value={selectedDraft.activationSegments}
            onChange={(event) =>
              updateDraft((draft) => ({
                ...draft,
                activationSegments: event.target.value,
              }))
            }
          >
            {ACTIVATION_SEGMENT_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className={styles['modalHint']}>
            Targets are optional. Select one or more targets in the intention
            grid when the device affects a creature.
          </p>
          <p className={styles['modalHint']}>
            Potion reminder: finding a packed potion is usually 3-4 segments,
            quaffing is 1 segment, and the effect begins 2-5 segments later.
          </p>
        </>
      ) : (
        <>
          <label className={styles['modalLabel']} htmlFor={`${idPrefix}-label`}>
            Intention
          </label>
          <AutoHeightTextarea
            id={`${idPrefix}-label`}
            className={styles['actionIntentTextarea']}
            value={selectedDraft.label}
            onChange={(value) =>
              updateDraft((draft) => ({
                ...draft,
                label: value,
              }))
            }
            rows={2}
          />
        </>
      )}
      {requiresAttackRoutineCountInput(
        selectedDraft.mode,
        combatant?.weapon
      ) ? (
        <>
          <label
            className={styles['modalLabel']}
            htmlFor={`${idPrefix}-attack-routines`}
          >
            Attack routines this round
          </label>
          <input
            id={`${idPrefix}-attack-routines`}
            className={styles['actionIntentTextInput']}
            type={'text'}
            inputMode={'numeric'}
            value={selectedDraft.attackRoutineCount}
            onChange={(event) =>
              updateDraft((draft) => ({
                ...draft,
                attackRoutineCount: event.target.value,
              }))
            }
          />
          <p className={styles['modalHint']}>
            Use <strong>1</strong> for an ordinary weapon routine or a natural
            routine such as claw/claw/bite.
          </p>
        </>
      ) : null}
      <label
        className={styles['modalLabel']}
        htmlFor={`${idPrefix}-initiative-timing`}
      >
        Initiative timing
      </label>
      <select
        id={`${idPrefix}-initiative-timing`}
        className={styles['actionIntentSelect']}
        value={selectedDraft.initiativeTiming}
        onChange={(event) =>
          updateDraft((draft) => ({
            ...draft,
            initiativeTiming: event.target.value as InitiativeTimingOverride,
          }))
        }
      >
        {INITIATIVE_TIMING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className={styles['modalHint']}>
        Use this only for effects such as speed weapons or slow that explicitly
        make this action win or lose initiative.
      </p>
      {error ? (
        <div className={styles['actionIntentError']}>{error}</div>
      ) : null}
    </>
  );

  const updateCombatWizardResult = (
    entry: CombatWizardEntry,
    value: string
  ) => {
    dispatch({
      type: entry.side === 'enemy' ? 'set-enemy-state' : 'set-party-state',
      index: entry.index,
      field: 'result',
      value,
    });
  };

  const updateCombatWizardEffect = (
    entry: CombatWizardEntry,
    value: string
  ) => {
    dispatch({
      type: entry.side === 'enemy' ? 'set-enemy-state' : 'set-party-state',
      index: entry.index,
      field: 'effect',
      value,
    });
  };

  const updateIntentionsWizardEffect = (
    entry: IntentionWizardEntry,
    value: string
  ) => {
    dispatch({
      type: entry.side === 'enemy' ? 'set-enemy-state' : 'set-party-state',
      index: entry.index,
      field: 'effect',
      value,
    });
  };

  const handleClearCurrentDraft = () => {
    if (typeof window === 'undefined' || !draftId) {
      return;
    }

    try {
      const nextDrafts = deleteTrackerLocalDraft(window.localStorage, draftId);
      setSavedDrafts(nextDrafts);
      setHasLocalDraft(false);
      setLastLocalSaveAt(undefined);
      setAutosavePaused(true);
      pausedEncodedState.current = encodedTrackerState;
    } catch (error) {
      console.error('Unable to clear tracker draft:', error);
    }
  };

  const handleDeleteDraft = (targetDraftId: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const nextDrafts = deleteTrackerLocalDraft(
        window.localStorage,
        targetDraftId
      );
      setSavedDrafts(nextDrafts);

      if (targetDraftId === draftId) {
        setHasLocalDraft(false);
        setLastLocalSaveAt(undefined);
        setAutosavePaused(true);
        pausedEncodedState.current = encodedTrackerState;
      }

      if (nextDrafts.length === 0) {
        closeRecoverModal();
      }
    } catch (error) {
      console.error('Unable to delete tracker draft:', error);
    }
  };

  const handleRestoreDraft = async (draft: TrackerLocalDraftRecord) => {
    if (typeof window === 'undefined') {
      return;
    }

    setRecoveringDraftId(draft.id);
    setRecoverError(undefined);

    try {
      const restoredState = await decodeTrackerState(draft.encodedState);
      initialStateRef.current = restoredState;
      dispatch({ type: 'replace-state', state: restoredState });
      setTrackerSessionDraftId(window.sessionStorage, draft.id);
      setDraftId(draft.id);
      setHasLocalDraft(true);
      setLastLocalSaveAt(draft.updatedAt);
      setAutosavePaused(false);
      pausedEncodedState.current = undefined;
      closeRecoverModal();
    } catch (error) {
      console.error('Unable to restore tracker draft:', error);
      setRecoverError(
        'This local draft could not be restored. It may be corrupted or from an older broken save.'
      );
    } finally {
      setRecoveringDraftId(undefined);
    }
  };

  const localDraftStatus = autosavePaused
    ? 'Local autosave paused until the next edit.'
    : hasLocalDraft && lastLocalSaveAt
    ? `Saved locally ${formatDraftSavedAt(lastLocalSaveAt)}`
    : 'Local recovery will start after your next edit.';
  const showLongUrlNotice =
    addressBarUrlTruncated || urlWarningLength >= URL_WARNING_THRESHOLD;
  const longUrlNoticeTitle = addressBarUrlTruncated
    ? 'The browser address bar may not contain the full tracker state. Use Copy Share URL instead.'
    : `This tracker URL is ${urlWarningLength.toLocaleString()} characters. Use Copy Share URL rather than copying from the address bar.`;

  const getPartyDisplayName = (partyIndex: number): string =>
    currentRound.party[partyIndex]?.name || `Party ${partyIndex + 1}`;

  const getEnemyDisplayName = (enemyIndex: number): string =>
    currentRound.enemies[enemyIndex]?.name || `Enemy ${enemyIndex + 1}`;

  const renderInteractionCell = (
    enemyIndex: number,
    partyIndex: number,
    style?: CSSProperties,
    allowVisibilityToggle = true,
    displayMode: 'both' | 'enemyOnly' | 'partyOnly' = 'both'
  ) => {
    const enemyCombatant = currentRound.enemies[enemyIndex];
    const partyCombatant = currentRound.party[partyIndex];
    const cellState = currentRound.cells[enemyIndex]?.[partyIndex];

    if (!enemyCombatant || !partyCombatant || !cellState) {
      return null;
    }

    const enemyActionOptions = getCellActionOptions(
      getStructuredActionsForCombatant(currentRound, 'enemy', enemyIndex)
    );
    const partyActionOptions = getCellActionOptions(
      getStructuredActionsForCombatant(currentRound, 'party', partyIndex)
    );
    const enemyAssignmentLabel = getCellActionAssignmentLabel(
      enemyActionOptions,
      getCellActionIds(cellState, 'enemyToParty')
    );
    const partyAssignmentLabel = getCellActionAssignmentLabel(
      partyActionOptions,
      getCellActionIds(cellState, 'partyToEnemy')
    );

    return (
      <TrackerCell
        key={`cell-${enemyCombatant.key}-${partyCombatant.key}`}
        style={style}
        rowCombatant={enemyCombatant}
        columnCombatant={partyCombatant}
        enemyToPartyValue={cellState.enemyToParty}
        partyToEnemyValue={cellState.partyToEnemy}
        enemyToPartyVisible={cellState.enemyToPartyVisible}
        partyToEnemyVisible={cellState.partyToEnemyVisible}
        enemyToPartyActionAssignmentLabel={enemyAssignmentLabel}
        partyToEnemyActionAssignmentLabel={partyAssignmentLabel}
        allowVisibilityToggle={allowVisibilityToggle}
        displayMode={displayMode}
        onEnemyToPartyActionAssignmentOpen={
          enemyAssignmentLabel
            ? () =>
                openCellActionAssignmentEditor(
                  enemyIndex,
                  partyIndex,
                  'enemyToParty'
                )
            : undefined
        }
        onPartyToEnemyActionAssignmentOpen={
          partyAssignmentLabel
            ? () =>
                openCellActionAssignmentEditor(
                  enemyIndex,
                  partyIndex,
                  'partyToEnemy'
                )
            : undefined
        }
        onAttackDetailOpen={(direction, hand) =>
          setAttackDetailTarget({
            enemyIndex,
            partyIndex,
            direction,
            hand,
          })
        }
        onEnemyToPartyVisibilityChange={(value) =>
          dispatch({
            type: 'set-cell-visibility',
            rowIndex: enemyIndex,
            columnIndex: partyIndex,
            field: 'enemyToPartyVisible',
            value,
          })
        }
        onPartyToEnemyVisibilityChange={(value) =>
          dispatch({
            type: 'set-cell-visibility',
            rowIndex: enemyIndex,
            columnIndex: partyIndex,
            field: 'partyToEnemyVisible',
            value,
          })
        }
        onEnemyToPartyChange={(value) =>
          dispatch({
            type: 'set-cell',
            rowIndex: enemyIndex,
            columnIndex: partyIndex,
            field: 'enemyToParty',
            value,
          })
        }
        onPartyToEnemyChange={(value) =>
          dispatch({
            type: 'set-cell',
            rowIndex: enemyIndex,
            columnIndex: partyIndex,
            field: 'partyToEnemy',
            value,
          })
        }
      />
    );
  };

  const renderHpEditor = (
    maxHp: string | undefined,
    hp: string,
    onChange: (value: string) => void,
    side: TrackerSide
  ) => (
    <div
      className={
        side === 'party' ? styles['hpEditorParty'] : styles['hpEditorEnemy']
      }
    >
      <span className={styles['hpMaxValue']}>{maxHp || '-'}</span>
      <AutoHeightTextarea
        className={styles['hpCurrentInput']}
        value={hp}
        onChange={onChange}
      />
    </div>
  );

  const renderActionIntentionControl = (
    side: TrackerSide,
    index: number,
    fallbackIntention: string
  ) => {
    const actions = getStructuredActionsForCombatant(currentRound, side, index);
    const summaryLines = getActionListSummaryLines(actions, fallbackIntention);
    const isEmpty = summaryLines.length === 0;

    return (
      <button
        type={'button'}
        className={[
          styles['actionIntentButton'],
          isEmpty ? styles['actionIntentButtonEmpty'] : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => openActionEditor(side, index)}
      >
        {isEmpty ? (
          <span className={styles['actionIntentPlaceholder']}>
            Set intention
          </span>
        ) : (
          summaryLines.map((line, lineIndex) => {
            const isActionTitle =
              line.startsWith('Main:') || line.startsWith('Action ');

            return (
              <span
                key={`${side}-${index}-action-line-${lineIndex}`}
                className={
                  lineIndex === 0 || isActionTitle
                    ? styles['actionIntentPrimary']
                    : styles['actionIntentSecondary']
                }
              >
                {line}
              </span>
            );
          })
        )}
      </button>
    );
  };

  const renderCombatWizardHpEditor = (
    maxHp: string | undefined,
    hp: string,
    onChange: (value: string) => void,
    side: CombatWizardEntry['side']
  ) => (
    <div
      className={
        side === 'party'
          ? `${styles['combatWizardHpEditor']} ${styles['combatWizardHpEditorParty']}`
          : `${styles['combatWizardHpEditor']} ${styles['combatWizardHpEditorEnemy']}`
      }
    >
      <span
        className={
          side === 'party'
            ? `${styles['combatWizardHpMaxValue']} ${styles['combatWizardHpMaxValueParty']}`
            : `${styles['combatWizardHpMaxValue']} ${styles['combatWizardHpMaxValueEnemy']}`
        }
      >
        {maxHp || '-'}
      </span>
      <AutoHeightTextarea
        className={
          side === 'party'
            ? `${styles['combatWizardHpInput']} ${styles['combatWizardHpInputParty']}`
            : `${styles['combatWizardHpInput']} ${styles['combatWizardHpInputEnemy']}`
        }
        value={hp}
        onChange={onChange}
      />
    </div>
  );

  const renderCombatWizardEffectEditor = (
    value: string,
    onChange: (value: string) => void,
    side: CombatWizardEntry['side']
  ) => (
    <AutoHeightTextarea
      className={
        side === 'party'
          ? `${styles['combatWizardEffectInput']} ${styles['combatWizardEffectInputParty']}`
          : `${styles['combatWizardEffectInput']} ${styles['combatWizardEffectInputEnemy']}`
      }
      value={value}
      onChange={onChange}
    />
  );

  const renderCombatTargetEditor = (
    scope: CombatTargetEditorScope,
    targetIndices: number[],
    selectedAction: TrackerActionDeclaration | undefined
  ) => {
    if (targetIndices.length === 0) {
      const message =
        selectedAction?.usesGridTargets === false
          ? 'This action does not use the target grid. You can still fill out the action result, or adjust the intention.'
          : selectedAction && scope.targetIndices.length > 0
          ? 'No active target cells are assigned to this action. Choose another action, or adjust target assignments in the tracker.'
          : 'No targets are active in the grid for this combatant. You can still fill out the action result, or adjust targets in the tracker.';

      return (
        <div className={styles['combatWizardEmptyTargets']}>{message}</div>
      );
    }

    if (scope.side === 'enemy') {
      return (
        <div className={styles['combatWizardGridWrap']}>
          <table className={styles['combatWizardGridTable']}>
            <thead>
              <tr>
                <th className={styles['combatWizardCorner']}>Target</th>
                {targetIndices.map((partyIndex) => {
                  const partyCombatant = currentRound.party[partyIndex];
                  if (!partyCombatant) {
                    return null;
                  }

                  return (
                    <th
                      key={`combat-party-header-${partyCombatant.key}`}
                      className={styles['combatWizardColumnHeader']}
                    >
                      {getPartyDisplayName(partyIndex)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className={styles['combatWizardRowHeader']}>
                  {scope.combatantName}
                </th>
                {targetIndices.map((partyIndex) =>
                  renderInteractionCell(
                    scope.index,
                    partyIndex,
                    undefined,
                    false,
                    'enemyOnly'
                  )
                )}
              </tr>
              <tr>
                <th
                  className={`${styles['combatWizardHpLabel']} ${styles['combatWizardHpLabelEnemy']}`}
                >
                  HP
                </th>
                {targetIndices.map((partyIndex) => {
                  const partyCombatant = currentRound.party[partyIndex];
                  const partyState = currentRound.partyStates[partyIndex];

                  if (!partyCombatant || !partyState) {
                    return null;
                  }

                  return (
                    <td
                      key={`combat-party-hp-${partyCombatant.key}`}
                      className={`${styles['combatWizardHpCell']} ${styles['combatWizardHpCellEnemy']}`}
                    >
                      {renderCombatWizardHpEditor(
                        partyCombatant.maxHp,
                        partyState.hp,
                        (value) =>
                          dispatch({
                            type: 'set-party-state',
                            index: partyIndex,
                            field: 'hp',
                            value,
                          }),
                        'enemy'
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <th
                  className={`${styles['combatWizardHpLabel']} ${styles['combatWizardHpLabelEnemy']}`}
                >
                  Current Effect
                </th>
                {targetIndices.map((partyIndex) => {
                  const partyState = currentRound.partyStates[partyIndex];

                  if (!partyState) {
                    return null;
                  }

                  return (
                    <td
                      key={`combat-party-effect-${partyIndex}`}
                      className={`${styles['combatWizardEffectCell']} ${styles['combatWizardEffectCellEnemy']}`}
                    >
                      {renderCombatWizardEffectEditor(
                        partyState.effect,
                        (value) =>
                          dispatch({
                            type: 'set-party-state',
                            index: partyIndex,
                            field: 'effect',
                            value,
                          }),
                        'enemy'
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className={styles['combatWizardGridWrap']}>
        <table className={styles['combatWizardListTable']}>
          <thead>
            <tr>
              <th className={styles['combatWizardCorner']}>Target</th>
              <th className={styles['combatWizardColumnHeader']}>
                {scope.combatantName}
              </th>
              <th
                className={`${styles['combatWizardColumnHeader']} ${styles['combatWizardHpLabelParty']}`}
              >
                HP
              </th>
              <th
                className={`${styles['combatWizardColumnHeader']} ${styles['combatWizardHpLabelParty']}`}
              >
                Current Effect
              </th>
            </tr>
          </thead>
          <tbody>
            {targetIndices.map((enemyIndex) => {
              const enemyCombatant = currentRound.enemies[enemyIndex];
              const enemyState = currentRound.enemyStates[enemyIndex];

              if (!enemyCombatant || !enemyState) {
                return null;
              }

              return (
                <tr key={`combat-enemy-row-${enemyCombatant.key}`}>
                  <th className={styles['combatWizardRowHeader']}>
                    {getEnemyDisplayName(enemyIndex)}
                  </th>
                  {renderInteractionCell(
                    enemyIndex,
                    scope.index,
                    undefined,
                    false,
                    'partyOnly'
                  )}
                  <td
                    className={`${styles['combatWizardHpCell']} ${styles['combatWizardHpCellParty']}`}
                  >
                    {renderCombatWizardHpEditor(
                      enemyCombatant.maxHp,
                      enemyState.hp,
                      (value) =>
                        dispatch({
                          type: 'set-enemy-state',
                          index: enemyIndex,
                          field: 'hp',
                          value,
                        }),
                      'party'
                    )}
                  </td>
                  <td
                    className={`${styles['combatWizardEffectCell']} ${styles['combatWizardEffectCellParty']}`}
                  >
                    {renderCombatWizardEffectEditor(
                      enemyState.effect,
                      (value) =>
                        dispatch({
                          type: 'set-enemy-state',
                          index: enemyIndex,
                          field: 'effect',
                          value,
                        }),
                      'party'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCombatFlowPanel = () => {
    if (
      !resolvedInitiativeRound ||
      resolvedInitiativeRound.attackGraph.nodes.length === 0
    ) {
      return null;
    }

    const totalNodeCount = resolvedInitiativeRound.attackGraph.nodes.length;
    const completedNodeCount = combatFlowCompletedNodeIds.size;
    const isFlowComplete = completedNodeCount >= totalNodeCount;
    const selectedDisplay = selectedCombatFlowNode
      ? combatFlowNodeDisplayById[selectedCombatFlowNode.id]
      : undefined;
    const initiativeScenarioCombatants =
      resolvedInitiativeRound.scenario.party.concat(
        resolvedInitiativeRound.scenario.enemies
      );
    const selectedCombatant = selectedCombatFlowNode
      ? initiativeScenarioCombatants.find(
          (combatant) => combatant.id === selectedCombatFlowNode.combatantId
        )
      : undefined;
    const selectedRoundState = selectedCombatant
      ? selectedCombatant.side === 'party'
        ? currentRound.partyStates[selectedCombatant.index]
        : currentRound.enemyStates[selectedCombatant.index]
      : undefined;
    const selectedCombatFlowAction = getCombatFlowActionForCombatant(
      currentRound,
      selectedCombatant
    );
    const selectedCombatFlowActionTitle = selectedCombatFlowAction
      ? getActionSummaryLines(selectedCombatFlowAction, '')[0] ||
        formatDeclaredAction(selectedCombatFlowAction.declaredAction)
      : selectedDisplay?.actionTitle;
    const selectedCombatFlowTargetIndices =
      selectedCombatFlowNode && selectedCombatant
        ? getCombatFlowNodeTargetIndices(
            selectedCombatFlowNode,
            selectedCombatant,
            selectedCombatFlowAction,
            initiativeScenarioCombatants
          )
        : [];
    const selectedCombatFlowTargetScope: CombatTargetEditorScope | undefined =
      selectedCombatant && selectedDisplay
        ? {
            side: selectedCombatant.side,
            index: selectedCombatant.index,
            combatantName: selectedDisplay.combatantName,
            targetIndices: selectedCombatFlowTargetIndices,
          }
        : undefined;
    const isSelectedCombatFlowSpellStart =
      selectedCombatFlowNode?.kind === 'spell-start';

    return (
      <section
        className={styles['combatFlowPanel']}
        aria-labelledby={'tracker-combat-flow-title'}
      >
        <div className={styles['combatFlowHeader']}>
          <div>
            <h2
              id={'tracker-combat-flow-title'}
              className={styles['combatFlowTitle']}
            >
              Combat Flow
            </h2>
            <div className={styles['combatFlowSubtitle']}>
              Ready actions are unblocked by the current DAG and segment lane.
            </div>
          </div>
          <div className={styles['combatFlowHeaderActions']}>
            <span className={styles['combatFlowProgress']}>
              {completedNodeCount} / {totalNodeCount} resolved
            </span>
            <button
              type={'button'}
              className={styles['combatFlowResetButton']}
              disabled={completedNodeCount === 0}
              onClick={resetCombatFlowProgress}
            >
              Reset flow
            </button>
          </div>
        </div>
        <div className={styles['combatFlowBody']}>
          <div className={styles['combatFlowReadyPane']}>
            <div className={styles['combatFlowPaneTitle']}>Ready Actions</div>
            {combatFlowReadyNodes.length > 0 ? (
              <div className={styles['combatFlowReadyList']}>
                {combatFlowReadyNodes.map((node) => {
                  const display = combatFlowNodeDisplayById[node.id];
                  const isSelected = selectedCombatFlowNode?.id === node.id;

                  return (
                    <button
                      key={node.id}
                      type={'button'}
                      className={[
                        styles['combatFlowReadyButton'],
                        node.side === 'party'
                          ? styles['combatFlowReadyButtonParty']
                          : styles['combatFlowReadyButtonEnemy'],
                        isSelected
                          ? styles['combatFlowReadyButtonSelected']
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => selectCombatFlowNode(node.id)}
                    >
                      <span className={styles['combatFlowReadyName']}>
                        {display?.combatantName || node.combatantId}
                      </span>
                      <span className={styles['combatFlowReadyTarget']}>
                        {display ? `→ ${display.targetLabel}` : '→ Unknown'}
                      </span>
                      <span className={styles['combatFlowReadyAction']}>
                        {display?.actionLabel || node.label}
                      </span>
                      <span className={styles['combatFlowReadyTiming']}>
                        {formatCombatFlowNodeTiming(node)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles['combatFlowEmpty']}>
                {isFlowComplete
                  ? 'All graph actions are resolved for this session.'
                  : 'No unblocked graph actions are available. Check the DAG below.'}
              </div>
            )}
          </div>
          <div className={styles['combatFlowResolverPane']}>
            <div className={styles['combatFlowPaneTitle']}>Selected Action</div>
            {selectedCombatFlowNode && selectedDisplay && selectedCombatant ? (
              <div className={styles['combatFlowSelectedLayout']}>
                <div className={styles['combatFlowSelectedTopRow']}>
                  <div className={styles['combatFlowSelectedCard']}>
                    <div className={styles['combatFlowSelectedTopline']}>
                      <span
                        className={[
                          styles['combatFlowSideBadge'],
                          selectedCombatFlowNode.side === 'party'
                            ? styles['combatFlowSideBadgeParty']
                            : styles['combatFlowSideBadgeEnemy'],
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {selectedCombatFlowNode.side === 'party'
                          ? 'Party'
                          : 'Enemy'}
                      </span>
                      <span className={styles['combatFlowTimingBadge']}>
                        {formatCombatFlowNodeTiming(selectedCombatFlowNode)}
                      </span>
                    </div>
                    <div className={styles['combatFlowSelectedName']}>
                      {selectedDisplay.combatantName}
                    </div>
                    <div className={styles['combatFlowSelectedTarget']}>
                      → {selectedDisplay.targetLabel}
                    </div>
                    <div className={styles['combatFlowSelectedAction']}>
                      {selectedDisplay.actionTitle}
                    </div>
                    {selectedDisplay.actionMeta ? (
                      <div className={styles['combatFlowSelectedMeta']}>
                        {selectedDisplay.actionMeta}
                      </div>
                    ) : null}
                  </div>
                  <div className={styles['combatFlowFieldStack']}>
                    {isSelectedCombatFlowSpellStart ? (
                      <div className={styles['combatFlowStartNotice']}>
                        <div className={styles['combatFlowStartNoticeTitle']}>
                          Spell casting starts
                        </div>
                        <div className={styles['combatFlowStartNoticeText']}>
                          Resolve this when casting begins. Record spell outcome
                          and target effects when the completion node is ready.
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className={styles['combatFlowField']}>
                          <span className={styles['combatFlowFieldLabel']}>
                            Result
                          </span>
                          <AutoHeightTextarea
                            className={styles['combatFlowTextarea']}
                            value={selectedRoundState?.result || ''}
                            onChange={(value) =>
                              dispatch({
                                type:
                                  selectedCombatant.side === 'party'
                                    ? 'set-party-state'
                                    : 'set-enemy-state',
                                index: selectedCombatant.index,
                                field: 'result',
                                value,
                              })
                            }
                            placeholder={
                              'misses, hits for 6, sleep: one saves, two asleep...'
                            }
                          />
                        </label>
                        <label className={styles['combatFlowField']}>
                          <span className={styles['combatFlowFieldLabel']}>
                            Current Effect
                          </span>
                          <AutoHeightTextarea
                            className={styles['combatFlowTextarea']}
                            value={selectedRoundState?.effect || ''}
                            onChange={(value) =>
                              dispatch({
                                type:
                                  selectedCombatant.side === 'party'
                                    ? 'set-party-state'
                                    : 'set-enemy-state',
                                index: selectedCombatant.index,
                                field: 'effect',
                                value,
                              })
                            }
                            placeholder={'hopeless 1/9, slowed 3/8, bless...'}
                          />
                        </label>
                      </>
                    )}
                    <div className={styles['combatFlowResolverActions']}>
                      <button
                        type={'button'}
                        className={styles['combatFlowResolveButton']}
                        onClick={markSelectedCombatFlowNodeResolved}
                      >
                        Resolve action
                      </button>
                      <button
                        type={'button'}
                        className={[
                          styles['combatFlowResolveButton'],
                          styles['combatFlowResolveNextButton'],
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={
                          markSelectedCombatFlowNodeResolvedAndSelectNext
                        }
                      >
                        Resolve and next
                      </button>
                    </div>
                  </div>
                </div>
                {isSelectedCombatFlowSpellStart ? null : (
                  <div className={styles['combatFlowTargetColumn']}>
                    <div className={styles['combatFlowPaneTitle']}>Targets</div>
                    {selectedCombatFlowActionTitle ? (
                      <div className={styles['combatFlowTargetScope']}>
                        {selectedCombatFlowActionTitle}
                      </div>
                    ) : null}
                    {selectedCombatFlowTargetScope ? (
                      <div className={styles['combatFlowTargetEditor']}>
                        {renderCombatTargetEditor(
                          selectedCombatFlowTargetScope,
                          selectedCombatFlowTargetIndices,
                          selectedCombatFlowAction
                        )}
                      </div>
                    ) : (
                      <div className={styles['combatFlowEmpty']}>
                        No target editor is available for this action.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles['combatFlowEmpty']}>
                {isFlowComplete
                  ? 'The current flow is complete. Reset it to walk the round again.'
                  : 'Select a ready action to process it here.'}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div id={'app-modal'}>
      <div className={styles['page']}>
        <div className={styles['toolbar']}>
          <div className={styles['pageHeader']}>
            <div className={styles['pageTitle']}>AD&amp;D Combat Tracker</div>
            <div className={styles['pageHint']}>
              Enemy on the left of each matchup cell, party on the right.
            </div>
          </div>
          <div className={styles['toolbarControls']}>
            <div className={styles['toolbarButtons']}>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={openIntentionsWizard}
              >
                Register Intentions
              </button>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                disabled={!canOpenCombatWizard}
                onClick={openCombatWizard}
              >
                Combat
              </button>
              <button
                type={'button'}
                className={styles['toolbarButtonPrimary']}
                onClick={() => dispatch({ type: 'advance-round' })}
              >
                Advance Round
              </button>
              <span className={styles['shareButtonWrap']}>
                <button
                  type={'button'}
                  className={styles['toolbarButton']}
                  disabled={!encodedTrackerState}
                  title={showLongUrlNotice ? longUrlNoticeTitle : undefined}
                  aria-label={
                    showLongUrlNotice
                      ? `Copy Share URL. ${longUrlNoticeTitle}`
                      : undefined
                  }
                  onClick={() => void handleCopyShareUrl()}
                >
                  {shareCopied ? 'Share URL Copied' : 'Copy Share URL'}
                </button>
                {showLongUrlNotice ? (
                  <span
                    className={styles['shareUrlBadge']}
                    aria-hidden={'true'}
                  >
                    Long URL
                  </span>
                ) : null}
              </span>
              <div className={styles['toolbarMenuWrap']} ref={moreActionsRef}>
                <button
                  type={'button'}
                  className={styles['toolbarButton']}
                  aria-haspopup={'menu'}
                  aria-expanded={showMoreActions}
                  onClick={() => setShowMoreActions((previous) => !previous)}
                >
                  More
                </button>
                {showMoreActions ? (
                  <div className={styles['toolbarMenu']} role={'menu'}>
                    <button
                      type={'button'}
                      className={styles['toolbarMenuItem']}
                      onClick={openImportModal}
                    >
                      Import Share URL
                    </button>
                    <button
                      type={'button'}
                      className={styles['toolbarMenuItem']}
                      disabled={savedDrafts.length === 0}
                      onClick={() => {
                        setRecoverError(undefined);
                        setShowRecoverModal(true);
                        setShowMoreActions(false);
                      }}
                    >
                      Recover Local Draft
                    </button>
                    <button
                      type={'button'}
                      className={styles['toolbarMenuItem']}
                      disabled={!hasLocalDraft}
                      onClick={() => {
                        handleClearCurrentDraft();
                        setShowMoreActions(false);
                      }}
                    >
                      Clear Local Draft
                    </button>
                    <div className={styles['toolbarMenuDivider']} />
                    <button
                      type={'button'}
                      className={`${styles['toolbarMenuItem']} ${styles['toolbarMenuItemDanger']}`}
                      disabled={state.rounds.length <= 1}
                      onClick={() => {
                        setShowDeleteRoundModal(true);
                        setShowMoreActions(false);
                      }}
                    >
                      Delete Round
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className={styles['toolbarSubrow']}>
              <div className={styles['toolbarSubgroup']}>
                <button
                  type={'button'}
                  className={styles['toolbarButton']}
                  onClick={() =>
                    dispatch({
                      type: 'add-combatant',
                      side: 'party',
                      key: nextKey(),
                    })
                  }
                >
                  Add Party Member
                </button>
                <button
                  type={'button'}
                  className={styles['toolbarButton']}
                  onClick={() =>
                    dispatch({
                      type: 'add-combatant',
                      side: 'enemy',
                      key: nextKey(),
                    })
                  }
                >
                  Add Enemy
                </button>
              </div>
              <div className={styles['toolbarStatus']}>{localDraftStatus}</div>
            </div>
          </div>
        </div>
        <div className={styles['roundTabs']}>
          {state.rounds.map((_, roundIndex) => (
            <button
              key={`round-tab-${roundIndex}`}
              type={'button'}
              className={
                roundIndex === state.activeRound
                  ? styles['roundTabActive']
                  : styles['roundTab']
              }
              onClick={() =>
                dispatch({ type: 'select-round', index: roundIndex })
              }
            >
              {state.rounds[roundIndex]?.label || `Round ${roundIndex + 1}`}
            </button>
          ))}
        </div>
        <div className={styles['tableWrap']}>
          <div className={styles['roundHeading']}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type={'text'}
                className={styles['roundHeadingTitleInput']}
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={commitTitleEdit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    commitTitleEdit();
                    return;
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelTitleEdit();
                  }
                }}
                aria-label={'Combat Title'}
                placeholder={'Add Combat Title'}
              />
            ) : trackerTitle ? (
              <button
                type={'button'}
                className={styles['roundHeadingTitleButton']}
                onClick={openTitleEditor}
              >
                {trackerTitle}
              </button>
            ) : (
              <button
                type={'button'}
                className={styles['roundHeadingTitlePlaceholder']}
                onClick={openTitleEditor}
              >
                Add Combat Title
              </button>
            )}
            {isEditingRoundLabel ? (
              <input
                ref={roundLabelInputRef}
                type={'text'}
                className={styles['roundHeadingLabelInput']}
                value={roundLabelDraft}
                onChange={(event) => setRoundLabelDraft(event.target.value)}
                onBlur={commitRoundLabelEdit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    commitRoundLabelEdit();
                    return;
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelRoundLabelEdit();
                  }
                }}
                aria-label={'Round Label'}
              />
            ) : (
              <button
                type={'button'}
                className={styles['roundHeadingRoundButton']}
                onClick={openRoundLabelEditor}
              >
                {currentRoundLabel}
              </button>
            )}
          </div>
          <table className={styles['trackerTable']}>
            <thead>
              <tr>
                <th className={styles['cornerHeader']}>
                  <div className={styles['cornerLabel']}>Init</div>
                  <div className={styles['initiativeGrid']}>
                    <label className={styles['initiativeField']}>
                      <span className={styles['initiativeLabel']}>P</span>
                      <input
                        className={styles['initiativeInput']}
                        type={'text'}
                        inputMode={'numeric'}
                        maxLength={1}
                        value={currentRound.partyInitiative}
                        onChange={(event) =>
                          dispatch({
                            type: 'set-round-field',
                            field: 'partyInitiative',
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className={styles['initiativeField']}>
                      <span className={styles['initiativeLabel']}>E</span>
                      <input
                        className={styles['initiativeInput']}
                        type={'text'}
                        inputMode={'numeric'}
                        maxLength={1}
                        value={currentRound.enemyInitiative}
                        onChange={(event) =>
                          dispatch({
                            type: 'set-round-field',
                            field: 'enemyInitiative',
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </th>
                {currentRound.party.map((combatant, partyIndex) => (
                  <th
                    key={`party-header-${combatant.key}`}
                    className={styles['partyHeader']}
                    style={partyColumnStyles[partyIndex]}
                  >
                    <TrackerCombatantInput
                      combatant={combatant}
                      side={'party'}
                      canRemove={currentRound.party.length > 1}
                      onRemove={() =>
                        dispatch({
                          type: 'remove-combatant',
                          side: 'party',
                          index: partyIndex,
                        })
                      }
                      onUpdate={(nextCombatant) =>
                        dispatch({
                          type: 'update-combatant',
                          side: 'party',
                          index: partyIndex,
                          combatant: nextCombatant,
                        })
                      }
                    />
                  </th>
                ))}
                {enemyFieldDefinitions.map((field) => (
                  <th
                    key={`enemy-field-header-${field.key}`}
                    className={
                      field.key === 'hp'
                        ? `${styles['enemyFieldHeader']} ${styles['enemyHpHeader']}`
                        : field.key === 'action'
                        ? `${styles['enemyFieldHeader']} ${styles['enemyActionHeader']}`
                        : styles['enemyFieldHeader']
                    }
                  >
                    {field.key === 'hp' ? 'HP' : field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRound.enemies.map((combatant, enemyIndex) => (
                <tr key={`enemy-row-${combatant.key}`}>
                  <th className={styles['enemyHeader']}>
                    <TrackerCombatantInput
                      combatant={combatant}
                      side={'enemy'}
                      canRemove={currentRound.enemies.length > 1}
                      onRemove={() =>
                        dispatch({
                          type: 'remove-combatant',
                          side: 'enemy',
                          index: enemyIndex,
                        })
                      }
                      onUpdate={(nextCombatant) =>
                        dispatch({
                          type: 'update-combatant',
                          side: 'enemy',
                          index: enemyIndex,
                          combatant: nextCombatant,
                        })
                      }
                    />
                  </th>
                  {currentRound.party.map((_, partyIndex) =>
                    renderInteractionCell(
                      enemyIndex,
                      partyIndex,
                      partyColumnStyles[partyIndex]
                    )
                  )}
                  {enemyFieldDefinitions.map((field) => {
                    const stateValue =
                      currentRound.enemyStates[enemyIndex]?.[field.key] || '';

                    return (
                      <td
                        key={`enemy-field-${combatant.key}-${field.key}`}
                        className={
                          field.key === 'hp'
                            ? `${styles['enemyMetaCell']} ${styles['enemyHpCell']}`
                            : field.key === 'action'
                            ? `${styles['enemyMetaCell']} ${styles['enemyActionCell']}`
                            : styles['enemyMetaCell']
                        }
                      >
                        {field.key === 'hp' ? (
                          renderHpEditor(
                            combatant.maxHp,
                            stateValue,
                            (value) =>
                              dispatch({
                                type: 'set-enemy-state',
                                index: enemyIndex,
                                field: field.key,
                                value,
                              }),
                            'enemy'
                          )
                        ) : field.key === 'action' ? (
                          renderActionIntentionControl(
                            'enemy',
                            enemyIndex,
                            stateValue
                          )
                        ) : (
                          <AutoHeightTextarea
                            className={styles['metaTextarea']}
                            value={stateValue}
                            onChange={(value) =>
                              dispatch({
                                type: 'set-enemy-state',
                                index: enemyIndex,
                                field: field.key,
                                value,
                              })
                            }
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              {partyFieldDefinitions.map((field, fieldIndex) => (
                <tr key={`party-field-row-${field.key}`}>
                  <th className={styles['partyFieldLabel']}>{field.label}</th>
                  {currentRound.party.map((combatant, partyIndex) => {
                    const stateValue =
                      currentRound.partyStates[partyIndex]?.[field.key] || '';

                    return (
                      <td
                        key={`party-field-${combatant.key}-${field.key}`}
                        className={
                          field.key === 'action'
                            ? `${styles['partyMetaCell']} ${styles['partyActionCell']}`
                            : styles['partyMetaCell']
                        }
                        style={partyColumnStyles[partyIndex]}
                      >
                        {field.key === 'hp' ? (
                          renderHpEditor(
                            combatant.maxHp,
                            stateValue,
                            (value) =>
                              dispatch({
                                type: 'set-party-state',
                                index: partyIndex,
                                field: field.key,
                                value,
                              }),
                            'party'
                          )
                        ) : field.key === 'action' ? (
                          renderActionIntentionControl(
                            'party',
                            partyIndex,
                            stateValue
                          )
                        ) : (
                          <AutoHeightTextarea
                            className={styles['metaTextarea']}
                            value={stateValue}
                            onChange={(value) =>
                              dispatch({
                                type: 'set-party-state',
                                index: partyIndex,
                                field: field.key,
                                value,
                              })
                            }
                          />
                        )}
                      </td>
                    );
                  })}
                  {fieldIndex === 0 && (
                    <td
                      className={styles['summaryCell']}
                      colSpan={enemyFieldDefinitions.length}
                      rowSpan={partyFieldDefinitions.length}
                    >
                      <label className={styles['summaryLabel']}>
                        Round Notes
                      </label>
                      <AutoHeightTextarea
                        className={styles['summaryTextarea']}
                        value={currentRound.summary}
                        onChange={(value) =>
                          dispatch({
                            type: 'set-round-field',
                            field: 'summary',
                            value,
                          })
                        }
                        placeholder={
                          'Anything you want to remember when you revisit this round later.'
                        }
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
        {renderCombatFlowPanel()}
        <section
          ref={combatFlowGraphContainerRef}
          className={styles['initiativeDagPanel']}
          aria-labelledby={'tracker-initiative-dag-title'}
        >
          <h2
            id={'tracker-initiative-dag-title'}
            className={styles['initiativeDagTitle']}
          >
            Precedence DAG
          </h2>
          {resolvedInitiativeRound ? (
            <InitiativeAttackGraphView
              completedNodeIds={combatFlowCompletedNodeIds}
              onNodeSelect={openCombatFlowGraphNode}
              readyNodeIds={combatFlowReadyNodeIds}
              resolvedRound={resolvedInitiativeRound}
              markerIdPrefix={'tracker-initiative-dag'}
              minHeightRem={22}
              readableText={true}
              selectedNodeId={
                combatFlowGraphInspectorNodeId || selectedCombatFlowNode?.id
              }
              showEmptySegmentLanes={true}
              targetPrefix={'→'}
            />
          ) : (
            <div className={styles['initiativeDagEmpty']}>
              Enter party and enemy initiative to draw the current round DAG.
            </div>
          )}
          {combatFlowGraphInspectorModel && combatFlowGraphInspectorPosition ? (
            <InitiativeGraphInspectorPanel
              ref={combatFlowGraphInspectorRef}
              className={styles['graphInspectorPopover']}
              model={combatFlowGraphInspectorModel}
              style={combatFlowGraphInspectorPosition}
              onClick={(event) => event.stopPropagation()}
              onOpenNode={openCombatFlowGraphNode}
              onResolve={markCombatFlowNodeResolved}
              onClearStatus={clearCombatFlowNodeResolved}
            />
          ) : null}
        </section>
      </div>
      {showRecoverModal && (
        <>
          <div className={styles['modalShadow']} onClick={closeRecoverModal} />
          <div
            className={`${styles['modal']} ${styles['recoverModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'recover-drafts-title'}
            aria-describedby={'recover-drafts-description'}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={'recover-drafts-title'} className={styles['modalTitle']}>
              Recover Local Draft
            </div>
            <div className={styles['modalBody']}>
              <p
                id={'recover-drafts-description'}
                className={styles['modalText']}
              >
                Local drafts stay on this browser so you can recover a combat if
                the tab closes before you save the URL elsewhere.
              </p>
              {recoverError && (
                <p className={styles['recoverError']}>{recoverError}</p>
              )}
              {savedDrafts.length > 0 ? (
                <div className={styles['draftList']}>
                  {savedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={
                        draft.id === draftId
                          ? `${styles['draftCard']} ${styles['draftCardCurrent']}`
                          : styles['draftCard']
                      }
                    >
                      <div className={styles['draftCardHeader']}>
                        <div className={styles['draftCardTitle']}>
                          {formatDraftTitle(draft)}
                        </div>
                        <div className={styles['draftCardMeta']}>
                          Round {draft.roundNumber} • Saved{' '}
                          {formatDraftSavedAt(draft.updatedAt)}
                          {draft.id === draftId ? ' • This tab' : ''}
                        </div>
                        {draft.title?.trim() ? (
                          <div className={styles['draftCardSummary']}>
                            {formatDraftNameSummary(draft.partyNames)} vs{' '}
                            {formatDraftNameSummary(draft.enemyNames)}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles['draftCardActions']}>
                        <button
                          type={'button'}
                          className={styles['toolbarButtonPrimary']}
                          disabled={recoveringDraftId === draft.id}
                          onClick={() => void handleRestoreDraft(draft)}
                        >
                          {recoveringDraftId === draft.id
                            ? 'Restoring...'
                            : 'Restore Here'}
                        </button>
                        <button
                          type={'button'}
                          className={styles['toolbarButton']}
                          disabled={recoveringDraftId === draft.id}
                          onClick={() => handleDeleteDraft(draft.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles['modalText']}>
                  No local drafts are stored on this browser yet.
                </p>
              )}
            </div>
            <div className={styles['modalActions']}>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={closeRecoverModal}
              >
                {hasTrackerChanged || loadedFromEncodedState
                  ? 'Keep Current Tracker'
                  : 'Start New Tracker'}
              </button>
            </div>
          </div>
        </>
      )}
      {showUrlWarning && (
        <>
          <div
            className={styles['modalShadow']}
            onClick={() => setShowUrlWarning(false)}
          />
          <div
            className={`${styles['modal']} ${styles['urlWarningModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'url-warning-title'}
            aria-describedby={'url-warning-description'}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={'url-warning-title'} className={styles['modalTitle']}>
              Address Bar URL Is Incomplete
            </div>
            <div className={styles['modalBody']}>
              <div className={styles['urlWarningCount']}>
                {urlWarningLength.toLocaleString()} characters
              </div>
              <p id={'url-warning-description'} className={styles['modalText']}>
                This browser could not keep the full tracker URL in the address
                bar. The page may still work locally, but the displayed
                address-bar URL can reopen as corrupted elsewhere.
              </p>
              <p className={styles['modalText']}>
                Use Copy Share URL to copy the full encoded tracker state
                directly instead of relying on the browser&apos;s displayed URL.
              </p>
            </div>
            <div className={styles['modalActions']}>
              <button
                type={'button'}
                className={styles['toolbarButtonPrimary']}
                onClick={() => void handleCopyShareUrl()}
              >
                {shareCopied ? 'Share URL Copied' : 'Copy Share URL'}
              </button>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={() => setShowUrlWarning(false)}
              >
                Continue Editing
              </button>
            </div>
          </div>
        </>
      )}
      {showImportModal && (
        <>
          <div className={styles['modalShadow']} onClick={closeImportModal} />
          <div
            className={`${styles['modal']} ${styles['shareModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'import-share-url-title'}
            aria-describedby={'import-share-url-description'}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={'import-share-url-title'} className={styles['modalTitle']}>
              Import Share URL
            </div>
            <div className={styles['modalBody']}>
              <p
                id={'import-share-url-description'}
                className={styles['modalText']}
              >
                Paste a combat tracker share URL or encoded tracker state. This
                replaces the current tracker view.
              </p>
              {importError && (
                <p className={styles['recoverError']}>{importError}</p>
              )}
              <textarea
                ref={importTextareaRef}
                className={styles['shareUrlTextarea']}
                value={importUrlValue}
                onChange={(event) => setImportUrlValue(event.target.value)}
              />
            </div>
            <div className={styles['modalActions']}>
              <button
                type={'button'}
                className={styles['toolbarButtonPrimary']}
                disabled={!importUrlValue.trim() || importingShareUrl}
                onClick={() => void handleImportShareUrl()}
              >
                {importingShareUrl ? 'Importing...' : 'Import Tracker'}
              </button>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                disabled={importingShareUrl}
                onClick={closeImportModal}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
      {showShareModal && shareModalUrl && (
        <>
          <div className={styles['modalShadow']} onClick={closeShareModal} />
          <div
            className={`${styles['modal']} ${styles['shareModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'share-url-title'}
            aria-describedby={'share-url-description'}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={'share-url-title'} className={styles['modalTitle']}>
              Copy Share URL
            </div>
            <div className={styles['modalBody']}>
              <p id={'share-url-description'} className={styles['modalText']}>
                Clipboard access was blocked, so the full tracker URL is shown
                here instead.
              </p>
              {shareModalUrl.length >= URL_WARNING_THRESHOLD ? (
                <div className={styles['shareUrlNotice']}>
                  This URL is {shareModalUrl.length.toLocaleString()}{' '}
                  characters. Copy this full field rather than the address bar.
                </div>
              ) : null}
              <textarea
                ref={shareTextareaRef}
                readOnly
                className={styles['shareUrlTextarea']}
                value={shareModalUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
            <div className={styles['modalActions']}>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={closeShareModal}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
      {showDeleteRoundModal && (
        <>
          <div
            className={styles['modalShadow']}
            onClick={closeDeleteRoundModal}
          />
          <div
            className={`${styles['modal']} ${styles['confirmModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'delete-round-title'}
            aria-describedby={'delete-round-description'}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={'delete-round-title'} className={styles['modalTitle']}>
              Delete Round
            </div>
            <div className={styles['modalBody']}>
              <p
                id={'delete-round-description'}
                className={styles['modalText']}
              >
                Delete {currentRoundLabel}? This removes the round and its
                recorded actions from the tracker.
              </p>
            </div>
            <div className={styles['modalActions']}>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={closeDeleteRoundModal}
              >
                Cancel
              </button>
              <button
                type={'button'}
                className={styles['toolbarButtonDanger']}
                onClick={confirmDeleteRound}
              >
                Delete Round
              </button>
            </div>
          </div>
        </>
      )}
      {selectedAttackDetail && (
        <>
          <div
            className={styles['modalShadow']}
            onClick={closeAttackDetailModal}
          />
          <div
            className={`${styles['modal']} ${styles['attackDetailModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'attack-detail-title'}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={'attack-detail-title'} className={styles['modalTitle']}>
              Attack Detail
            </div>
            <div className={styles['modalBody']}>
              <div className={styles['attackDetailMatchup']}>
                {selectedAttackDetail.attackerName}
                {' -> '}
                {selectedAttackDetail.targetName}
              </div>
              <dl className={styles['attackDetailList']}>
                {selectedAttackHasOffHand ? (
                  <div className={styles['attackDetailRow']}>
                    <dt>Attack</dt>
                    <dd>
                      {attackDetailTarget?.hand === 'offHand'
                        ? 'Off-hand'
                        : 'Main hand'}
                    </dd>
                  </div>
                ) : null}
                <div className={styles['attackDetailRow']}>
                  <dt>Weapon</dt>
                  <dd>{selectedAttackDetail.weaponName}</dd>
                </div>
                <div className={styles['attackDetailRow']}>
                  <dt>Target armor</dt>
                  <dd>
                    {selectedAttackDetail.targetArmorDescription}, AC{' '}
                    {selectedAttackDetail.targetArmorClass}
                  </dd>
                </div>
                <div className={styles['attackDetailRow']}>
                  <dt>Base target</dt>
                  <dd>
                    THAC0 {selectedAttackDetail.thaco} vs AC{' '}
                    {selectedAttackDetail.targetArmorClass}: needs{' '}
                    {selectedAttackDetail.unadjustedToHit}
                  </dd>
                </div>
                <div className={styles['attackDetailRow']}>
                  <dt>Weapon vs armor</dt>
                  <dd>
                    {getTrackerWeaponAdjustmentSummary(selectedAttackDetail)}
                  </dd>
                </div>
                {shouldShowTrackerEffectiveArmorClass(selectedAttackDetail) ? (
                  <div className={styles['attackDetailRow']}>
                    <dt>Effective AC</dt>
                    <dd>{selectedAttackDetail.adjustedArmorClass}</dd>
                  </div>
                ) : null}
              </dl>
              <div className={styles['attackDetailResult']}>
                Needs {selectedAttackDetail.toHit}+ on d20
              </div>
            </div>
            <div className={styles['modalActions']}>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={closeAttackDetailModal}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
      {cellActionAssignmentTarget &&
        selectedCellActionAssignment &&
        selectedCellActionAssignment.options.length >= 2 && (
          <>
            <div
              className={`${styles['modalShadow']} ${styles['targetActionModalShadow']}`}
              onClick={closeCellActionAssignmentModal}
            />
            <div
              className={`${styles['modal']} ${styles['targetActionModal']}`}
              role={'dialog'}
              aria-modal={'true'}
              aria-labelledby={'target-action-title'}
              onClick={(event) => event.stopPropagation()}
            >
              <div id={'target-action-title'} className={styles['modalTitle']}>
                Assign Target
              </div>
              <div className={styles['modalBody']}>
                <div className={styles['targetActionMatchup']}>
                  {selectedCellActionAssignment.sourceName}
                  {' -> '}
                  {selectedCellActionAssignment.targetName}
                </div>
                <div className={styles['targetActionOptionList']}>
                  {selectedCellActionAssignment.options.map((option) => {
                    const checked = cellActionAssignmentDraftIds.includes(
                      option.id
                    );

                    return (
                      <label
                        key={option.id}
                        className={styles['targetActionOption']}
                      >
                        <input
                          type={'checkbox'}
                          checked={checked}
                          onChange={(event) => {
                            setCellActionAssignmentError(undefined);
                            setCellActionAssignmentDraftIds((actionIds) =>
                              event.target.checked
                                ? actionIds.includes(option.id)
                                  ? actionIds
                                  : actionIds.concat(option.id)
                                : actionIds.filter(
                                    (actionId) => actionId !== option.id
                                  )
                            );
                          }}
                        />
                        <span className={styles['targetActionOptionTitle']}>
                          {option.title}
                        </span>
                        <span className={styles['targetActionOptionSummary']}>
                          {option.summary}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {cellActionAssignmentError ? (
                  <div className={styles['actionIntentError']}>
                    {cellActionAssignmentError}
                  </div>
                ) : null}
              </div>
              <div className={styles['modalActions']}>
                <button
                  type={'button'}
                  className={styles['toolbarButton']}
                  onClick={closeCellActionAssignmentModal}
                >
                  Cancel
                </button>
                <button
                  type={'button'}
                  className={styles['toolbarButtonPrimary']}
                  onClick={saveCellActionAssignment}
                >
                  Save target
                </button>
              </div>
            </div>
          </>
        )}
      {actionEditorTarget && selectedActionEditorDraft && (
        <>
          <div className={styles['modalShadow']} onClick={closeActionEditor} />
          <div
            className={`${styles['modal']} ${styles['actionIntentModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'action-intent-title'}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={'action-intent-title'} className={styles['modalTitle']}>
              Edit Intention
            </div>
            <div className={styles['modalBody']}>
              <div className={styles['actionIntentEditorName']}>
                {actionEditorTarget.side === 'party'
                  ? getPartyDisplayName(actionEditorTarget.index)
                  : getEnemyDisplayName(actionEditorTarget.index)}
              </div>
              <div className={styles['actionIntentActionList']}>
                {actionEditorDrafts.map((draft, actionIndex) => (
                  <button
                    key={draft.id}
                    type={'button'}
                    className={[
                      styles['actionIntentActionButton'],
                      draft.id === selectedActionEditorDraft.id
                        ? styles['actionIntentActionButtonActive']
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() =>
                      setActionEditorTarget((previous) =>
                        previous
                          ? {
                              ...previous,
                              selectedActionId: draft.id,
                            }
                          : previous
                      )
                    }
                  >
                    <span className={styles['actionIntentActionTitle']}>
                      {actionIndex === 0 ? 'Main' : `Action ${actionIndex + 1}`}
                    </span>
                    <span className={styles['actionIntentActionMeta']}>
                      {getActionDraftSummary(draft)}
                    </span>
                  </button>
                ))}
                <button
                  type={'button'}
                  className={styles['actionIntentActionAddButton']}
                  onClick={() => {
                    const combatant = getActionCombatant(
                      currentRound,
                      actionEditorTarget.side,
                      actionEditorTarget.index
                    );

                    if (!combatant) {
                      return;
                    }

                    const nextDraft = createAddedActionEditorDraft(
                      getNextTrackerActionId(
                        actionEditorTarget.side,
                        combatant.key,
                        actionEditorDrafts
                      ),
                      getDefaultTrackerDeclaredAction(combatant)
                    );

                    setActionEditorDrafts((drafts) => drafts.concat(nextDraft));
                    setActionEditorTarget((previous) =>
                      previous
                        ? {
                            ...previous,
                            selectedActionId: nextDraft.id,
                          }
                        : previous
                    );
                  }}
                >
                  Add action
                </button>
              </div>
              {renderActionDraftControls({
                idPrefix: 'action-intent',
                selectedDraft: selectedActionEditorDraft,
                modeOptions: selectedActionEditorModeOptions,
                combatant: selectedActionEditorCombatant,
                updateDraft: updateSelectedActionEditorDraft,
                error: actionEditorError,
              })}
            </div>
            <div className={styles['modalActions']}>
              {actionEditorDrafts.length > 1 &&
              selectedActionEditorDraftIndex > 0 ? (
                <button
                  type={'button'}
                  className={styles['toolbarButtonDanger']}
                  onClick={removeSelectedActionEditorDraft}
                >
                  Remove action
                </button>
              ) : null}
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={closeActionEditor}
              >
                Cancel
              </button>
              <button
                type={'button'}
                className={styles['toolbarButtonPrimary']}
                onClick={saveActionEditor}
              >
                Save intention
              </button>
            </div>
          </div>
        </>
      )}
      {showIntentionsWizard && currentIntentionWizardEntry && (
        <>
          <div
            className={styles['modalShadow']}
            onClick={closeIntentionsWizard}
          />
          <div
            className={`${styles['modal']} ${styles['intentionsModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'intentions-wizard-title'}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              id={'intentions-wizard-title'}
              className={styles['modalTitle']}
            >
              Register Intentions
            </div>
            <div
              className={
                intentionResolvedOnEntry
                  ? `${styles['modalBody']} ${styles['intentionsWizardBodyResolved']}`
                  : styles['modalBody']
              }
            >
              <div className={styles['intentionsWizardMeta']}>
                <span className={styles['intentionsWizardBadge']}>
                  {currentIntentionWizardEntry.side === 'enemy'
                    ? 'Enemy'
                    : 'Party'}
                </span>
                <span className={styles['intentionsWizardProgress']}>
                  {intentionWizardIndex + 1} of {intentionWizardEntries.length}
                </span>
                {intentionResolvedOnEntry ? (
                  <span className={styles['intentionsWizardResolvedBadge']}>
                    Resolved
                  </span>
                ) : null}
                <div className={styles['intentionsWizardNav']}>
                  <button
                    type={'button'}
                    className={styles['toolbarButton']}
                    disabled={intentionWizardIndex === 0}
                    onClick={() =>
                      navigateIntentionsWizard(intentionWizardIndex - 1)
                    }
                  >
                    Previous
                  </button>
                  <button
                    type={'button'}
                    className={styles['toolbarButtonPrimary']}
                    disabled={
                      intentionWizardIndex >= intentionWizardEntries.length - 1
                    }
                    onClick={() =>
                      navigateIntentionsWizard(intentionWizardIndex + 1)
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className={styles['intentionsWizardName']}>
                {currentIntentionWizardEntry.combatantName}
              </div>
              {renderIntentionWizardWeaponPicker()}
              {selectedIntentionWizardActionDraft ? (
                <div className={styles['intentionsWizardActionPanel']}>
                  <div className={styles['actionIntentActionList']}>
                    {intentionWizardActionDrafts.map((draft, actionIndex) => (
                      <button
                        key={draft.id}
                        type={'button'}
                        className={[
                          styles['actionIntentActionButton'],
                          draft.id === selectedIntentionWizardActionDraft.id
                            ? styles['actionIntentActionButtonActive']
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() =>
                          setIntentionWizardSelectedActionId(draft.id)
                        }
                      >
                        <span className={styles['actionIntentActionTitle']}>
                          {actionIndex === 0
                            ? 'Main'
                            : `Action ${actionIndex + 1}`}
                        </span>
                        <span className={styles['actionIntentActionMeta']}>
                          {getActionDraftSummary(draft)}
                        </span>
                      </button>
                    ))}
                    <button
                      type={'button'}
                      className={styles['actionIntentActionAddButton']}
                      onClick={addIntentionWizardAction}
                    >
                      Add action
                    </button>
                  </div>
                  {renderActionDraftControls({
                    idPrefix: 'intentions-wizard-action',
                    selectedDraft: selectedIntentionWizardActionDraft,
                    modeOptions: selectedIntentionWizardModeOptions,
                    combatant: currentIntentionWizardCombatant,
                    updateDraft: updateSelectedIntentionWizardActionDraft,
                    error: intentionWizardActionError,
                  })}
                  {intentionWizardActionDrafts.length > 1 &&
                  selectedIntentionWizardActionDraftIndex > 0 ? (
                    <button
                      type={'button'}
                      className={styles['toolbarButtonDanger']}
                      onClick={removeSelectedIntentionWizardAction}
                    >
                      Remove action
                    </button>
                  ) : null}
                </div>
              ) : null}
              <label
                className={styles['modalLabel']}
                htmlFor={'intentions-wizard-effect'}
              >
                Current Effect
              </label>
              <AutoHeightTextarea
                id={'intentions-wizard-effect'}
                className={styles['intentionsWizardTextarea']}
                value={
                  currentIntentionWizardEntry.side === 'enemy'
                    ? currentRound.enemyStates[
                        currentIntentionWizardEntry.index
                      ]?.effect || ''
                    : currentRound.partyStates[
                        currentIntentionWizardEntry.index
                      ]?.effect || ''
                }
                onChange={(value) =>
                  updateIntentionsWizardEffect(
                    currentIntentionWizardEntry,
                    value
                  )
                }
                placeholder={'hopeless 1/9, slowed 3/8, bless, stoneskin...'}
              />
              <div className={styles['modalLabel']}>Targets</div>
              <div
                key={`intentions-target-grid-${currentIntentionWizardEntry.side}-${currentIntentionWizardEntry.combatantKey}`}
                className={styles['intentionsWizardGridWrap']}
              >
                {currentIntentionWizardEntry.side === 'enemy' ? (
                  <table className={styles['intentionsWizardGridTable']}>
                    <thead>
                      <tr>
                        <th className={styles['intentionsWizardCorner']}>
                          Target
                        </th>
                        {currentRound.party.map(
                          (partyCombatant, partyIndex) => (
                            <th
                              key={`intentions-party-header-${partyCombatant.key}`}
                              className={styles['intentionsWizardColumnHeader']}
                            >
                              {getPartyDisplayName(partyIndex)}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th className={styles['intentionsWizardRowHeader']}>
                          {currentIntentionWizardEntry.combatantName}
                        </th>
                        {currentRound.party.map((_, partyIndex) =>
                          renderInteractionCell(
                            currentIntentionWizardEntry.index,
                            partyIndex,
                            undefined,
                            true,
                            'enemyOnly'
                          )
                        )}
                      </tr>
                      <tr>
                        <th
                          className={`${styles['combatWizardHpLabel']} ${styles['combatWizardHpLabelEnemy']}`}
                        >
                          Current Effect
                        </th>
                        {currentRound.party.map((_, partyIndex) => {
                          const partyState =
                            currentRound.partyStates[partyIndex];

                          if (!partyState) {
                            return null;
                          }

                          return (
                            <td
                              key={`intentions-party-effect-${partyIndex}`}
                              className={`${styles['combatWizardEffectCell']} ${styles['combatWizardEffectCellEnemy']}`}
                            >
                              {renderCombatWizardEffectEditor(
                                partyState.effect,
                                (value) =>
                                  dispatch({
                                    type: 'set-party-state',
                                    index: partyIndex,
                                    field: 'effect',
                                    value,
                                  }),
                                'enemy'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <table className={styles['intentionsWizardGridTable']}>
                    <thead>
                      <tr>
                        <th className={styles['intentionsWizardCorner']}>
                          Target
                        </th>
                        <th className={styles['intentionsWizardColumnHeader']}>
                          {currentIntentionWizardEntry.combatantName}
                        </th>
                        <th
                          className={`${styles['combatWizardColumnHeader']} ${styles['combatWizardHpLabelParty']}`}
                        >
                          Current Effect
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRound.enemies.map(
                        (enemyCombatant, enemyIndex) => (
                          <tr
                            key={`intentions-enemy-row-${enemyCombatant.key}`}
                          >
                            <th className={styles['intentionsWizardRowHeader']}>
                              {getEnemyDisplayName(enemyIndex)}
                            </th>
                            {renderInteractionCell(
                              enemyIndex,
                              currentIntentionWizardEntry.index,
                              undefined,
                              true,
                              'partyOnly'
                            )}
                            <td
                              className={`${styles['combatWizardEffectCell']} ${styles['combatWizardEffectCellParty']}`}
                            >
                              {renderCombatWizardEffectEditor(
                                currentRound.enemyStates[enemyIndex]?.effect ||
                                  '',
                                (value) =>
                                  dispatch({
                                    type: 'set-enemy-state',
                                    index: enemyIndex,
                                    field: 'effect',
                                    value,
                                  }),
                                'party'
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className={styles['modalActions']}>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={closeIntentionsWizard}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
      {showCombatWizard && currentCombatWizardEntry && (
        <>
          <div className={styles['modalShadow']} onClick={closeCombatWizard} />
          <div
            className={`${styles['modal']} ${styles['combatModal']}`}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'combat-wizard-title'}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={'combat-wizard-title'} className={styles['modalTitle']}>
              Combat
            </div>
            <div
              className={
                combatResolvedOnEntry
                  ? `${styles['modalBody']} ${styles['combatWizardBodyResolved']}`
                  : styles['modalBody']
              }
            >
              <div className={styles['combatWizardMeta']}>
                <span className={styles['combatWizardBadge']}>
                  {currentCombatWizardEntry.side === 'enemy'
                    ? 'Enemy'
                    : 'Party'}
                </span>
                <span className={styles['combatWizardProgress']}>
                  {combatWizardIndex + 1} of {combatWizardEntries.length}
                </span>
                {combatResolvedOnEntry ? (
                  <span className={styles['combatWizardResolvedBadge']}>
                    Resolved
                  </span>
                ) : null}
                <div className={styles['combatWizardNav']}>
                  <button
                    type={'button'}
                    className={styles['toolbarButton']}
                    disabled={combatWizardIndex === 0}
                    onClick={() => navigateCombatWizard(combatWizardIndex - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type={'button'}
                    className={styles['toolbarButtonPrimary']}
                    disabled={
                      combatWizardIndex >= combatWizardEntries.length - 1
                    }
                    onClick={() => navigateCombatWizard(combatWizardIndex + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className={styles['combatWizardName']}>
                {currentCombatWizardEntry.combatantName}
              </div>
              {currentCombatWizardActions.length > 0 ? (
                <>
                  <div className={styles['modalLabel']}>Action</div>
                  <div
                    className={`${styles['actionIntentActionList']} ${styles['combatWizardActionList']}`}
                  >
                    {currentCombatWizardActions.map((action, actionIndex) => {
                      const actionLines = getActionSummaryLines(action, '');
                      const actionSummary =
                        actionLines.join(' · ') ||
                        formatDeclaredAction(action.declaredAction);

                      return (
                        <button
                          key={action.id}
                          type={'button'}
                          className={[
                            styles['actionIntentActionButton'],
                            action.id === selectedCombatWizardAction?.id
                              ? styles['actionIntentActionButtonActive']
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() =>
                            setCombatWizardSelectedActionId(action.id)
                          }
                        >
                          <span className={styles['actionIntentActionTitle']}>
                            {actionIndex === 0
                              ? 'Main'
                              : `Action ${actionIndex + 1}`}
                          </span>
                          <span className={styles['actionIntentActionMeta']}>
                            {actionSummary}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles['modalLabel']}>Intention</div>
                  <div className={styles['combatWizardReadOnlyValue']}>
                    {currentCombatWizardEntry.intention ||
                      'No intention recorded.'}
                  </div>
                </>
              )}
              <label
                className={styles['modalLabel']}
                htmlFor={'combat-wizard-result'}
              >
                Result
              </label>
              <AutoHeightTextarea
                ref={combatResultTextareaRef}
                id={'combat-wizard-result'}
                className={styles['combatWizardTextarea']}
                value={currentCombatWizardEntry.result}
                onChange={(value) =>
                  updateCombatWizardResult(currentCombatWizardEntry, value)
                }
                placeholder={
                  'misses, hits for 6, sleep: one saves, two asleep...'
                }
              />
              <label
                className={styles['modalLabel']}
                htmlFor={'combat-wizard-effect'}
              >
                Current Effect
              </label>
              <AutoHeightTextarea
                id={'combat-wizard-effect'}
                className={styles['combatWizardTextarea']}
                value={
                  currentCombatWizardEntry.side === 'enemy'
                    ? currentRound.enemyStates[currentCombatWizardEntry.index]
                        ?.effect || ''
                    : currentRound.partyStates[currentCombatWizardEntry.index]
                        ?.effect || ''
                }
                onChange={(value) =>
                  updateCombatWizardEffect(currentCombatWizardEntry, value)
                }
                placeholder={'hopeless 1/9, slowed 3/8, bless, stoneskin...'}
              />
              <div className={styles['modalLabel']}>Targets</div>
              {selectedCombatWizardActionTitle ? (
                <div className={styles['combatWizardTargetScope']}>
                  {selectedCombatWizardActionTitle}
                </div>
              ) : null}
              {renderCombatTargetEditor(
                currentCombatWizardEntry,
                currentCombatWizardTargetIndices,
                selectedCombatWizardAction
              )}
            </div>
            <div className={styles['modalActions']}>
              <button
                type={'button'}
                className={styles['toolbarButton']}
                onClick={closeCombatWizard}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CombatTracker;

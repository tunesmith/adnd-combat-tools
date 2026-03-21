import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { CSSProperties, TextareaHTMLAttributes } from "react";
import {
  addCombatant,
  createInitialTrackerState,
  insertRoundAfterActive,
  removeActiveRound,
  removeCombatant,
  updateCombatant,
} from "../../helpers/trackerState";
import type {
  TrackerCombatant,
  TrackerCellState,
  TrackerCombatantRoundState,
  TrackerRound,
  TrackerState,
} from "../../types/tracker";
import {
  decodeTrackerState,
  encodeTrackerState,
  encodeTrackerStateSync,
} from "../../helpers/trackerCodec";
import {
  deleteTrackerLocalDraft,
  getOrCreateTrackerSessionDraftId,
  listTrackerLocalDrafts,
  saveTrackerLocalDraft,
  setTrackerSessionDraftId,
  type TrackerLocalDraftRecord,
} from "../../helpers/trackerLocalDrafts";
import TrackerCell from "./TrackerCell";
import TrackerCombatantInput from "./TrackerCombatantInput";
import styles from "./tracker.module.css";
import { getTrackerCombatantWidestLineWidth } from "../../helpers/trackerCombatantDisplay";
import {
  buildIntentionWizardEntries,
  replaceIntentionWizardEntry,
  type IntentionWizardEntry,
} from "../../helpers/trackerIntentionsWizard";
import {
  buildCombatWizardEntries,
  type CombatWizardEntry,
} from "../../helpers/trackerCombatWizard";

interface CombatTrackerProps {
  rememberedState?: TrackerState;
  loadedFromEncodedState?: boolean;
}

type TrackerSide = "party" | "enemy";
type RoundField = "partyInitiative" | "enemyInitiative" | "summary";
type RoundCombatantField = keyof TrackerCombatantRoundState;
type CellField = Extract<keyof TrackerCellState, "enemyToParty" | "partyToEnemy">;
type CellVisibilityField = Extract<
  keyof TrackerCellState,
  "enemyToPartyVisible" | "partyToEnemyVisible"
>;

type TrackerAction =
  | { type: "replace-state"; state: TrackerState }
  | { type: "set-title"; value: string }
  | { type: "set-round-label"; value: string }
  | { type: "select-round"; index: number }
  | { type: "set-round-field"; field: RoundField; value: string }
  | {
      type: "set-cell-visibility";
      rowIndex: number;
      columnIndex: number;
      field: CellVisibilityField;
      value: boolean;
    }
  | {
      type: "set-cell";
      rowIndex: number;
      columnIndex: number;
      field: CellField;
      value: string;
    }
  | {
      type: "set-party-state";
      index: number;
      field: RoundCombatantField;
      value: string;
    }
  | {
      type: "set-enemy-state";
      index: number;
      field: RoundCombatantField;
      value: string;
    }
  | {
      type: "update-combatant";
      side: TrackerSide;
      index: number;
      combatant: TrackerCombatant;
    }
  | { type: "add-combatant"; side: TrackerSide; key: number }
  | { type: "remove-combatant"; side: TrackerSide; index: number }
  | { type: "advance-round" }
  | { type: "remove-round" };

const partyFieldDefinitions: { key: RoundCombatantField; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "action", label: "Intention" },
  { key: "result", label: "Result" },
  { key: "effect", label: "Effect" },
  { key: "notes", label: "Notes" },
];

const enemyFieldDefinitions = partyFieldDefinitions;
const PARTY_COLUMN_MIN_WIDTH_PX = 112;
const LOCAL_DRAFT_AUTOSAVE_MS = 750;
const URL_WARNING_THRESHOLD = 6000;
const SHARE_URL_COPIED_MS = 2200;

type AutoHeightTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
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

    textarea.style.height = "0px";
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

        if (typeof forwardedRef === "function") {
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
    return "Unnamed";
  }

  if (names.length <= 2) {
    return names.join(", ");
  }

  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
};

const formatDraftSavedAt = (updatedAt: number): string =>
  new Date(updatedAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatDraftTitle = (draft: TrackerLocalDraftRecord): string =>
  draft.title?.trim()
    ? draft.title
    : `${formatDraftNameSummary(draft.partyNames)} vs ${formatDraftNameSummary(
        draft.enemyNames
      )}`;

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
  const [recoveringDraftId, setRecoveringDraftId] = useState<string | undefined>(
    undefined
  );
  const [showUrlWarning, setShowUrlWarning] = useState<boolean>(false);
  const [urlWarningLength, setUrlWarningLength] = useState<number>(0);
  const [addressBarUrlTruncated, setAddressBarUrlTruncated] =
    useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareModalUrl, setShareModalUrl] = useState<string | undefined>(
    undefined
  );
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);
  const [showDeleteRoundModal, setShowDeleteRoundModal] = useState<boolean>(false);
  const [showIntentionsWizard, setShowIntentionsWizard] = useState<boolean>(false);
  const [intentionWizardEntries, setIntentionWizardEntries] = useState<
    IntentionWizardEntry[]
  >([]);
  const [intentionWizardIndex, setIntentionWizardIndex] = useState<number>(0);
  const [showCombatWizard, setShowCombatWizard] = useState<boolean>(false);
  const [combatWizardIndex, setCombatWizardIndex] = useState<number>(0);
  const [combatWizardAnchorKey, setCombatWizardAnchorKey] = useState<
    number | undefined
  >(undefined);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [isEditingRoundLabel, setIsEditingRoundLabel] = useState<boolean>(false);
  const [roundLabelDraft, setRoundLabelDraft] = useState<string>("");
  const idCounter = useRef<number>(getNextCombatantKey(initialState));
  const pausedEncodedState = useRef<string | undefined>(undefined);
  const urlWarningShown = useRef<boolean>(false);
  const recoverPromptHandled = useRef<boolean>(false);
  const shareTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const combatResultTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const roundLabelInputRef = useRef<HTMLInputElement | null>(null);
  const moreActionsRef = useRef<HTMLDivElement | null>(null);

  const reducer = (state: TrackerState, action: TrackerAction): TrackerState => {
    switch (action.type) {
      case "replace-state":
        return action.state;
      case "set-title":
        return {
          ...state,
          title: action.value || undefined,
        };
      case "set-round-label":
        return updateCurrentRound(state, (round) => ({
          ...round,
          label: action.value,
        }));
      case "select-round":
        return {
          ...state,
          activeRound: action.index,
        };
      case "set-round-field":
        return updateCurrentRound(state, (round) => ({
          ...round,
          [action.field]: action.value,
        }));
      case "set-cell-visibility":
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
      case "set-cell":
        return updateCurrentRound(state, (round) => ({
          ...round,
          cells: round.cells.map((row, rowIndex) =>
            rowIndex === action.rowIndex
              ? row.map((cell, columnIndex) =>
                  columnIndex === action.columnIndex
                    ? {
                        ...cell,
                        [action.field]: action.value,
                        ...(action.field === "enemyToParty"
                          ? { enemyToPartyVisible: true }
                          : { partyToEnemyVisible: true }),
                      }
                    : cell
                )
              : row
          ),
        }));
      case "set-party-state":
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
      case "set-enemy-state":
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
      case "update-combatant":
        return updateCombatant(
          state,
          action.side,
          action.index,
          action.combatant
        );
      case "add-combatant":
        return addCombatant(state, action.side, action.key);
      case "remove-combatant": {
        const activeRound = state.rounds[state.activeRound];
        if (
          (action.side === "party" && (activeRound?.party.length || 0) <= 1) ||
          (action.side === "enemy" && (activeRound?.enemies.length || 0) <= 1)
        ) {
          return state;
        }
        return removeCombatant(state, action.side, action.index);
      }
      case "advance-round":
        return insertRoundAfterActive(state);
      case "remove-round":
        return removeActiveRound(state);
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const currentRound = state.rounds[state.activeRound];
  const currentRoundLabel = currentRound?.label || "";
  const trackerTitle = state.title || "";
  const canOpenCombatWizard = Boolean(
    currentRound?.partyInitiative.trim() && currentRound?.enemyInitiative.trim()
  );
  const combatWizardEntries = useMemo<CombatWizardEntry[]>(
    () => (currentRound ? buildCombatWizardEntries(currentRound) : []),
    [currentRound]
  );
  const currentCombatWizardEntry = combatWizardEntries[combatWizardIndex];
  const currentCombatWizardEntryKey = currentCombatWizardEntry?.combatantKey;
  const hasTrackerChanged = state !== initialStateRef.current;
  const partyColumnStyles = useMemo<CSSProperties[]>(
    () =>
      (currentRound?.party || []).map((combatant) => {
        const widestLineWidth = getTrackerCombatantWidestLineWidth(
          combatant,
          "party"
        );
        const width = Math.max(
          PARTY_COLUMN_MIN_WIDTH_PX,
          widestLineWidth
        );

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
    if (typeof window === "undefined") {
      return;
    }

    try {
      const nextDrafts = listTrackerLocalDrafts(window.localStorage);
      const nextDraftId = getOrCreateTrackerSessionDraftId(window.sessionStorage);
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
      console.error("Unable to initialize tracker drafts:", error);
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
        console.error("An error occurred:", error);
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

    const nextUrl = new URL(
      `${window.location.pathname}?s=${encodedTrackerState}`,
      window.location.origin
    ).toString();

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?s=${encodedTrackerState}`
    );

    const actualEncodedState = window.location.search.startsWith("?s=")
      ? window.location.search.slice(3)
      : "";

    if (actualEncodedState !== encodedTrackerState) {
      setAddressBarUrlTruncated(true);
      setUrlWarningLength(nextUrl.length);
      if (!urlWarningShown.current) {
        setShowUrlWarning(true);
        urlWarningShown.current = true;
      }
      return;
    }

    setAddressBarUrlTruncated(false);

    if (nextUrl.length >= URL_WARNING_THRESHOLD) {
      setUrlWarningLength(nextUrl.length);
      if (!urlWarningShown.current) {
        setShowUrlWarning(true);
        urlWarningShown.current = true;
      }
      return;
    }

    urlWarningShown.current = false;
  }, [encodedTrackerState]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
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
        console.error("Unable to save tracker draft:", error);
      }
    }, LOCAL_DRAFT_AUTOSAVE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [autosavePaused, draftId, encodedTrackerState, hasTrackerChanged, state]);

  useEffect(() => {
    if (typeof window === "undefined" || !draftId || !hasTrackerChanged) {
      return;
    }

    const saveDraftNow = () => {
      try {
        const encodedState = encodeTrackerStateSync(state);

        if (
          autosavePaused &&
          encodedState === pausedEncodedState.current
        ) {
          return;
        }

        saveTrackerLocalDraft(
          window.localStorage,
          draftId,
          encodedState,
          state
        );
      } catch (error) {
        console.error("Unable to save tracker draft before unload:", error);
      }
    };

    window.addEventListener("pagehide", saveDraftNow);
    window.addEventListener("beforeunload", saveDraftNow);

    return () => {
      window.removeEventListener("pagehide", saveDraftNow);
      window.removeEventListener("beforeunload", saveDraftNow);
    };
  }, [autosavePaused, draftId, hasTrackerChanged, state]);

  useEffect(() => {
    if (
      !showUrlWarning &&
      !showRecoverModal &&
      !showShareModal &&
      !showIntentionsWizard &&
      !showCombatWizard
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUrlWarning(false);
        setShowRecoverModal(false);
        setShowShareModal(false);
        setShowDeleteRoundModal(false);
        setShowIntentionsWizard(false);
        setShowCombatWizard(false);
        setShowMoreActions(false);
        setRecoverError(undefined);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showCombatWizard,
    showDeleteRoundModal,
    showIntentionsWizard,
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

    window.addEventListener("mousedown", handlePointerDown);

    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [showMoreActions]);

  useEffect(() => {
    if (combatWizardEntries.length === 0) {
      setCombatWizardIndex(0);
      return;
    }

    if (combatWizardIndex >= combatWizardEntries.length) {
      setCombatWizardIndex(combatWizardEntries.length - 1);
    }
  }, [combatWizardEntries, combatWizardIndex]);

  useEffect(() => {
    if (!currentCombatWizardEntry) {
      return;
    }

    setCombatWizardAnchorKey(currentCombatWizardEntry.combatantKey);
  }, [currentCombatWizardEntry]);

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
  }, [
    combatWizardIndex,
    currentCombatWizardEntryKey,
    showCombatWizard,
  ]);

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

  const closeDeleteRoundModal = () => {
    setShowDeleteRoundModal(false);
  };

  const buildShareUrl = () => {
    if (typeof window === "undefined" || !encodedTrackerState) {
      return undefined;
    }

    return new URL(
      `${window.location.pathname}?s=${encodedTrackerState}`,
      window.location.origin
    ).toString();
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

  const openTitleEditor = () => {
    setTitleDraft(trackerTitle);
    setIsEditingTitle(true);
  };

  const commitTitleEdit = () => {
    dispatch({
      type: "set-title",
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
      type: "set-round-label",
      value: nextLabel,
    });
    setIsEditingRoundLabel(false);
  };

  const cancelRoundLabelEdit = () => {
    setRoundLabelDraft(currentRoundLabel);
    setIsEditingRoundLabel(false);
  };

  const openIntentionsWizard = () => {
    setIntentionWizardEntries(buildIntentionWizardEntries(currentRound));
    setIntentionWizardIndex(0);
    setShowIntentionsWizard(true);
  };

  const closeIntentionsWizard = () => {
    setShowIntentionsWizard(false);
  };

  const openCombatWizard = () => {
    if (!canOpenCombatWizard) {
      return;
    }

    const nextEntries = buildCombatWizardEntries(currentRound);
    const anchorIndex = combatWizardAnchorKey
      ? nextEntries.findIndex(
          (entry) => entry.combatantKey === combatWizardAnchorKey
        )
      : -1;

    setCombatWizardIndex(anchorIndex >= 0 ? anchorIndex : 0);
    setShowCombatWizard(true);
  };

  const closeCombatWizard = () => {
    setShowCombatWizard(false);
  };

  const confirmDeleteRound = () => {
    dispatch({ type: "remove-round" });
    setShowDeleteRoundModal(false);
  };

  const updateWizardEntry = (updater: (entry: IntentionWizardEntry) => IntentionWizardEntry) => {
    if (!currentIntentionWizardEntry) {
      return;
    }

    const nextEntry = updater(currentIntentionWizardEntry);
    setIntentionWizardEntries((previousEntries) =>
      replaceIntentionWizardEntry(previousEntries, intentionWizardIndex, nextEntry)
    );
    dispatch({
      type: nextEntry.side === "enemy" ? "set-enemy-state" : "set-party-state",
      index: nextEntry.index,
      field: "action",
      value: nextEntry.intention,
    });
  };

  const currentIntentionWizardEntry =
    intentionWizardEntries[intentionWizardIndex];
  const currentIntentionResolved = Boolean(
    currentIntentionWizardEntry?.intention.trim()
  );

  const updateCombatWizardResult = (entry: CombatWizardEntry, value: string) => {
    dispatch({
      type: entry.side === "enemy" ? "set-enemy-state" : "set-party-state",
      index: entry.index,
      field: "result",
      value,
    });
  };

  const handleClearCurrentDraft = () => {
    if (
      typeof window === "undefined" ||
      !draftId
    ) {
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
      console.error("Unable to clear tracker draft:", error);
    }
  };

  const handleDeleteDraft = (targetDraftId: string) => {
    if (typeof window === "undefined") {
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
      console.error("Unable to delete tracker draft:", error);
    }
  };

  const handleRestoreDraft = async (draft: TrackerLocalDraftRecord) => {
    if (typeof window === "undefined") {
      return;
    }

    setRecoveringDraftId(draft.id);
    setRecoverError(undefined);

    try {
      const restoredState = await decodeTrackerState(draft.encodedState);
      initialStateRef.current = restoredState;
      dispatch({ type: "replace-state", state: restoredState });
      setTrackerSessionDraftId(window.sessionStorage, draft.id);
      setDraftId(draft.id);
      setHasLocalDraft(true);
      setLastLocalSaveAt(draft.updatedAt);
      setAutosavePaused(false);
      pausedEncodedState.current = undefined;
      closeRecoverModal();
    } catch (error) {
      console.error("Unable to restore tracker draft:", error);
      setRecoverError(
        "This local draft could not be restored. It may be corrupted or from an older broken save."
      );
    } finally {
      setRecoveringDraftId(undefined);
    }
  };

  const localDraftStatus = autosavePaused
    ? "Local autosave paused until the next edit."
    : hasLocalDraft && lastLocalSaveAt
      ? `Saved locally ${formatDraftSavedAt(lastLocalSaveAt)}`
      : "Local recovery will start after your next edit.";

  const getPartyDisplayName = (partyIndex: number): string =>
    currentRound.party[partyIndex]?.name || `Party ${partyIndex + 1}`;

  const getEnemyDisplayName = (enemyIndex: number): string =>
    currentRound.enemies[enemyIndex]?.name || `Enemy ${enemyIndex + 1}`;

  const renderInteractionCell = (
    enemyIndex: number,
    partyIndex: number,
    style?: CSSProperties,
    allowVisibilityToggle = true,
    displayMode: "both" | "enemyOnly" | "partyOnly" = "both"
  ) => {
    const enemyCombatant = currentRound.enemies[enemyIndex];
    const partyCombatant = currentRound.party[partyIndex];
    const cellState = currentRound.cells[enemyIndex]?.[partyIndex];

    if (!enemyCombatant || !partyCombatant || !cellState) {
      return null;
    }

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
        allowVisibilityToggle={allowVisibilityToggle}
        displayMode={displayMode}
        onEnemyToPartyVisibilityChange={(value) =>
          dispatch({
            type: "set-cell-visibility",
            rowIndex: enemyIndex,
            columnIndex: partyIndex,
            field: "enemyToPartyVisible",
            value,
          })
        }
        onPartyToEnemyVisibilityChange={(value) =>
          dispatch({
            type: "set-cell-visibility",
            rowIndex: enemyIndex,
            columnIndex: partyIndex,
            field: "partyToEnemyVisible",
            value,
          })
        }
        onEnemyToPartyChange={(value) =>
          dispatch({
            type: "set-cell",
            rowIndex: enemyIndex,
            columnIndex: partyIndex,
            field: "enemyToParty",
            value,
          })
        }
        onPartyToEnemyChange={(value) =>
          dispatch({
            type: "set-cell",
            rowIndex: enemyIndex,
            columnIndex: partyIndex,
            field: "partyToEnemy",
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
        side === "party" ? styles["hpEditorParty"] : styles["hpEditorEnemy"]
      }
    >
      <span className={styles["hpMaxValue"]}>{maxHp || "-"}</span>
      <AutoHeightTextarea
        className={styles["hpCurrentInput"]}
        value={hp}
        onChange={onChange}
      />
    </div>
  );

  const renderCombatWizardHpEditor = (
    maxHp: string | undefined,
    hp: string,
    onChange: (value: string) => void,
    side: CombatWizardEntry["side"]
  ) => (
    <div
      className={
        side === "party"
          ? `${styles["combatWizardHpEditor"]} ${styles["combatWizardHpEditorParty"]}`
          : `${styles["combatWizardHpEditor"]} ${styles["combatWizardHpEditorEnemy"]}`
      }
    >
      <span
        className={
          side === "party"
            ? `${styles["combatWizardHpMaxValue"]} ${styles["combatWizardHpMaxValueParty"]}`
            : `${styles["combatWizardHpMaxValue"]} ${styles["combatWizardHpMaxValueEnemy"]}`
        }
      >
        {maxHp || "-"}
      </span>
      <AutoHeightTextarea
        className={
          side === "party"
            ? `${styles["combatWizardHpInput"]} ${styles["combatWizardHpInputParty"]}`
            : `${styles["combatWizardHpInput"]} ${styles["combatWizardHpInputEnemy"]}`
        }
        value={hp}
        onChange={onChange}
      />
    </div>
  );

  const renderCombatWizardTargets = (entry: CombatWizardEntry) => {
    if (entry.targetIndices.length === 0) {
      return (
        <div className={styles["combatWizardEmptyTargets"]}>
          No targets are active in the grid for this combatant. You can still
          fill out the action result, or close this modal and adjust targets in
          the tracker.
        </div>
      );
    }

    if (entry.side === "enemy") {
      return (
        <div className={styles["combatWizardGridWrap"]}>
          <table className={styles["combatWizardGridTable"]}>
            <thead>
              <tr>
                <th className={styles["combatWizardCorner"]}>Target</th>
                {entry.targetIndices.map((partyIndex) => {
                  const partyCombatant = currentRound.party[partyIndex];
                  if (!partyCombatant) {
                    return null;
                  }

                  return (
                    <th
                      key={`combat-party-header-${partyCombatant.key}`}
                      className={styles["combatWizardColumnHeader"]}
                    >
                      {getPartyDisplayName(partyIndex)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className={styles["combatWizardRowHeader"]}>
                  {entry.combatantName}
                </th>
                {entry.targetIndices.map((partyIndex) =>
                  renderInteractionCell(
                    entry.index,
                    partyIndex,
                    undefined,
                    false,
                    "enemyOnly"
                  )
                )}
              </tr>
              <tr>
                <th
                  className={`${styles["combatWizardHpLabel"]} ${styles["combatWizardHpLabelEnemy"]}`}
                >
                  HP
                </th>
                {entry.targetIndices.map((partyIndex) => {
                  const partyCombatant = currentRound.party[partyIndex];
                  const partyState = currentRound.partyStates[partyIndex];

                  if (!partyCombatant || !partyState) {
                    return null;
                  }

                  return (
                    <td
                      key={`combat-party-hp-${partyCombatant.key}`}
                      className={`${styles["combatWizardHpCell"]} ${styles["combatWizardHpCellEnemy"]}`}
                    >
                      {renderCombatWizardHpEditor(
                        partyCombatant.maxHp,
                        partyState.hp,
                        (value) =>
                          dispatch({
                            type: "set-party-state",
                            index: partyIndex,
                            field: "hp",
                            value,
                          }),
                        "enemy"
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
      <div className={styles["combatWizardGridWrap"]}>
        <table className={styles["combatWizardListTable"]}>
          <thead>
            <tr>
              <th className={styles["combatWizardCorner"]}>Target</th>
              <th className={styles["combatWizardColumnHeader"]}>
                {entry.combatantName}
              </th>
              <th
                className={`${styles["combatWizardColumnHeader"]} ${styles["combatWizardHpLabelParty"]}`}
              >
                HP
              </th>
            </tr>
          </thead>
          <tbody>
            {entry.targetIndices.map((enemyIndex) => {
              const enemyCombatant = currentRound.enemies[enemyIndex];
              const enemyState = currentRound.enemyStates[enemyIndex];

              if (!enemyCombatant || !enemyState) {
                return null;
              }

              return (
                <tr key={`combat-enemy-row-${enemyCombatant.key}`}>
                  <th className={styles["combatWizardRowHeader"]}>
                    {getEnemyDisplayName(enemyIndex)}
                  </th>
                  {renderInteractionCell(
                    enemyIndex,
                    entry.index,
                    undefined,
                    false,
                    "partyOnly"
                  )}
                  <td
                    className={`${styles["combatWizardHpCell"]} ${styles["combatWizardHpCellParty"]}`}
                  >
                    {renderCombatWizardHpEditor(
                      enemyCombatant.maxHp,
                      enemyState.hp,
                      (value) =>
                        dispatch({
                          type: "set-enemy-state",
                          index: enemyIndex,
                          field: "hp",
                          value,
                        }),
                      "party"
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

  return (
    <div id={"app-modal"}>
      <div className={styles["page"]}>
        <div className={styles["toolbar"]}>
          <div className={styles["pageHeader"]}>
            <div className={styles["pageTitle"]}>AD&amp;D Combat Tracker</div>
            <div className={styles["pageHint"]}>
              Enemy on the left of each matchup cell, party on the right.
            </div>
          </div>
          <div className={styles["toolbarControls"]}>
            <div className={styles["toolbarButtons"]}>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
                onClick={openIntentionsWizard}
              >
                Register Intentions
              </button>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
                disabled={!canOpenCombatWizard}
                onClick={openCombatWizard}
              >
                Combat
              </button>
              <button
                type={"button"}
                className={styles["toolbarButtonPrimary"]}
                onClick={() => dispatch({ type: "advance-round" })}
              >
                Advance Round
              </button>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
                disabled={!encodedTrackerState}
                onClick={() => void handleCopyShareUrl()}
              >
                {shareCopied ? "Share URL Copied" : "Copy Share URL"}
              </button>
              <div className={styles["toolbarMenuWrap"]} ref={moreActionsRef}>
                <button
                  type={"button"}
                  className={styles["toolbarButton"]}
                  aria-haspopup={"menu"}
                  aria-expanded={showMoreActions}
                  onClick={() => setShowMoreActions((previous) => !previous)}
                >
                  More
                </button>
                {showMoreActions ? (
                  <div className={styles["toolbarMenu"]} role={"menu"}>
                    <button
                      type={"button"}
                      className={styles["toolbarMenuItem"]}
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
                      type={"button"}
                      className={styles["toolbarMenuItem"]}
                      disabled={!hasLocalDraft}
                      onClick={() => {
                        handleClearCurrentDraft();
                        setShowMoreActions(false);
                      }}
                    >
                      Clear Local Draft
                    </button>
                    <div className={styles["toolbarMenuDivider"]} />
                    <button
                      type={"button"}
                      className={`${styles["toolbarMenuItem"]} ${styles["toolbarMenuItemDanger"]}`}
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
            <div className={styles["toolbarSubrow"]}>
              <div className={styles["toolbarSubgroup"]}>
                <button
                  type={"button"}
                  className={styles["toolbarButton"]}
                  onClick={() =>
                    dispatch({ type: "add-combatant", side: "party", key: nextKey() })
                  }
                >
                  Add Party Member
                </button>
                <button
                  type={"button"}
                  className={styles["toolbarButton"]}
                  onClick={() =>
                    dispatch({ type: "add-combatant", side: "enemy", key: nextKey() })
                  }
                >
                  Add Enemy
                </button>
              </div>
              <div className={styles["toolbarStatus"]}>{localDraftStatus}</div>
            </div>
          </div>
        </div>
        <div className={styles["roundTabs"]}>
          {state.rounds.map((_, roundIndex) => (
            <button
              key={`round-tab-${roundIndex}`}
              type={"button"}
              className={
                roundIndex === state.activeRound
                  ? styles["roundTabActive"]
                  : styles["roundTab"]
              }
              onClick={() => dispatch({ type: "select-round", index: roundIndex })}
            >
              {state.rounds[roundIndex]?.label || `Round ${roundIndex + 1}`}
            </button>
          ))}
        </div>
        <div className={styles["tableWrap"]}>
          <div className={styles["roundHeading"]}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type={"text"}
                className={styles["roundHeadingTitleInput"]}
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={commitTitleEdit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    commitTitleEdit();
                    return;
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelTitleEdit();
                  }
                }}
                aria-label={"Combat Title"}
                placeholder={"Add Combat Title"}
              />
            ) : trackerTitle ? (
              <button
                type={"button"}
                className={styles["roundHeadingTitleButton"]}
                onClick={openTitleEditor}
              >
                {trackerTitle}
              </button>
            ) : (
              <button
                type={"button"}
                className={styles["roundHeadingTitlePlaceholder"]}
                onClick={openTitleEditor}
              >
                Add Combat Title
              </button>
            )}
            {isEditingRoundLabel ? (
              <input
                ref={roundLabelInputRef}
                type={"text"}
                className={styles["roundHeadingLabelInput"]}
                value={roundLabelDraft}
                onChange={(event) => setRoundLabelDraft(event.target.value)}
                onBlur={commitRoundLabelEdit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    commitRoundLabelEdit();
                    return;
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelRoundLabelEdit();
                  }
                }}
                aria-label={"Round Label"}
              />
            ) : (
              <button
                type={"button"}
                className={styles["roundHeadingRoundButton"]}
                onClick={openRoundLabelEditor}
              >
                {currentRoundLabel}
              </button>
            )}
          </div>
          <table className={styles["trackerTable"]}>
            <thead>
              <tr>
                <th className={styles["cornerHeader"]}>
                  <div className={styles["cornerLabel"]}>Init</div>
                  <div className={styles["initiativeGrid"]}>
                    <label className={styles["initiativeField"]}>
                      <span className={styles["initiativeLabel"]}>P</span>
                      <input
                        className={styles["initiativeInput"]}
                        type={"text"}
                        inputMode={"numeric"}
                        maxLength={1}
                        value={currentRound.partyInitiative}
                        onChange={(event) =>
                          dispatch({
                            type: "set-round-field",
                            field: "partyInitiative",
                            value: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className={styles["initiativeField"]}>
                      <span className={styles["initiativeLabel"]}>E</span>
                      <input
                        className={styles["initiativeInput"]}
                        type={"text"}
                        inputMode={"numeric"}
                        maxLength={1}
                        value={currentRound.enemyInitiative}
                        onChange={(event) =>
                          dispatch({
                            type: "set-round-field",
                            field: "enemyInitiative",
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
                    className={styles["partyHeader"]}
                    style={partyColumnStyles[partyIndex]}
                  >
                    <TrackerCombatantInput
                      combatant={combatant}
                      side={"party"}
                      canRemove={currentRound.party.length > 1}
                      onRemove={() =>
                        dispatch({
                          type: "remove-combatant",
                          side: "party",
                          index: partyIndex,
                        })
                      }
                      onUpdate={(nextCombatant) =>
                        dispatch({
                          type: "update-combatant",
                          side: "party",
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
                      field.key === "hp"
                        ? `${styles["enemyFieldHeader"]} ${styles["enemyHpHeader"]}`
                        : styles["enemyFieldHeader"]
                    }
                  >
                    {field.key === "hp" ? "HP" : field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRound.enemies.map((combatant, enemyIndex) => (
                <tr key={`enemy-row-${combatant.key}`}>
                  <th
                    className={styles["enemyHeader"]}
                  >
                    <TrackerCombatantInput
                      combatant={combatant}
                      side={"enemy"}
                      canRemove={currentRound.enemies.length > 1}
                      onRemove={() =>
                        dispatch({
                          type: "remove-combatant",
                          side: "enemy",
                          index: enemyIndex,
                        })
                      }
                      onUpdate={(nextCombatant) =>
                        dispatch({
                          type: "update-combatant",
                          side: "enemy",
                          index: enemyIndex,
                          combatant: nextCombatant,
                        })
                      }
                    />
                  </th>
                  {currentRound.party.map((_, partyIndex) => (
                    renderInteractionCell(
                      enemyIndex,
                      partyIndex,
                      partyColumnStyles[partyIndex]
                    )
                  ))}
                  {enemyFieldDefinitions.map((field) => {
                    const stateValue =
                      currentRound.enemyStates[enemyIndex]?.[field.key] || "";

                    return (
                      <td
                        key={`enemy-field-${combatant.key}-${field.key}`}
                        className={
                          field.key === "hp"
                            ? `${styles["enemyMetaCell"]} ${styles["enemyHpCell"]}`
                            : styles["enemyMetaCell"]
                        }
                      >
                        {field.key === "hp" ? (
                          renderHpEditor(
                            combatant.maxHp,
                            stateValue,
                            (value) =>
                              dispatch({
                                type: "set-enemy-state",
                                index: enemyIndex,
                                field: field.key,
                                value,
                              }),
                            "enemy"
                          )
                        ) : (
                          <AutoHeightTextarea
                            className={styles["metaTextarea"]}
                            value={stateValue}
                            onChange={(value) =>
                              dispatch({
                                type: "set-enemy-state",
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
                  <th
                    className={styles["partyFieldLabel"]}
                  >
                    {field.label}
                  </th>
                  {currentRound.party.map((combatant, partyIndex) => {
                    const stateValue =
                      currentRound.partyStates[partyIndex]?.[field.key] || "";

                    return (
                      <td
                        key={`party-field-${combatant.key}-${field.key}`}
                        className={styles["partyMetaCell"]}
                        style={partyColumnStyles[partyIndex]}
                      >
                        {field.key === "hp" ? (
                          renderHpEditor(
                            combatant.maxHp,
                            stateValue,
                            (value) =>
                              dispatch({
                                type: "set-party-state",
                                index: partyIndex,
                                field: field.key,
                                value,
                              }),
                            "party"
                          )
                        ) : (
                          <AutoHeightTextarea
                            className={styles["metaTextarea"]}
                            value={stateValue}
                            onChange={(value) =>
                              dispatch({
                                type: "set-party-state",
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
                      className={styles["summaryCell"]}
                      colSpan={enemyFieldDefinitions.length}
                      rowSpan={partyFieldDefinitions.length}
                    >
                      <label className={styles["summaryLabel"]}>Round Notes</label>
                      <AutoHeightTextarea
                        className={styles["summaryTextarea"]}
                        value={currentRound.summary}
                        onChange={(value) =>
                          dispatch({
                            type: "set-round-field",
                            field: "summary",
                            value,
                          })
                        }
                        placeholder={
                          "Anything you want to remember when you revisit this round later."
                        }
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
      </div>
      {showRecoverModal && (
        <>
          <div className={styles["modalShadow"]} onClick={closeRecoverModal} />
          <div
            className={`${styles["modal"]} ${styles["recoverModal"]}`}
            role={"dialog"}
            aria-modal={"true"}
            aria-labelledby={"recover-drafts-title"}
            aria-describedby={"recover-drafts-description"}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={"recover-drafts-title"} className={styles["modalTitle"]}>
              Recover Local Draft
            </div>
            <div className={styles["modalBody"]}>
              <p
                id={"recover-drafts-description"}
                className={styles["modalText"]}
              >
                Local drafts stay on this browser so you can recover a combat if
                the tab closes before you save the URL elsewhere.
              </p>
              {recoverError && (
                <p className={styles["recoverError"]}>{recoverError}</p>
              )}
              {savedDrafts.length > 0 ? (
                <div className={styles["draftList"]}>
                  {savedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={
                        draft.id === draftId
                          ? `${styles["draftCard"]} ${styles["draftCardCurrent"]}`
                          : styles["draftCard"]
                      }
                    >
                      <div className={styles["draftCardHeader"]}>
                        <div className={styles["draftCardTitle"]}>
                          {formatDraftTitle(draft)}
                        </div>
                        <div className={styles["draftCardMeta"]}>
                          Round {draft.roundNumber} • Saved{" "}
                          {formatDraftSavedAt(draft.updatedAt)}
                          {draft.id === draftId ? " • This tab" : ""}
                        </div>
                        {draft.title?.trim() ? (
                          <div className={styles["draftCardSummary"]}>
                            {formatDraftNameSummary(draft.partyNames)} vs{" "}
                            {formatDraftNameSummary(draft.enemyNames)}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles["draftCardActions"]}>
                        <button
                          type={"button"}
                          className={styles["toolbarButtonPrimary"]}
                          disabled={recoveringDraftId === draft.id}
                          onClick={() => void handleRestoreDraft(draft)}
                        >
                          {recoveringDraftId === draft.id
                            ? "Restoring..."
                            : "Restore Here"}
                        </button>
                        <button
                          type={"button"}
                          className={styles["toolbarButton"]}
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
                <p className={styles["modalText"]}>
                  No local drafts are stored on this browser yet.
                </p>
              )}
            </div>
            <div className={styles["modalActions"]}>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
                onClick={closeRecoverModal}
              >
                {hasTrackerChanged || loadedFromEncodedState
                  ? "Keep Current Tracker"
                  : "Start New Tracker"}
              </button>
            </div>
          </div>
        </>
      )}
      {showUrlWarning && (
        <>
          <div
            className={styles["modalShadow"]}
            onClick={() => setShowUrlWarning(false)}
          />
          <div
            className={`${styles["modal"]} ${styles["urlWarningModal"]}`}
            role={"dialog"}
            aria-modal={"true"}
            aria-labelledby={"url-warning-title"}
            aria-describedby={"url-warning-description"}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={"url-warning-title"} className={styles["modalTitle"]}>
              Tracker URL Is Getting Long
            </div>
            <div className={styles["modalBody"]}>
              <div className={styles["urlWarningCount"]}>
                {urlWarningLength.toLocaleString()} characters
              </div>
              {addressBarUrlTruncated ? (
                <>
                  <p
                    id={"url-warning-description"}
                    className={styles["modalText"]}
                  >
                    This browser could not keep the full tracker URL in the
                    address bar. The page may still work locally, but the
                    displayed address-bar URL can reopen as corrupted elsewhere.
                  </p>
                  <p className={styles["modalText"]}>
                    Use Copy Share URL to copy the full encoded tracker state
                    directly instead of relying on the browser&apos;s displayed
                    URL.
                  </p>
                </>
              ) : (
                <>
                  <p
                    id={"url-warning-description"}
                    className={styles["modalText"]}
                  >
                    This tracker is stored entirely in the URL. Once it gets
                    this large, some browsers, chat apps, and notes tools may
                    stop saving or reopening it reliably.
                  </p>
                  <p className={styles["modalText"]}>
                    If you want to keep it portable, consider trimming longer
                    notes or splitting the combat into shorter tracker URLs.
                  </p>
                </>
              )}
            </div>
            <div className={styles["modalActions"]}>
              <button
                type={"button"}
                className={styles["toolbarButtonPrimary"]}
                onClick={() => void handleCopyShareUrl()}
              >
                {shareCopied ? "Share URL Copied" : "Copy Share URL"}
              </button>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
                onClick={() => setShowUrlWarning(false)}
              >
                Continue Editing
              </button>
            </div>
          </div>
        </>
      )}
      {showShareModal && shareModalUrl && (
        <>
          <div className={styles["modalShadow"]} onClick={closeShareModal} />
          <div
            className={`${styles["modal"]} ${styles["shareModal"]}`}
            role={"dialog"}
            aria-modal={"true"}
            aria-labelledby={"share-url-title"}
            aria-describedby={"share-url-description"}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={"share-url-title"} className={styles["modalTitle"]}>
              Copy Share URL
            </div>
            <div className={styles["modalBody"]}>
              <p id={"share-url-description"} className={styles["modalText"]}>
                Clipboard access was blocked, so the full tracker URL is shown
                here instead.
              </p>
              <textarea
                ref={shareTextareaRef}
                readOnly
                className={styles["shareUrlTextarea"]}
                value={shareModalUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
            <div className={styles["modalActions"]}>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
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
          <div className={styles["modalShadow"]} onClick={closeDeleteRoundModal} />
          <div
            className={`${styles["modal"]} ${styles["confirmModal"]}`}
            role={"dialog"}
            aria-modal={"true"}
            aria-labelledby={"delete-round-title"}
            aria-describedby={"delete-round-description"}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={"delete-round-title"} className={styles["modalTitle"]}>
              Delete Round
            </div>
            <div className={styles["modalBody"]}>
              <p id={"delete-round-description"} className={styles["modalText"]}>
                Delete {currentRoundLabel}? This removes the round and its
                recorded actions from the tracker.
              </p>
            </div>
            <div className={styles["modalActions"]}>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
                onClick={closeDeleteRoundModal}
              >
                Cancel
              </button>
              <button
                type={"button"}
                className={styles["toolbarButtonDanger"]}
                onClick={confirmDeleteRound}
              >
                Delete Round
              </button>
            </div>
          </div>
        </>
      )}
      {showIntentionsWizard && currentIntentionWizardEntry && (
        <>
          <div className={styles["modalShadow"]} onClick={closeIntentionsWizard} />
          <div
            className={`${styles["modal"]} ${styles["intentionsModal"]}`}
            role={"dialog"}
            aria-modal={"true"}
            aria-labelledby={"intentions-wizard-title"}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={"intentions-wizard-title"} className={styles["modalTitle"]}>
              Register Intentions
            </div>
            <div
              className={
                currentIntentionResolved
                  ? `${styles["modalBody"]} ${styles["intentionsWizardBodyResolved"]}`
                  : styles["modalBody"]
              }
            >
              <div className={styles["intentionsWizardMeta"]}>
                <span className={styles["intentionsWizardBadge"]}>
                  {currentIntentionWizardEntry.side === "enemy" ? "Enemy" : "Party"}
                </span>
                <span className={styles["intentionsWizardProgress"]}>
                  {intentionWizardIndex + 1} of {intentionWizardEntries.length}
                </span>
                {currentIntentionResolved ? (
                  <span className={styles["intentionsWizardResolvedBadge"]}>
                    Resolved
                  </span>
                ) : null}
                <div className={styles["intentionsWizardNav"]}>
                  <button
                    type={"button"}
                    className={styles["toolbarButton"]}
                    disabled={intentionWizardIndex === 0}
                    onClick={() =>
                      setIntentionWizardIndex((previousIndex) =>
                        Math.max(0, previousIndex - 1)
                      )
                    }
                  >
                    Previous
                  </button>
                  <button
                    type={"button"}
                    className={styles["toolbarButtonPrimary"]}
                    disabled={intentionWizardIndex >= intentionWizardEntries.length - 1}
                    onClick={() =>
                      setIntentionWizardIndex((previousIndex) =>
                        Math.min(
                          intentionWizardEntries.length - 1,
                          previousIndex + 1
                        )
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className={styles["intentionsWizardName"]}>
                {currentIntentionWizardEntry.combatantName}
              </div>
              <label
                className={styles["modalLabel"]}
                htmlFor={"intentions-wizard-text"}
              >
                Intention
              </label>
              <AutoHeightTextarea
                id={"intentions-wizard-text"}
                className={styles["intentionsWizardTextarea"]}
                value={currentIntentionWizardEntry.intention}
                onChange={(value) =>
                  updateWizardEntry((entry) => ({
                    ...entry,
                    intention: value,
                  }))
                }
                placeholder={"advance, attack, cast sleep, hold, charge..."}
              />
              <div className={styles["modalLabel"]}>Targets</div>
              <div className={styles["intentionsWizardGridWrap"]}>
                {currentIntentionWizardEntry.side === "enemy" ? (
                  <table className={styles["intentionsWizardGridTable"]}>
                    <thead>
                      <tr>
                        <th className={styles["intentionsWizardCorner"]}>Target</th>
                        {currentRound.party.map((partyCombatant, partyIndex) => (
                          <th
                            key={`intentions-party-header-${partyCombatant.key}`}
                            className={styles["intentionsWizardColumnHeader"]}
                          >
                            {getPartyDisplayName(partyIndex)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th className={styles["intentionsWizardRowHeader"]}>
                          {currentIntentionWizardEntry.combatantName}
                        </th>
                        {currentRound.party.map((_, partyIndex) =>
                          renderInteractionCell(
                            currentIntentionWizardEntry.index,
                            partyIndex,
                            undefined
                          )
                        )}
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <table className={styles["intentionsWizardGridTable"]}>
                    <thead>
                      <tr>
                        <th className={styles["intentionsWizardCorner"]}>Target</th>
                        <th className={styles["intentionsWizardColumnHeader"]}>
                          {currentIntentionWizardEntry.combatantName}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRound.enemies.map((enemyCombatant, enemyIndex) => (
                        <tr key={`intentions-enemy-row-${enemyCombatant.key}`}>
                          <th className={styles["intentionsWizardRowHeader"]}>
                            {getEnemyDisplayName(enemyIndex)}
                          </th>
                          {renderInteractionCell(
                            enemyIndex,
                            currentIntentionWizardEntry.index,
                            undefined
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className={styles["modalActions"]}>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
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
          <div className={styles["modalShadow"]} onClick={closeCombatWizard} />
          <div
            className={`${styles["modal"]} ${styles["combatModal"]}`}
            role={"dialog"}
            aria-modal={"true"}
            aria-labelledby={"combat-wizard-title"}
            onClick={(event) => event.stopPropagation()}
          >
            <div id={"combat-wizard-title"} className={styles["modalTitle"]}>
              Combat
            </div>
            <div
              className={
                currentCombatWizardEntry.resolved
                  ? `${styles["modalBody"]} ${styles["combatWizardBodyResolved"]}`
                  : styles["modalBody"]
              }
            >
              <div className={styles["combatWizardMeta"]}>
                <span className={styles["combatWizardBadge"]}>
                  {currentCombatWizardEntry.side === "enemy" ? "Enemy" : "Party"}
                </span>
                <span className={styles["combatWizardProgress"]}>
                  {combatWizardIndex + 1} of {combatWizardEntries.length}
                </span>
                {currentCombatWizardEntry.resolved ? (
                  <span className={styles["combatWizardResolvedBadge"]}>
                    Resolved
                  </span>
                ) : null}
                <div className={styles["combatWizardNav"]}>
                  <button
                    type={"button"}
                    className={styles["toolbarButton"]}
                    disabled={combatWizardIndex === 0}
                    onClick={() =>
                      setCombatWizardIndex((previousIndex) =>
                        Math.max(0, previousIndex - 1)
                      )
                    }
                  >
                    Previous
                  </button>
                  <button
                    type={"button"}
                    className={styles["toolbarButtonPrimary"]}
                    disabled={combatWizardIndex >= combatWizardEntries.length - 1}
                    onClick={() =>
                      setCombatWizardIndex((previousIndex) =>
                        Math.min(combatWizardEntries.length - 1, previousIndex + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className={styles["combatWizardName"]}>
                {currentCombatWizardEntry.combatantName}
              </div>
              <div className={styles["modalLabel"]}>Intention</div>
              <div className={styles["combatWizardReadOnlyValue"]}>
                {currentCombatWizardEntry.intention || "No intention recorded."}
              </div>
              <label
                className={styles["modalLabel"]}
                htmlFor={"combat-wizard-result"}
              >
                Result
              </label>
              <AutoHeightTextarea
                ref={combatResultTextareaRef}
                id={"combat-wizard-result"}
                className={styles["combatWizardTextarea"]}
                value={currentCombatWizardEntry.result}
                onChange={(value) =>
                  updateCombatWizardResult(
                    currentCombatWizardEntry,
                    value
                  )
                }
                placeholder={"misses, hits for 6, sleep: one saves, two asleep..."}
              />
              <div className={styles["modalLabel"]}>Current Targets</div>
              {renderCombatWizardTargets(currentCombatWizardEntry)}
            </div>
            <div className={styles["modalActions"]}>
              <button
                type={"button"}
                className={styles["toolbarButton"]}
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

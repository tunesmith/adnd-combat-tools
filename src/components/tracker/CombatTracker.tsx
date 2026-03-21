import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
import { decodeTrackerState, encodeTrackerState } from "../../helpers/trackerCodec";
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
  toggleIntentionWizardEntryTarget,
  type IntentionWizardEntry,
} from "../../helpers/trackerIntentionsWizard";

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

const AutoHeightTextarea = ({
  className,
  value,
  onChange,
}: {
  className?: string;
  value: string;
  onChange: (value: string) => void;
}) => {
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
      ref={textareaRef}
      rows={1}
      className={className}
      value={value}
      onInput={resizeTextarea}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};

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
  const [showIntentionsWizard, setShowIntentionsWizard] = useState<boolean>(false);
  const [intentionWizardEntries, setIntentionWizardEntries] = useState<
    IntentionWizardEntry[]
  >([]);
  const [intentionWizardIndex, setIntentionWizardIndex] = useState<number>(0);
  const idCounter = useRef<number>(getNextCombatantKey(initialState));
  const pausedEncodedState = useRef<string | undefined>(undefined);
  const urlWarningShown = useRef<boolean>(false);
  const recoverPromptHandled = useRef<boolean>(false);
  const shareTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const reducer = (state: TrackerState, action: TrackerAction): TrackerState => {
    switch (action.type) {
      case "replace-state":
        return action.state;
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
    if (
      !showUrlWarning &&
      !showRecoverModal &&
      !showShareModal &&
      !showIntentionsWizard
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUrlWarning(false);
        setShowRecoverModal(false);
        setShowShareModal(false);
        setShowIntentionsWizard(false);
        setRecoverError(undefined);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntentionsWizard, showRecoverModal, showShareModal, showUrlWarning]);

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

  const openIntentionsWizard = () => {
    setIntentionWizardEntries(buildIntentionWizardEntries(currentRound));
    setIntentionWizardIndex(0);
    setShowIntentionsWizard(true);
  };

  const closeIntentionsWizard = () => {
    setShowIntentionsWizard(false);
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

  const toggleWizardTarget = (targetIndex: number) => {
    if (!currentIntentionWizardEntry) {
      return;
    }

    const { nextEntry, visibilityChange } = toggleIntentionWizardEntryTarget(
      currentIntentionWizardEntry,
      targetIndex
    );

    if (!visibilityChange) {
      return;
    }

    setIntentionWizardEntries((previousEntries) =>
      replaceIntentionWizardEntry(previousEntries, intentionWizardIndex, nextEntry)
    );
    dispatch({
      type: "set-cell-visibility",
      ...visibilityChange,
    });
  };

  const currentIntentionWizardEntry =
    intentionWizardEntries[intentionWizardIndex];

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

  return (
    <div id={"app-modal"}>
      <div className={styles["page"]}>
        <div className={styles["toolbar"]}>
          <div>
            <div className={styles["pageTitle"]}>AD&amp;D Combat Tracker</div>
            <div className={styles["pageHint"]}>
              Enemy on the left of each matchup cell, party on the right.
            </div>
          </div>
          <div className={styles["toolbarButtons"]}>
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
              disabled={state.rounds.length <= 1}
              onClick={() => dispatch({ type: "remove-round" })}
            >
              Delete Round
            </button>
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
              disabled={!encodedTrackerState}
              onClick={() => void handleCopyShareUrl()}
            >
              {shareCopied ? "Share URL Copied" : "Copy Share URL"}
            </button>
            <button
              type={"button"}
              className={styles["toolbarButton"]}
              disabled={savedDrafts.length === 0}
              onClick={() => {
                setRecoverError(undefined);
                setShowRecoverModal(true);
              }}
            >
              Recover Local Draft
            </button>
            <button
              type={"button"}
              className={styles["toolbarButton"]}
              disabled={!hasLocalDraft}
              onClick={handleClearCurrentDraft}
            >
              Clear Local Draft
            </button>
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
            <div className={styles["toolbarStatus"]}>{localDraftStatus}</div>
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
              Round {roundIndex + 1}
            </button>
          ))}
        </div>
        <div className={styles["tableWrap"]}>
          <div className={styles["roundHeading"]}>
            Round {state.activeRound + 1}
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
                  {currentRound.party.map((partyCombatant, partyIndex) => (
                    <TrackerCell
                      key={`cell-${combatant.key}-${partyCombatant.key}`}
                      style={partyColumnStyles[partyIndex]}
                      rowCombatant={combatant}
                      columnCombatant={partyCombatant}
                      enemyToPartyValue={
                        currentRound.cells[enemyIndex]?.[partyIndex]
                          ?.enemyToParty || ""
                      }
                      partyToEnemyValue={
                        currentRound.cells[enemyIndex]?.[partyIndex]
                          ?.partyToEnemy || ""
                      }
                      enemyToPartyVisible={
                        currentRound.cells[enemyIndex]?.[partyIndex]
                          ?.enemyToPartyVisible || false
                      }
                      partyToEnemyVisible={
                        currentRound.cells[enemyIndex]?.[partyIndex]
                          ?.partyToEnemyVisible || false
                      }
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
                          <textarea
                            className={styles["metaTextarea"]}
                            value={stateValue}
                            onChange={(event) =>
                              dispatch({
                                type: "set-enemy-state",
                                index: enemyIndex,
                                field: field.key,
                                value: event.target.value,
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
                          <textarea
                            className={styles["metaTextarea"]}
                            value={stateValue}
                            onChange={(event) =>
                              dispatch({
                                type: "set-party-state",
                                index: partyIndex,
                                field: field.key,
                                value: event.target.value,
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
                      <textarea
                        className={styles["summaryTextarea"]}
                        value={currentRound.summary}
                        onChange={(event) =>
                          dispatch({
                            type: "set-round-field",
                            field: "summary",
                            value: event.target.value,
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
                          {formatDraftNameSummary(draft.partyNames)} vs{" "}
                          {formatDraftNameSummary(draft.enemyNames)}
                        </div>
                        <div className={styles["draftCardMeta"]}>
                          Round {draft.roundNumber} • Saved{" "}
                          {formatDraftSavedAt(draft.updatedAt)}
                          {draft.id === draftId ? " • This tab" : ""}
                        </div>
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
            <div className={styles["modalBody"]}>
              <div className={styles["intentionsWizardMeta"]}>
                <span className={styles["intentionsWizardBadge"]}>
                  {currentIntentionWizardEntry.side === "enemy" ? "Enemy" : "Party"}
                </span>
                <span className={styles["intentionsWizardProgress"]}>
                  {intentionWizardIndex + 1} of {intentionWizardEntries.length}
                </span>
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
              <textarea
                id={"intentions-wizard-text"}
                className={styles["intentionsWizardTextarea"]}
                value={currentIntentionWizardEntry.intention}
                onChange={(event) =>
                  updateWizardEntry((entry) => ({
                    ...entry,
                    intention: event.target.value,
                  }))
                }
                placeholder={"advance, attack, cast sleep, hold, charge..."}
              />
              <div className={styles["modalLabel"]}>Targets</div>
              <div className={styles["intentionsWizardTargets"]}>
                {currentIntentionWizardEntry.targetOptions.map((targetOption) => (
                  <label
                    key={`${currentIntentionWizardEntry.combatantKey}-${targetOption.targetKey}`}
                    className={
                      targetOption.selected
                        ? `${styles["intentionsWizardTarget"]} ${styles["intentionsWizardTargetActive"]}`
                        : styles["intentionsWizardTarget"]
                    }
                  >
                    <input
                      type={"checkbox"}
                      checked={targetOption.selected}
                      disabled={targetOption.lockedOpen}
                      onChange={() => toggleWizardTarget(targetOption.targetIndex)}
                    />
                    <span>{targetOption.targetName}</span>
                  </label>
                ))}
              </div>
              <div className={styles["intentionsWizardPreview"]}>
                <span className={styles["intentionsWizardPreviewLabel"]}>
                  Active targets:
                </span>
                <span className={styles["intentionsWizardPreviewValue"]}>
                  {currentIntentionWizardEntry.targetOptions
                    .filter((targetOption) => targetOption.selected)
                    .map((targetOption) => targetOption.targetName)
                    .join(", ") || "None selected"}
                </span>
              </div>
            </div>
            <div className={styles["modalActions"]}>
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
                className={styles["toolbarButton"]}
                onClick={closeIntentionsWizard}
              >
                Close
              </button>
              {intentionWizardIndex < intentionWizardEntries.length - 1 ? (
                <button
                  type={"button"}
                  className={styles["toolbarButtonPrimary"]}
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
              ) : (
                <button
                  type={"button"}
                  className={styles["toolbarButtonPrimary"]}
                  onClick={closeIntentionsWizard}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CombatTracker;

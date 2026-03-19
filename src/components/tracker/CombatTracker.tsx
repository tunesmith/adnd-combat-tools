import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { deflate } from "zlib";
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
import TrackerCell from "./TrackerCell";
import TrackerCombatantInput from "./TrackerCombatantInput";
import styles from "./tracker.module.css";
import { getTrackerCombatantWidestLineWidth } from "../../helpers/trackerCombatantDisplay";

interface CombatTrackerProps {
  rememberedState?: TrackerState;
}

type TrackerSide = "party" | "enemy";
type RoundField = "partyInitiative" | "enemyInitiative" | "summary";
type RoundCombatantField = keyof TrackerCombatantRoundState;
type CellField = keyof TrackerCellState;

type TrackerAction =
  | { type: "select-round"; index: number }
  | { type: "set-round-field"; field: RoundField; value: string }
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
const URL_WARNING_THRESHOLD = 6000;

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
  Math.max(0, ...state.party.map((combatant) => combatant.key), ...state.enemies.map((combatant) => combatant.key)) + 1;

const CombatTracker = ({ rememberedState }: CombatTrackerProps) => {
  const initialState = useMemo<TrackerState>(
    () => rememberedState || createInitialTrackerState(),
    [rememberedState]
  );
  const [encodedTrackerState, setEncodedTrackerState] = useState<
    string | undefined
  >(undefined);
  const [showUrlWarning, setShowUrlWarning] = useState<boolean>(false);
  const [urlWarningLength, setUrlWarningLength] = useState<number>(0);
  const idCounter = useRef<number>(getNextCombatantKey(initialState));
  const urlWarningShown = useRef<boolean>(false);

  const reducer = (state: TrackerState, action: TrackerAction): TrackerState => {
    switch (action.type) {
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
      case "remove-combatant":
        if (
          (action.side === "party" && state.party.length <= 1) ||
          (action.side === "enemy" && state.enemies.length <= 1)
        ) {
          return state;
        }
        return removeCombatant(state, action.side, action.index);
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
  const partyColumnStyles = useMemo<CSSProperties[]>(
    () =>
      state.party.map((combatant) => {
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
    [state.party]
  );

  useEffect(() => {
    deflate(JSON.stringify(state), (err, buffer) => {
      if (err) {
        console.error("An error occurred:", err);
        process.exitCode = 1;
        return;
      }
      setEncodedTrackerState(encodeURIComponent(buffer.toString("base64")));
    });
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
    if (!showUrlWarning) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUrlWarning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showUrlWarning]);

  if (!currentRound) {
    return <></>;
  }

  const nextKey = () => {
    const current = idCounter.current;
    idCounter.current += 1;
    return current;
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
              className={styles["toolbarButton"]}
              disabled={state.activeRound === 0}
              onClick={() =>
                dispatch({ type: "select-round", index: state.activeRound - 1 })
              }
            >
              Previous Round
            </button>
            <button
              type={"button"}
              className={styles["toolbarButton"]}
              disabled={state.activeRound >= state.rounds.length - 1}
              onClick={() =>
                dispatch({ type: "select-round", index: state.activeRound + 1 })
              }
            >
              Next Round
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
              disabled={state.rounds.length <= 1}
              onClick={() => dispatch({ type: "remove-round" })}
            >
              Delete Round
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
                {state.party.map((combatant, partyIndex) => (
                  <th
                    key={`party-header-${combatant.key}`}
                    className={styles["partyHeader"]}
                    style={partyColumnStyles[partyIndex]}
                  >
                    <TrackerCombatantInput
                      combatant={combatant}
                      side={"party"}
                      canRemove={state.party.length > 1}
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
              {state.enemies.map((combatant, enemyIndex) => (
                <tr key={`enemy-row-${combatant.key}`}>
                  <th
                    className={styles["enemyHeader"]}
                  >
                    <TrackerCombatantInput
                      combatant={combatant}
                      side={"enemy"}
                      canRemove={state.enemies.length > 1}
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
                  {state.party.map((partyCombatant, partyIndex) => (
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
                  {state.party.map((combatant, partyIndex) => {
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
              <p id={"url-warning-description"} className={styles["modalText"]}>
                This tracker is stored entirely in the URL. Once it gets this
                large, some browsers, chat apps, and notes tools may stop
                saving or reopening it reliably.
              </p>
              <p className={styles["modalText"]}>
                If you want to keep it portable, consider trimming longer notes
                or splitting the combat into shorter tracker URLs.
              </p>
            </div>
            <div className={styles["modalActions"]}>
              <button
                type={"button"}
                className={styles["toolbarButtonPrimary"]}
                onClick={() => setShowUrlWarning(false)}
              >
                Continue Editing
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CombatTracker;

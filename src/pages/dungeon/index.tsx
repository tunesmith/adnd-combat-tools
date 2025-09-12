import { FormEvent, useMemo, useRef, useState } from "react";
import styles from "./dungeon.module.css";
import { rollDice } from "../../dungeon/helpers/dungeonLookup";
import { runDungeonStep } from "../../dungeon/services/adapters";
import { DungeonMessage, DungeonRenderable, DungeonRollTrace, RollTraceItem } from "../../types/dungeon";

type ActionKind = "passage" | "door";

type FeedItem = {
  id: string;
  action: ActionKind;
  roll: number;
  messages: DungeonRenderable[];
};

const DungeonIndexPage = () => {
  const [action, setAction] = useState<ActionKind>("passage");
  const [rollInput, setRollInput] = useState<string>("");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  const parsedRoll = useMemo(() => {
    const n = Number(rollInput);
    if (!Number.isInteger(n)) return undefined;
    return n;
  }, [rollInput]);

  const isValid = useMemo(() => {
    return parsedRoll !== undefined && parsedRoll >= 1 && parsedRoll <= 20;
  }, [parsedRoll]);

  const addToFeed = (act: ActionKind, roll: number) => {
    const step = runDungeonStep(act, { roll });
    const item: FeedItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: act,
      roll,
      messages: step.messages,
    };
    setFeed((prev) => [item, ...prev]);
    // announce briefly for a11y
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `${act} roll: ${roll}`;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || parsedRoll === undefined) return;
    addToFeed(action, parsedRoll);
    // Actual dungeon generation will be wired in a later step
  };

  const handleRoll = () => {
    const r = rollDice(20);
    setRollInput(String(r));
    addToFeed(action, r);
  };

  return (
    <div className={styles["outerContainer"]}>
      <div className={styles["title"]}>AD&D Random Dungeon Generator</div>
      <div className={styles["contentContainer"]}>
        <div className={styles["toolbar"]}>
          <button
            type="button"
            className={styles["button"]}
            onClick={() => setFeed([])}
          >
            Clear Feed
          </button>
        </div>
        <form className={styles["formContainer"]} onSubmit={handleSubmit}>
          <div className={styles["controlsRow"]}>
            <div className={styles["actionSelector"]}>
              <label>
                <input
                  type="radio"
                  name="action"
                  value="passage"
                  checked={action === "passage"}
                  onChange={() => setAction("passage")}
                />
                Passage
              </label>
              <label>
                <input
                  type="radio"
                  name="action"
                  value="door"
                  checked={action === "door"}
                  onChange={() => setAction("door")}
                />
                Door
              </label>
            </div>

            <label>
              d20 Roll:
              <input
                className={styles["numberInput"]}
                type="number"
                min={1}
                max={20}
                inputMode="numeric"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                aria-invalid={rollInput.length > 0 && !isValid}
              />
            </label>

            <button
              type="button"
              className={styles["button"]}
              onClick={handleRoll}
              aria-label="Roll a d20 and submit"
            >
              Roll
            </button>

            <button
              type="submit"
              className={styles["button"]}
              disabled={!isValid}
            >
              Submit
            </button>
          </div>

          {rollInput.length > 0 && !isValid && (
            <div className={styles["errorText"]}>Enter an integer 1–20.</div>
          )}
        </form>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(1px, 1px, 1px, 1px)" }}
          ref={liveRegionRef}
        />

        <div className={styles["feed"]}>
          {feed.length === 0 ? (
            <div className={styles["placeholder"]}>
              Make a selection, enter 1–20 or click Roll.
            </div>
          ) : (
            feed.map((item) => (
              <div className={styles["feedItem"]} key={item.id}>
                <div className={styles["itemHeader"]}>
                  <span
                    className={`${styles["chip"]} ${
                      item.action === "passage" ? styles["chipPassage"] : styles["chipDoor"]
                    }`}
                  >
                    {item.action}
                  </span>
                  <span className={styles["roll"]}>d20: {item.roll}</span>
                </div>
                <div className={styles["messages"]}>
                  {item.messages.map((m, i) => renderNode(m, i))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function renderNode(m: DungeonRenderable, key: number): JSX.Element {
  switch (m.kind) {
    case "heading":
      return (
        <p key={key} style={{ fontWeight: 700 }}>
          {m.text}
        </p>
      );
    case "bullet-list":
      return (
        <ul key={key} style={{ marginLeft: "1.25rem" }}>
          {m.items.map((it, idx) => (
            <li key={idx}>{it}</li>
          ))}
        </ul>
      );
    case "roll-trace":
      return (
        <div key={key} style={{ opacity: 0.9 }}>
          {renderTraceList(m)}
        </div>
      );
    case "paragraph":
    default:
      return (
        // @ts-expect-error TS narrows default to DungeonMessage with text
        <p key={key}>{m.text}</p>
      );
  }
}

function renderTraceList(trace: DungeonRollTrace) {
  const renderItem = (it: RollTraceItem, idx: number): JSX.Element => (
    <li key={idx}>
      <code>{it.table}</code>: roll {it.roll} → {it.result}
      {it.children && it.children.length > 0 && (
        <ul style={{ marginLeft: "1rem" }}>
          {it.children.map((c, i) => renderItem(c, i))}
        </ul>
      )}
    </li>
  );
  return (
    <div>
      <div style={{ fontStyle: "italic", marginTop: "0.25rem" }}>Roll trace</div>
      <ul style={{ marginLeft: "1.25rem" }}>
        {trace.items.map((it, idx) => renderItem(it, idx))}
      </ul>
    </div>
  );
}

export default DungeonIndexPage;

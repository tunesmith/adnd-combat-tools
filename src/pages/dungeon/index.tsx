import { FormEvent, useMemo, useRef, useState } from "react";
import styles from "./dungeon.module.css";
import { rollDice } from "../../dungeon/helpers/dungeonLookup";
import { runDungeonStep } from "../../dungeon/services/adapters";

type ActionKind = "passage" | "door";

type FeedItem = {
  id: string;
  action: ActionKind;
  roll: number;
  messages: { kind: "paragraph"; text: string }[];
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
                <div>
                  <strong>{item.action}</strong> — d20: {item.roll}
                </div>
                {item.messages.map((m, i) => (
                  <div key={i}>{m.text}</div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DungeonIndexPage;

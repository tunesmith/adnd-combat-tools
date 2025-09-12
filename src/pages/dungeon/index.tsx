import { FormEvent, useMemo, useRef, useState } from "react";
import styles from "./dungeon.module.css";
import { rollDice } from "../../dungeon/helpers/dungeonLookup";
import { runDungeonStep } from "../../dungeon/services/adapters";
import { DungeonMessage, DungeonRenderNode, DungeonRollTrace, RollTraceItem, DungeonTablePreview } from "../../types/dungeon";
import { passageWidthMessages } from "../../dungeon/services/passageWidth";
import { doorBeyondMessages } from "../../dungeon/services/doorBeyondResult";
import { roomMessages } from "../../dungeon/services/roomResult";
import { chamberMessages } from "../../dungeon/services/chamberResult";
import { passageMessages } from "../../dungeon/services/passage";
import { sidePassageMessages } from "../../dungeon/services/sidePassage";
import { passageTurnMessages } from "../../dungeon/services/passageTurn";
import { stairsMessages } from "../../dungeon/services/stairsResult";
import { specialPassageMessages } from "../../dungeon/services/specialPassage";
import {
  galleryStairLocationMessages,
  galleryStairOccurrenceMessages,
  streamConstructionMessages,
  riverConstructionMessages,
  riverBoatBankMessages,
  chasmDepthMessages,
  chasmConstructionMessages,
  jumpingPlaceWidthMessages,
} from "../../dungeon/services/specialPassage";
import { trickTrapMessages } from "../../dungeon/services/trickTrap";

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
  const [detailMode, setDetailMode] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<Record<string, number | undefined>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
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
    const step = runDungeonStep(act, {
      roll,
      detailMode,
      takeOverride: (tableId: string) => {
        const v = overrides[tableId];
        if (v === undefined) return undefined;
        // consume one-time
        setOverrides((prev) => ({ ...prev, [tableId]: undefined }));
        return v;
      },
    });
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
              type="submit"
              className={styles["button"]}
              disabled={!isValid}
            >
              Submit
            </button>

            <button
              type="button"
              className={styles["button"]}
              onClick={handleRoll}
              aria-label="Automatically roll a d20 and submit"
            >
              AutoRoll
            </button>

            <label style={{ marginLeft: "auto" }}>
              <input
                type="checkbox"
                checked={detailMode}
                onChange={(e) => setDetailMode(e.target.checked)}
              />
              Detail mode
            </label>
          </div>

          {rollInput.length > 0 && !isValid && (
            <div className={styles["errorText"]}>Enter an integer 1–20.</div>
          )}
        </form>

        {detailMode && (
          <div style={{ marginTop: "0.5rem" }}>
            {getRootPreviewNodes(action).map((n, i) =>
              renderNode(n, i, "root", overrides, setOverrides, setFeed, false)
            )}
          </div>
        )}

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
                  {!detailMode && (
                    <span className={styles["roll"]}>(roll: {item.roll})</span>
                  )}
                </div>
                <div className={styles["messages"]}>
                  {(detailMode ? filterForDetail(item.messages, item.action) : filterForCompact(item.messages, item.action)).map((m, i) =>
                    renderNode(m, i, item.id, overrides, setOverrides, setFeed, true, collapsed, setCollapsed, resolved, setResolved)
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function renderNode(
  m: DungeonRenderNode,
  key: number,
  feedItemId: string,
  overrides: Record<string, number | undefined>,
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, number | undefined>>>,
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>,
  enablePreviewControls: boolean = true,
  collapsed?: Record<string, boolean>,
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  resolved?: Record<string, boolean>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
): JSX.Element {
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
    case "table-preview": {
      const tp = m as DungeonTablePreview;
      const keyId = `${feedItemId}:${tp.id}`;
      const isCollapsed = !!(collapsed && collapsed[keyId]);
      const hasResolved = !!(resolved && resolved[keyId]);
      return (
        <div key={key} style={{ border: "1px dashed var(--copper)", padding: "0.5rem", margin: "0.5rem 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{tp.title} (d{tp.sides})</div>
            {setCollapsed && hasResolved && (
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [keyId]: !isCollapsed }))}
                title={isCollapsed ? "Expand table" : "Collapse table"}
                aria-label={isCollapsed ? "Expand table" : "Collapse table"}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--eggshell)",
                  fontSize: "18px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                {isCollapsed ? "▸" : "▾"}
              </button>
            )}
          </div>
          {!isCollapsed && (
            <div style={{ fontSize: "0.95em" }}>
              {tp.entries.map((e, i) => (
                <div key={i}>
                  <code style={{ opacity: 0.85 }}>{e.range}</code>: {e.label}
                </div>
              ))}
            </div>
          )}
          {!isCollapsed && enablePreviewControls && (
            <div style={{ marginTop: "0.5rem", display: "flex", gap: 8, alignItems: "center" }}>
              <label>
                Override next roll:
                <input
                  type="number"
                  min={1}
                  max={tp.sides}
                  value={overrides[tp.id] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : undefined;
                    setOverrides((prev) => ({ ...prev, [tp.id]: value }));
                  }}
                  className={styles["numberInput"]}
                  style={{ width: 80, marginLeft: 8 }}
                />
              </label>
              <button
                type="button"
                className={styles["button"]}
                onClick={() => resolvePreview(tp, feedItemId, overrides, setOverrides, setFeed, false, setCollapsed, setResolved)}
                style={{ padding: "6px 12px" }}
              >
                Submit
              </button>
              <button
                type="button"
                className={styles["button"]}
                onClick={() => resolvePreview(tp, feedItemId, overrides, setOverrides, setFeed, true, setCollapsed, setResolved)}
                style={{ padding: "6px 12px" }}
              >
                AutoRoll
              </button>
            </div>
          )}
        </div>
      );
    }
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

function resolvePreview(
  tp: DungeonTablePreview,
  feedItemId: string,
  overrides: Record<string, number | undefined>,
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, number | undefined>>>,
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>,
  shouldRoll: boolean,
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
) {
  let usedRoll: number | undefined = overrides[tp.id];
  if (shouldRoll || usedRoll === undefined) {
    // Simple auto-roll using existing dice util via specific resolvers where possible
    // For now, only passageWidth is supported here
    if (tp.id === "passageWidth") {
      usedRoll = undefined; // we will let passageWidthMessages roll if undefined
    }
  }

  // Consume override if present
  if (overrides[tp.id] !== undefined) {
    setOverrides((prev) => ({ ...prev, [tp.id]: undefined }));
  }

  const keyId = `${feedItemId}:${tp.id}`;

  if (tp.id === "passageWidth") {
    const width = passageWidthMessages({ roll: usedRoll, detailMode: true });
    setFeed((prev) =>
      prev.map((fi) => {
        if (fi.id !== feedItemId) return fi;
        const newMessages: DungeonRenderNode[] = [];
        let skippingOldResult = false;
        for (const node of fi.messages) {
          if (node.kind === "table-preview" && node.id === tp.id) {
            // Keep the preview visible as a record, then append the result below it
            newMessages.push(node);
            // Remove any prior resolved block for this table by skipping
            skippingOldResult = true;
            // Append the fresh resolved block
            newMessages.push({ kind: "heading", level: 4, text: "Passage Width" });
            newMessages.push({
              kind: "bullet-list",
              items: [`roll: ${width.usedRoll} — ${width.trace.result}`],
            });
            for (const m of width.messages) newMessages.push(m);
            // If width indicates SpecialPassage, stage a Special Passage preview
            if (width.trace.result === "SpecialPassage") {
              const preview = specialPassageMessages({ detailMode: true });
              for (const m of preview.messages) newMessages.push(m);
            }
          } else {
            if (skippingOldResult) {
              // Skip previously appended result nodes until the next preview or heading that isn't ours
              if (node.kind === "table-preview" && node.id !== tp.id) {
                skippingOldResult = false;
              } else if (node.kind === "heading" && node.text !== "Passage Width") {
                skippingOldResult = false;
              } else if (node.kind === "heading" && node.text === "Passage Width") {
                // keep skipping
              } else if (node.kind === "bullet-list" || node.kind === "paragraph") {
                // skip
              } else {
                // any other node type
                skippingOldResult = false;
              }
              if (!skippingOldResult) newMessages.push(node);
            } else {
              newMessages.push(node);
            }
          }
        }
        return { ...fi, messages: newMessages };
      })
    );
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [keyId]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [keyId]: true }));
  }
  if (tp.id === "specialPassage") {
    const resolved = specialPassageMessages({ roll: usedRoll, detailMode: true });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Special Passage")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "galleryStairLocation") {
    const resolved = galleryStairLocationMessages({ roll: usedRoll, detailMode: true });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Gallery Stair Location")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "galleryStairOccurrence") {
    const resolved = galleryStairOccurrenceMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Gallery Stair Occurrence")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "streamConstruction") {
    const resolved = streamConstructionMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Stream Construction")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "riverConstruction") {
    const resolved = riverConstructionMessages({ roll: usedRoll, detailMode: true });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "River Construction")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "riverBoatBank") {
    const resolved = riverBoatBankMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Boat Bank")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "chasmDepth") {
    const resolved = chasmDepthMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Chasm Depth")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "chasmConstruction") {
    const resolved = chasmConstructionMessages({ roll: usedRoll, detailMode: true });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Chasm Construction")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "jumpingPlaceWidth") {
    const resolved = jumpingPlaceWidthMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Jumping Place Width")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "doorBeyond") {
    const resolved = doorBeyondMessages({ roll: usedRoll, detailMode: true });
    setFeed((prev) =>
      prev.map((fi) => {
        if (fi.id !== feedItemId) return fi;
        const newMessages: DungeonRenderNode[] = [];
        let appended = false;
        for (const node of fi.messages) {
          newMessages.push(node);
          if (!appended && node.kind === "table-preview" && node.id === tp.id) {
            appended = true;
            // Append the door results, skipping duplicate heading if present
            let skipFirstHeading = true;
            for (const m of resolved.messages) {
              if (skipFirstHeading && m.kind === "heading") {
                skipFirstHeading = false;
                continue;
              }
              newMessages.push(m);
            }
          }
        }
        return { ...fi, messages: newMessages };
      })
    );
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [keyId]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [keyId]: true }));
  }
  if (tp.id === "roomDimensions") {
    const resolved = roomMessages({ roll: usedRoll });
    setFeed((prev) =>
      prev.map((fi) => {
        if (fi.id !== feedItemId) return fi;
        const newMessages: DungeonRenderNode[] = [];
        let skippingOld = false;
        for (const node of fi.messages) {
          if (node.kind === "table-preview" && node.id === tp.id) {
            newMessages.push(node);
            skippingOld = true; // replace prior resolved block
            for (const m of resolved.messages) newMessages.push(m);
          } else {
            if (skippingOld) {
              if (node.kind === "table-preview" && node.id !== tp.id) {
                skippingOld = false;
              } else if (node.kind === "heading" && node.text !== "Room Dimensions") {
                skippingOld = false;
              } else if (node.kind === "heading" && node.text === "Room Dimensions") {
                // keep skipping prior resolved block nodes until next unrelated section
              } else if (node.kind === "bullet-list" || node.kind === "paragraph") {
                // skip
              } else {
                skippingOld = false;
              }
              if (!skippingOld) newMessages.push(node);
            } else {
              newMessages.push(node);
            }
          }
        }
        return { ...fi, messages: newMessages };
      })
    );
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [keyId]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [keyId]: true }));
  }
  if (tp.id === "chamberDimensions") {
    const resolved = chamberMessages({ roll: usedRoll });
    setFeed((prev) =>
      prev.map((fi) => {
        if (fi.id !== feedItemId) return fi;
        const newMessages: DungeonRenderNode[] = [];
        let skippingOld = false;
        for (const node of fi.messages) {
          if (node.kind === "table-preview" && node.id === tp.id) {
            newMessages.push(node);
            skippingOld = true;
            for (const m of resolved.messages) newMessages.push(m);
          } else {
            if (skippingOld) {
              if (node.kind === "table-preview" && node.id !== tp.id) {
                skippingOld = false;
              } else if (node.kind === "heading" && node.text !== "Chamber Dimensions") {
                skippingOld = false;
              } else if (node.kind === "heading" && node.text === "Chamber Dimensions") {
                // keep skipping
              } else if (node.kind === "bullet-list" || node.kind === "paragraph") {
                // skip
              } else {
                skippingOld = false;
              }
              if (!skippingOld) newMessages.push(node);
            } else {
              newMessages.push(node);
            }
          }
        }
        return { ...fi, messages: newMessages };
      })
    );
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [keyId]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [keyId]: true }));
  }
  if (tp.id === "periodicCheck") {
    const resolved = passageMessages({ roll: usedRoll, detailMode: true });
    setFeed((prev) =>
      prev.map((fi) => {
        if (fi.id !== feedItemId) return fi;
        const newMessages: DungeonRenderNode[] = [];
        let appended = false;
        for (const node of fi.messages) {
          newMessages.push(node);
          if (!appended && node.kind === "table-preview" && node.id === tp.id) {
            appended = true;
            // Append the passage results, skipping duplicate heading if present
            let skipFirstHeading = true;
            for (const m of resolved.messages) {
              if (skipFirstHeading && m.kind === "heading") {
                skipFirstHeading = false;
                continue;
              }
              newMessages.push(m);
            }
          }
        }
        return { ...fi, messages: newMessages };
      })
    );
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [keyId]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [keyId]: true }));
  }
  if (tp.id === "numberOfExits") {
    // Use context for dimensions if provided
    const ctx = tp.context && tp.context.kind === 'exits' ? tp.context : undefined;
    if (!ctx) return;
    const { exitMessages } = require("../../dungeon/services/exitResult");
    const resolved = exitMessages({
      length: ctx.length,
      width: ctx.width,
      isRoom: ctx.isRoom,
      roll: usedRoll,
    });
    setFeed((prev) =>
      prev.map((fi) => {
        if (fi.id !== feedItemId) return fi;
        const newMessages: DungeonRenderNode[] = [];
        let skippingOld = false;
        for (const node of fi.messages) {
          if (node.kind === "table-preview" && node.id === tp.id) {
            newMessages.push(node);
            skippingOld = true;
            for (const m of resolved.messages) newMessages.push(m);
          } else {
            if (skippingOld) {
              if (node.kind === "table-preview" && node.id !== tp.id) {
                skippingOld = false;
              } else if (node.kind === "heading" && node.text !== "Exits") {
                skippingOld = false;
              } else if (node.kind === "heading" && node.text === "Exits") {
                // keep skipping
              } else if (node.kind === "bullet-list" || node.kind === "paragraph") {
                // skip
              } else {
                skippingOld = false;
              }
              if (!skippingOld) newMessages.push(node);
            } else {
              newMessages.push(node);
            }
          }
        }
        return { ...fi, messages: newMessages };
      })
    );
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [keyId]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [keyId]: true }));
  }
  if (tp.id === "sidePassages") {
    const resolved = sidePassageMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Side Passages")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "passageTurns") {
    const resolved = passageTurnMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Passage Turns")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "stairs") {
    const resolved = stairsMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Stairs")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
  if (tp.id === "trickTrap") {
    const resolved = trickTrapMessages({ roll: usedRoll });
    setFeed((prev) => prev.map((fi) => updateResolvedBlock(fi, feedItemId, tp.id, resolved.messages, "Trick / Trap")));
    if (setCollapsed) setCollapsed((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
    if (setResolved) setResolved((prev) => ({ ...prev, [`${feedItemId}:${tp.id}`]: true }));
  }
}

function updateResolvedBlock(
  fi: FeedItem,
  feedItemId: string,
  tableId: string,
  messages: DungeonRenderNode[],
  headingText: string
): FeedItem {
  if (fi.id !== feedItemId) return fi;
  const newMessages: DungeonRenderNode[] = [];
  let skippingOld = false;
  for (const node of fi.messages) {
    if (node.kind === "table-preview" && node.id === tableId) {
      newMessages.push(node);
      skippingOld = true;
      for (const m of messages) newMessages.push(m);
    } else {
      if (skippingOld) {
        if (node.kind === "table-preview" && node.id !== tableId) {
          skippingOld = false;
        } else if (node.kind === "heading" && node.text !== headingText) {
          skippingOld = false;
        } else if (node.kind === "heading" && node.text === headingText) {
          // keep skipping
        } else if (node.kind === "bullet-list" || node.kind === "paragraph") {
          // skip
        } else {
          skippingOld = false;
        }
        if (!skippingOld) newMessages.push(node);
      } else {
        newMessages.push(node);
      }
    }
  }
  return { ...fi, messages: newMessages };
}

function filterForCompact(
  nodes: DungeonRenderNode[],
  action: ActionKind
): DungeonRenderNode[] {
  const rootHeading = action === "passage" ? "Passage" : "Door";
  return nodes.filter((n) => {
    if (n.kind === "heading") {
      // Drop the redundant root heading; keep sub-headings
      return n.text !== rootHeading;
    }
    if (n.kind === "bullet-list") {
      // Drop pure roll bullets like "roll: 9 — Foo"
      const allRoll = n.items.every((it) => it.trim().toLowerCase().startsWith("roll:"));
      return !allRoll;
    }
    if (n.kind === "roll-trace") {
      // Hide debug traces in compact view
      return false;
    }
    return true;
  });
}

function filterForDetail(
  nodes: DungeonRenderNode[],
  action: ActionKind
): DungeonRenderNode[] {
  const rootHeading = action === "passage" ? "Passage" : "Door";
  let droppedRootHeading = false;
  const result: DungeonRenderNode[] = [];
  for (const n of nodes) {
    if (!droppedRootHeading && n.kind === "heading" && n.text === rootHeading) {
      droppedRootHeading = true;
      continue;
    }
    result.push(n);
  }
  return result;
}

function getRootPreviewNodes(action: ActionKind): DungeonRenderNode[] {
  // Render only the table preview node(s) for the selected action
  if (action === "door") {
    const { messages } = doorBeyondMessages({ detailMode: true });
    return messages.filter((m) => m.kind === "table-preview") as DungeonRenderNode[];
  }
  const { messages } = passageMessages({ detailMode: true });
  return messages.filter((m) => m.kind === "table-preview") as DungeonRenderNode[];
}

export default DungeonIndexPage;

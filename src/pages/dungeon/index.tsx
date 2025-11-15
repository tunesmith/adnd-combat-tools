import type { FormEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import styles from './dungeon.module.css';
import { rollDice } from '../../dungeon/helpers/dungeonLookup';
import { runDungeonStep } from '../../dungeon/services/adapters';
import type {
  DungeonRenderNode,
  DungeonRollTrace,
  RollTraceItem,
  DungeonTablePreview,
} from '../../types/dungeon';
import type { DungeonOutcomeNode } from '../../dungeon/domain/outcome';
import { doorBeyondMessages } from '../../dungeon/services/doorBeyondMessages';
import { passageMessages } from '../../dungeon/services/passageMessages';
import { resolveViaRegistry } from '../../dungeon/helpers/registry';
import {
  buildRenderCache,
  selectMessagesForMode,
} from '../../dungeon/helpers/renderCache';
import type { RenderCache } from '../../dungeon/helpers/renderCache';
import { countPendingNodes } from '../../dungeon/helpers/outcomeTree';
import { CharacterPartyDetail } from '../../components/dungeon/CharacterPartyDetail';
import { CharacterPartyCompact } from '../../components/dungeon/CharacterPartyCompact';
import { IounStonesDetail } from '../../components/dungeon/IounStonesDetail';
import { IounStonesCompact } from '../../components/dungeon/IounStonesCompact';
import { PrayerBeadsDetail } from '../../components/dungeon/PrayerBeadsDetail';
import { PrayerBeadsCompact } from '../../components/dungeon/PrayerBeadsCompact';
import { RobeOfUsefulItemsDetail } from '../../components/dungeon/RobeOfUsefulItemsDetail';
import { RobeOfUsefulItemsCompact } from '../../components/dungeon/RobeOfUsefulItemsCompact';

type ActionKind = 'passage' | 'door';

type FeedItem = {
  id: string;
  action: ActionKind;
  roll: number;
  outcome?: DungeonOutcomeNode;
  renderCache: RenderCache;
  messages: DungeonRenderNode[];
  pendingCount: number;
};

const DungeonIndexPage = () => {
  const [action, setAction] = useState<ActionKind>('passage');
  const [rollInput, setRollInput] = useState<string>('');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [detailMode, setDetailMode] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<
    Record<string, number | undefined>
  >({});
  const [dungeonLevel, setDungeonLevel] = useState<number>(1);
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
      level: dungeonLevel,
      takeOverride: (tableId: string) => {
        const v = overrides[tableId];
        if (v === undefined) return undefined;
        // consume one-time
        setOverrides((prev) => ({ ...prev, [tableId]: undefined }));
        return v;
      },
    });
    const renderCache = step.renderCache ?? buildRenderCache(step.outcome);
    const pendingCount = step.pendingCount ?? countPendingNodes(step.outcome);
    const messages = selectMessagesForMode(
      act,
      detailMode,
      renderCache,
      step.messages
    );
    const item: FeedItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: act,
      roll,
      outcome: step.outcome,
      renderCache,
      messages,
      pendingCount,
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
    <div className={styles['outerContainer']}>
      <div className={styles['title']}>AD&D Random Dungeon Generator</div>
      <div className={styles['contentContainer']}>
        <div className={styles['toolbar']}>
          <button
            type="button"
            className={styles['button']}
            onClick={() => setFeed([])}
          >
            Clear Feed
          </button>
        </div>
        <form className={styles['formContainer']} onSubmit={handleSubmit}>
          <div className={styles['controlsRow']}>
            <div className={styles['actionSelector']}>
              <label>
                <input
                  type="radio"
                  name="action"
                  value="passage"
                  checked={action === 'passage'}
                  onChange={() => setAction('passage')}
                />
                Passage
              </label>
              <label>
                <input
                  type="radio"
                  name="action"
                  value="door"
                  checked={action === 'door'}
                  onChange={() => setAction('door')}
                />
                Door
              </label>
            </div>

            <label>
              d20 Roll:
              <input
                className={styles['numberInput']}
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
              className={styles['button']}
              disabled={!isValid}
            >
              Submit
            </button>

            <button
              type="button"
              className={styles['button']}
              onClick={handleRoll}
              aria-label="Automatically roll a d20 and submit"
            >
              AutoRoll
            </button>

            <label style={{ marginLeft: 'auto' }}>
              <input
                type="checkbox"
                checked={detailMode}
                onChange={(e) => setDetailMode(e.target.checked)}
              />
              Detail mode
            </label>
            <label style={{ marginLeft: '1rem' }}>
              Dungeon level:
              <select
                className={styles['numberInput']}
                value={dungeonLevel}
                onChange={(e) => setDungeonLevel(Number(e.target.value) || 1)}
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {rollInput.length > 0 && !isValid && (
            <div className={styles['errorText']}>Enter an integer 1–20.</div>
          )}
        </form>

        {detailMode && (
          <div style={{ marginTop: '0.5rem' }}>
            {getRootPreviewNodes(action, dungeonLevel).map((n, i) =>
              renderNode(n, i, 'root', overrides, setOverrides, setFeed, false)
            )}
          </div>
        )}

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(1px, 1px, 1px, 1px)',
          }}
          ref={liveRegionRef}
        />

        <div className={styles['feed']}>
          {feed.length === 0 ? (
            <div className={styles['placeholder']}>
              Make a selection, enter 1–20 or click AutoRoll.
            </div>
          ) : (
            feed.map((item) => (
              <div className={styles['feedItem']} key={item.id}>
                <div className={styles['itemHeader']}>
                  <span
                    className={`${styles['chip']} ${
                      item.action === 'passage'
                        ? styles['chipPassage']
                        : styles['chipDoor']
                    }`}
                  >
                    {item.action}
                  </span>
                  {item.pendingCount > 0 && (
                    <span className={styles['pendingBadge']}>
                      {item.pendingCount} pending
                    </span>
                  )}
                  {!detailMode && (
                    <span className={styles['roll']}>(roll: {item.roll})</span>
                  )}
                </div>
                <div className={styles['messages']}>
                  {selectMessagesForMode(
                    item.action,
                    detailMode,
                    item.renderCache,
                    item.messages
                  ).map((m, i) =>
                    renderNode(
                      m,
                      i,
                      item.id,
                      overrides,
                      setOverrides,
                      setFeed,
                      true,
                      collapsed,
                      setCollapsed,
                      resolved,
                      setResolved
                    )
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
  setOverrides: React.Dispatch<
    React.SetStateAction<Record<string, number | undefined>>
  >,
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>,
  enablePreviewControls = true,
  collapsed?: Record<string, boolean>,
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  resolved?: Record<string, boolean>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
): JSX.Element {
  switch (m.kind) {
    case 'heading':
      return (
        <p key={key} style={{ fontWeight: 700 }}>
          {m.text}
        </p>
      );
    case 'bullet-list':
      return (
        <ul key={key} style={{ marginLeft: '1.25rem' }}>
          {m.items.map((it, idx) => (
            <li key={idx}>{it}</li>
          ))}
        </ul>
      );
    case 'character-party':
      return m.display === 'compact' ? (
        <CharacterPartyCompact key={key} summary={m.summary} />
      ) : (
        <CharacterPartyDetail key={key} summary={m.summary} />
      );
    case 'ioun-stones':
      return m.display === 'compact' ? (
        <IounStonesCompact key={key} summary={m.summary} />
      ) : (
        <IounStonesDetail key={key} summary={m.summary} />
      );
    case 'prayer-beads':
      return m.display === 'compact' ? (
        <PrayerBeadsCompact key={key} summary={m.summary} />
      ) : (
        <PrayerBeadsDetail key={key} summary={m.summary} />
      );
    case 'robe-of-useful-items':
      return m.display === 'compact' ? (
        <RobeOfUsefulItemsCompact key={key} summary={m.summary} />
      ) : (
        <RobeOfUsefulItemsDetail key={key} summary={m.summary} />
      );
    case 'table-preview': {
      const tp = m;
      const targetKey = tp.targetId ?? tp.id;
      const keyId = `${feedItemId}:${targetKey}`;
      const defaultCollapsed = tp.autoCollapse === true;
      const collapsedState = collapsed ? collapsed[keyId] : undefined;
      const isCollapsed =
        collapsedState !== undefined ? collapsedState : defaultCollapsed;
      const hasResolved = !!(resolved && resolved[keyId]) || defaultCollapsed;
      return (
        <div
          key={key}
          style={{
            border: '1px dashed var(--copper)',
            padding: '0.5rem',
            margin: '0.5rem 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>
              {tp.title} (d{tp.sides})
            </div>
            {setCollapsed && hasResolved && (
              <button
                type="button"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [keyId]: !isCollapsed }))
                }
                title={isCollapsed ? 'Expand table' : 'Collapse table'}
                aria-label={isCollapsed ? 'Expand table' : 'Collapse table'}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--eggshell)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                {isCollapsed ? '▸' : '▾'}
              </button>
            )}
          </div>
          {!isCollapsed && (
            <div style={{ fontSize: '0.95em' }}>
              {tp.entries.map((e, i) => (
                <div key={i}>
                  <code style={{ opacity: 0.85 }}>{e.range}</code>: {e.label}
                </div>
              ))}
            </div>
          )}
          {!isCollapsed && enablePreviewControls && (
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <label>
                Override next roll:
                <input
                  type="number"
                  min={1}
                  max={tp.sides}
                  value={overrides[targetKey] ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                      ? Number(e.target.value)
                      : undefined;
                    setOverrides((prev) => ({ ...prev, [targetKey]: value }));
                  }}
                  className={styles['numberInput']}
                  style={{ width: 80, marginLeft: 8 }}
                />
              </label>
              <button
                type="button"
                className={styles['button']}
                onClick={() =>
                  resolvePreview(
                    tp,
                    feedItemId,
                    overrides,
                    setOverrides,
                    setFeed,
                    false,
                    setCollapsed,
                    setResolved
                  )
                }
                style={{ padding: '6px 12px' }}
              >
                Submit
              </button>
              <button
                type="button"
                className={styles['button']}
                onClick={() =>
                  resolvePreview(
                    tp,
                    feedItemId,
                    overrides,
                    setOverrides,
                    setFeed,
                    true,
                    setCollapsed,
                    setResolved
                  )
                }
                style={{ padding: '6px 12px' }}
              >
                AutoRoll
              </button>
            </div>
          )}
        </div>
      );
    }
    case 'roll-trace':
      return (
        <div key={key} style={{ opacity: 0.9 }}>
          {renderTraceList(m)}
        </div>
      );
    case 'paragraph':
    default:
      return <p key={key}>{m.text}</p>;
  }
}

function renderTraceList(trace: DungeonRollTrace) {
  const renderItem = (it: RollTraceItem, idx: number): JSX.Element => (
    <li key={idx}>
      <code>{it.table}</code>: roll {it.roll} → {it.result}
      {it.children && it.children.length > 0 && (
        <ul style={{ marginLeft: '1rem' }}>
          {it.children.map((c, i) => renderItem(c, i))}
        </ul>
      )}
    </li>
  );
  return (
    <div>
      <div style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>
        Roll trace
      </div>
      <ul style={{ marginLeft: '1.25rem' }}>
        {trace.items.map((it, idx) => renderItem(it, idx))}
      </ul>
    </div>
  );
}

function resolvePreview(
  tp: DungeonTablePreview,
  feedItemId: string,
  overrides: Record<string, number | undefined>,
  setOverrides: React.Dispatch<
    React.SetStateAction<Record<string, number | undefined>>
  >,
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>,
  shouldRoll: boolean,
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
) {
  const targetKey = tp.targetId ?? tp.id;
  let usedRoll: number | undefined = overrides[targetKey];
  // If the user clicked Submit without an override, do nothing.
  if (!shouldRoll && usedRoll === undefined) return;
  // For AutoRoll, generate a roll if we don't already have one.
  if (shouldRoll && usedRoll === undefined) usedRoll = rollDice(tp.sides);

  // Consume override if present
  if (overrides[targetKey] !== undefined) {
    setOverrides((prev) => ({ ...prev, [targetKey]: undefined }));
  }

  // Try the generic registry first; if handled, stop here
  if (
    resolveViaRegistry(
      tp,
      feedItemId,
      usedRoll,
      setFeed,
      setCollapsed,
      setResolved
    )
  )
    return;
}

function getRootPreviewNodes(
  action: ActionKind,
  dungeonLevel: number
): DungeonRenderNode[] {
  // Render only the table preview node(s) for the selected action
  if (action === 'door') {
    const { messages } = doorBeyondMessages({ detailMode: true });
    return messages.filter((m) => m.kind === 'table-preview');
  }
  const { messages } = passageMessages({
    detailMode: true,
    level: dungeonLevel,
  });
  return messages.filter((m) => m.kind === 'table-preview');
}

export { renderNode };

export default DungeonIndexPage;

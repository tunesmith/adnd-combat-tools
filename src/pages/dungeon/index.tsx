import type { Dispatch, FormEvent, SetStateAction } from 'react';
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
import { DungeonTablePreviewCard } from '../../components/dungeon/DungeonTablePreviewCard';

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
  const [showReferenceTables, setShowReferenceTables] =
    useState<boolean>(false);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  const parsedRoll = useMemo(() => {
    const n = Number(rollInput);
    if (!Number.isInteger(n)) return undefined;
    return n;
  }, [rollInput]);

  const isValid = useMemo(() => {
    return parsedRoll !== undefined && parsedRoll >= 1 && parsedRoll <= 20;
  }, [parsedRoll]);

  const rootPreviewNodes = useMemo(
    () => getRootPreviewNodes(action, dungeonLevel),
    [action, dungeonLevel]
  );

  const referenceTitle =
    action === 'door' ? 'Door starting table' : 'Passage starting table';

  const addToFeed = (act: ActionKind, roll: number) => {
    const step = runDungeonStep(act, {
      roll,
      detailMode,
      level: dungeonLevel,
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
          <div className={styles['controlSections']}>
            <section className={styles['controlSection']}>
              <div className={styles['controlSectionHeader']}>
                <div className={styles['controlSectionTitle']}>Generate</div>
                <div className={styles['controlSectionHint']}>
                  Choose the starting trigger, then roll or auto-roll it.
                </div>
              </div>
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
              </div>
            </section>

            <section className={styles['controlSection']}>
              <div className={styles['controlSectionHeader']}>
                <div className={styles['controlSectionTitle']}>
                  View and Context
                </div>
                <div className={styles['controlSectionHint']}>
                  Detail mode exposes pending subtables and manual overrides.
                </div>
              </div>
              <div className={styles['controlsRow']}>
                <label className={styles['checkboxLabel']}>
                  <input
                    type="checkbox"
                    checked={detailMode}
                    onChange={(e) => setDetailMode(e.target.checked)}
                  />
                  Detail mode
                </label>
                <label>
                  Dungeon level:
                  <select
                    className={styles['numberInput']}
                    value={dungeonLevel}
                    onChange={(e) =>
                      setDungeonLevel(Number(e.target.value) || 1)
                    }
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          </div>

          {rollInput.length > 0 && !isValid && (
            <div className={styles['errorText']}>Enter an integer 1–20.</div>
          )}
        </form>

        {detailMode && (
          <section className={styles['referencePanel']}>
            <div className={styles['referenceHeader']}>
              <div>
                <div className={styles['referenceEyebrow']}>
                  Lookup reference
                </div>
                <div className={styles['referenceTitle']}>{referenceTitle}</div>
                <div className={styles['referenceText']}>
                  Keep the feed below as the main workflow. Open this when you
                  want to inspect the top-level odds.
                </div>
              </div>
              <button
                type="button"
                className={styles['button']}
                onClick={() => setShowReferenceTables((prev) => !prev)}
                aria-expanded={showReferenceTables}
                aria-controls="dungeon-reference-body"
              >
                {showReferenceTables ? 'Hide reference' : 'Show reference'}
              </button>
            </div>
            {showReferenceTables && (
              <div
                className={styles['referenceBody']}
                id="dungeon-reference-body"
              >
                {rootPreviewNodes.map((n, i) =>
                  renderNode(
                    n,
                    i,
                    'root',
                    overrides,
                    setOverrides,
                    setFeed,
                    false
                  )
                )}
              </div>
            )}
          </section>
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
                      {formatPendingBadge(item.pendingCount)}
                    </span>
                  )}
                  {!detailMode && (
                    <span className={styles['roll']}>(roll: {item.roll})</span>
                  )}
                </div>
                {!detailMode && item.pendingCount > 0 && (
                  <div className={styles['compactPendingNotice']}>
                    <div className={styles['compactPendingCopy']}>
                      <div className={styles['compactPendingTitle']}>
                        {formatPendingTitle(item.pendingCount)}
                      </div>
                      <div className={styles['compactPendingText']}>
                        This result is partial. Switch to detail mode to resolve
                        the remaining subtables and rerolls.
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['compactPendingButton']}`}
                      onClick={() => setDetailMode(true)}
                    >
                      Open detail mode
                    </button>
                  </div>
                )}
                <div className={styles['messages']}>
                  {(() => {
                    const pendingTargetIds = collectPendingTargetIds(
                      item.outcome
                    );
                    return selectMessagesForMode(
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
                        setResolved,
                        pendingTargetIds
                      )
                    );
                  })()}
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
  setOverrides: Dispatch<SetStateAction<Record<string, number | undefined>>>,
  setFeed: Dispatch<SetStateAction<FeedItem[]>>,
  enablePreviewControls = true,
  collapsed?: Record<string, boolean>,
  setCollapsed?: Dispatch<SetStateAction<Record<string, boolean>>>,
  resolved?: Record<string, boolean>,
  setResolved?: Dispatch<SetStateAction<Record<string, boolean>>>,
  pendingTargetIds?: ReadonlySet<string>
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
      const isPending = pendingTargetIds?.has(targetKey) ?? false;
      const defaultCollapsed =
        tp.autoCollapse === true || (enablePreviewControls && !isPending);
      const collapsedState = collapsed ? collapsed[keyId] : undefined;
      const isCollapsed =
        collapsedState !== undefined ? collapsedState : defaultCollapsed;
      const hasResolved =
        !!(resolved && resolved[keyId]) || defaultCollapsed || !isPending;
      return (
        <DungeonTablePreviewCard
          key={key}
          preview={tp}
          enablePreviewControls={enablePreviewControls}
          overrideValue={overrides[targetKey]}
          onOverrideChange={(value) =>
            setOverrides((prev) => ({ ...prev, [targetKey]: value }))
          }
          onUseOverride={() =>
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
          onAutoRoll={() =>
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
          isCollapsed={isCollapsed}
          hasResolved={hasResolved}
          onToggleCollapse={
            setCollapsed && hasResolved
              ? () =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [keyId]: !isCollapsed,
                  }))
              : undefined
          }
        />
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
  setOverrides: Dispatch<SetStateAction<Record<string, number | undefined>>>,
  setFeed: Dispatch<SetStateAction<FeedItem[]>>,
  shouldRoll: boolean,
  setCollapsed?: Dispatch<SetStateAction<Record<string, boolean>>>,
  setResolved?: Dispatch<SetStateAction<Record<string, boolean>>>
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

function formatPendingBadge(pendingCount: number): string {
  return `${pendingCount} pending ${pendingCount === 1 ? 'step' : 'steps'}`;
}

function formatPendingTitle(pendingCount: number): string {
  return `${pendingCount} ${
    pendingCount === 1 ? 'step is' : 'steps are'
  } still pending.`;
}

function collectPendingTargetIds(
  node?: DungeonOutcomeNode
): ReadonlySet<string> {
  const targets = new Set<string>();

  const walk = (current?: DungeonOutcomeNode) => {
    if (!current) return;
    if (current.type === 'pending-roll') {
      targets.add(current.id ?? current.table);
      return;
    }
    current.children?.forEach((child) => walk(child));
  };

  walk(node);
  return targets;
}

export { renderNode };

export default DungeonIndexPage;

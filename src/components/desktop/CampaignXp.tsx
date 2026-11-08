import XpTimeline from './XpTimeline';
import XpAwardTable from './XpAwardTable';
import XpAwardEdit from './XpAwardEdit';
import { compareXpAwards } from '../../helpers/campaignXpTimeline';
import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type {
  XpEvent,
  XpPoint,
  XpReward,
  CampaignXp as Ledger,
  XpBonusReview,
} from '../../helpers/campaignXpModel';
import { newXpReward } from '../../helpers/campaignXpSources';
import {
  activeXpEvents,
  beginXpCorrection,
  discardXpPoint,
  deleteXpReward,
  confirmXpAward,
  newXpPoint,
  pointRewards,
  previewXpAward,
  rewardSettlement,
  saveXpOpening,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
  sessionXpBalances,
  xpLedger,
  xpSessionOrder,
} from '../../helpers/campaignXp';
import type { XpAwardPreview } from '../../helpers/campaignXp';
import { xpDisplay } from '../../helpers/xpArithmetic';
import XpRewardEditor, { XpRewardCalculation } from './XpRewardEditor';
import styles from './xpWorkspace.module.css';
const uid = () => crypto.randomUUID();
const balance = (value: number | null) =>
  value === null ? 'Unknown' : value.toLocaleString();
type InspectAllocation = (
  name: string,
  calculated: string,
  accepted: string,
  reason: string
) => void;
function AwardDetails({
  document,
  event,
  onOpen,
  onInspectAllocation,
}: {
  document: CampaignDocument;
  event: XpEvent;
  onOpen: (reward: XpReward) => void;
  onInspectAllocation: InspectAllocation;
}) {
  return (
    <div className={styles['historyDetail']}>
      <p>Confirmed {new Date(event.confirmedAt).toLocaleString()}</p>
      {event.reason && <p>{event.reason}</p>}
      <XpAwardTable
        document={document}
        point={event.point}
        rewards={event.rewards}
        rows={event.rows}
        readOnly
        onOpen={onOpen}
        onInspectAllocation={onInspectAllocation}
      />
    </div>
  );
}
function OpeningBalances({
  document,
  sessionId,
  onChange,
  onClose,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<Ledger['openings']>(() =>
    (document.party?.roster || []).map(
      (c) =>
        xpLedger(document).openings.find((o) => o.characterId === c.id) || {
          id: uid(),
          characterId: c.id,
          sessionId: xpSessionOrder(document)[0] || sessionId,
          balance: null,
          reason: '',
        }
    )
  );
  const [error, setError] = useState('');
  const locked = (id: string) =>
    xpLedger(document).events.some((e) =>
      e.rows.some((r) => r.characterId === id)
    );
  return (
    <div className={styles['backdrop']}>
      <section
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-label="Opening XP"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2>Opening XP</h2>
        <p>
          Establish balances before the selected starting session. Blank remains
          unknown.
        </p>
        <button
          onClick={() =>
            setEntries(
              entries.map((entry) =>
                locked(entry.characterId) ? entry : { ...entry, balance: 0 }
              )
            )
          }
        >
          Set listed unlocked balances to 0
        </button>
        <div className={styles['tableScroll']}>
          <table>
            <thead>
              <tr>
                <th>Character</th>
                <th>Before session</th>
                <th>Opening XP</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const name =
                  document.party?.roster.find((c) => c.id === entry.characterId)
                    ?.name || entry.characterId;
                const update = (change: Partial<typeof entry>) =>
                  setEntries(
                    entries.map((o, i) =>
                      i === index ? { ...o, ...change } : o
                    )
                  );
                return (
                  <tr key={entry.characterId}>
                    <th>{name}</th>
                    <td>
                      <select
                        aria-label={`${name} starting session`}
                        disabled={locked(entry.characterId)}
                        value={entry.sessionId}
                        onChange={(e) => update({ sessionId: e.target.value })}
                      >
                        {xpSessionOrder(document).map((id) => (
                          <option key={id} value={id}>
                            {document.sessions.find((s) => s.id === id)?.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        aria-label={`${name} opening XP`}
                        type="number"
                        min={0}
                        disabled={locked(entry.characterId)}
                        placeholder="Unknown"
                        value={entry.balance ?? ''}
                        onChange={(e) =>
                          update({
                            balance:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`${name} opening note`}
                        disabled={locked(entry.characterId)}
                        value={entry.reason}
                        onChange={(e) => update({ reason: e.target.value })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          <button onClick={onClose}>Cancel</button>
          <button
            className={styles['primary']}
            onClick={() => {
              try {
                if (
                  onChange((doc) =>
                    entries
                      .filter((e) => !locked(e.characterId))
                      .reduce((next, e) => saveXpOpening(next, e), doc)
                  )
                )
                  onClose();
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            Save opening balances
          </button>
        </div>
      </section>
    </div>
  );
}
export default function CampaignXp({
  document,
  sessionId,
  onChange,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
}) {
  const xp = xpLedger(document);
  const points = xp.points
    .filter((p) => p.position.sessionId === sessionId)
    .sort((a, b) => compareXpAwards(document, a, b));
  const [selected, setSelected] = useState<string>(
    points.find((p) => !p.confirmedEventId)?.id || points[0]?.id || ''
  );
  const point = points.find((p) => p.id === selected);
  const [editor, setEditor] = useState<{
    reward: XpReward;
    pointId?: string;
  }>();
  const [openings, setOpenings] = useState(false),
    [error, setError] = useState('');
  const [preview, setPreview] = useState<XpAwardPreview>();
  const [reviewLater, setReviewLater] = useState(false);
  const operation = useRef<{ fingerprint: string; id: string; at: string }>();
  const [historyId, setHistoryId] = useState('');
  const [inspectedEvent, setInspectedEvent] = useState<XpReward>();
  const [renamePointId, setRenamePointId] = useState('');
  const [awardEdit, setAwardEdit] = useState<{
    review: XpBonusReview;
    mode: 'bonus' | 'final';
  }>();
  const [allocation, setAllocation] = useState<{
    name: string;
    calculated: string;
    accepted: string;
    reason: string;
  }>();
  const inspectAllocation: InspectAllocation = (
    name,
    calculated,
    accepted,
    reason
  ) => setAllocation({ name, calculated, accepted, reason });
  const active = activeXpEvents(xp.events);
  const selectedEvent = point?.confirmedEventId
    ? xp.events.reduce<XpEvent | undefined>(
        (found, event) =>
          event.id === point.confirmedEventId ||
          (found && event.replaces === found.id)
            ? event
            : found,
        undefined
      )
    : undefined;
  const history = xp.events.find((e) => e.id === historyId);
  function changePoint(change: Partial<XpPoint>) {
    if (!point) return false;
    const next = { ...point, ...change };
    setPreview(undefined);
    setError('');
    return onChange((doc) => saveXpPoint(doc, next));
  }
  function review() {
    try {
      if (!point) return;
      const result = previewXpAward(document, point.id);
      setPreview(result);
      setReviewLater(false);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  function confirm() {
    if (!preview) return;
    if (operation.current?.fingerprint !== preview.fingerprint)
      operation.current = {
        fingerprint: preview.fingerprint,
        id: uid(),
        at: new Date().toISOString(),
      };
    const request = operation.current;
    try {
      if (
        onChange((doc) =>
          confirmXpAward(
            doc,
            preview.point.id,
            preview.fingerprint,
            request.id,
            request.at,
            reviewLater
          )
        )
      ) {
        setPreview(undefined);
        setError('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  function addPoint() {
    const id = uid();
    if (onChange((doc) => saveXpPoint(doc, newXpPoint(doc, sessionId, id)))) {
      setSelected(id);
      setHistoryId('');
      setRenamePointId(id);
      setPreview(undefined);
      setError('');
    }
  }
  function correct(event: XpEvent) {
    const id = uid();
    if (onChange((doc) => beginXpCorrection(doc, event.id, id))) {
      setSelected(id);
      setPreview(undefined);
      setHistoryId('');
      setError('');
    }
  }
  const pending = xp.rewards.filter((r) => !rewardSettlement(document, r.id));
  const selectedRewards = point ? pointRewards(document, point) : [];
  const rewards = point?.confirmedEventId
    ? pending
    : [
        ...pending,
        ...selectedRewards.filter((r) => !pending.some((p) => p.id === r.id)),
      ];
  return (
    <div className={styles['workspace']}>
      <div className={styles['heading']}>
        <h2>XP</h2>
        <div className={styles['actions']}>
          <button
            onClick={() => setOpenings(true)}
            disabled={!document.party?.roster.length}
          >
            Opening balances
          </button>
          <button
            disabled={!sessionId}
            onClick={() =>
              setEditor({
                reward: newXpReward(document, sessionId, uid(), 'monster'),
              })
            }
          >
            + XP Event
          </button>
          <button disabled={!sessionId} onClick={addPoint}>
            + Award point
          </button>
        </div>
      </div>
      {!document.party?.roster.length && (
        <p>
          Add campaign characters on Session to establish XP balances and
          recipients.
        </p>
      )}
      <XpTimeline
        document={document}
        sessionId={sessionId}
        selectedPointId={selected}
        onChange={(change) => {
          setPreview(undefined);
          return onChange(change);
        }}
        renamePointId={renamePointId}
        onRenameEnd={() => setRenamePointId('')}
        onRenamePoint={(id, label) => {
          setPreview(undefined);
          try {
            return onChange((doc) => {
              const existing = xpLedger(doc).points.find((p) => p.id === id);
              if (!existing) throw Error('Award no longer exists.');
              return saveXpPoint(doc, { ...existing, label });
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            return false;
          }
        }}
        onSelectPoint={(id) => {
          setHistoryId('');
          setAwardEdit(undefined);
          setSelected(id);
          setInspectedEvent(undefined);
          setPreview(undefined);
          setError('');
        }}
        onSelectEvent={(reward) => {
          if (
            xp.events.some((e) => e.rewards.some((r) => r.id === reward.id))
          ) {
            setInspectedEvent(reward);
            setSelected('');
          } else setEditor({ reward });
        }}
      />
      {selectedEvent && (
        <section>
          <AwardDetails
            document={document}
            event={selectedEvent}
            onOpen={setInspectedEvent}
            onInspectAllocation={inspectAllocation}
          />
          <button onClick={() => correct(selectedEvent)}>Correct award…</button>
        </section>
      )}
      {point && !point.confirmedEventId && (
        <section
          aria-label={preview ? 'Confirm XP award' : 'Award draft'}
          className={preview ? styles['preview'] : undefined}
        >
          {point.correctionOf && (
            <label>
              Correction reason
              <input
                value={point.correctionReason}
                onChange={(e) =>
                  changePoint({ correctionReason: e.target.value })
                }
              />
            </label>
          )}
          <XpAwardTable
            document={document}
            point={point}
            rewards={rewards.map(
              (r) => point.rewardOverrides.find((o) => o.id === r.id) || r
            )}
            rows={preview?.rows}
            onSelect={(id, include) => {
              setPreview(undefined);
              onChange((doc) =>
                selectXpRewards(
                  doc,
                  point.id,
                  include
                    ? [...point.rewardIds, id]
                    : point.rewardIds.filter((r) => r !== id)
                )
              );
            }}
            onOpen={(reward) => {
              const accepted = xp.events.some((e) =>
                e.rewards.some((r) => r.id === reward.id)
              );
              if (
                accepted &&
                !(point.correctionOf && point.rewardIds.includes(reward.id))
              )
                setInspectedEvent(reward);
              else
                setEditor({
                  reward,
                  pointId: point.correctionOf ? point.id : undefined,
                });
            }}
            onBonus={(review) => setAwardEdit({ review, mode: 'bonus' })}
            onFinal={(review) => setAwardEdit({ review, mode: 'final' })}
            onInspectAllocation={inspectAllocation}
          />
          {preview?.later.length ? (
            <div className={styles['warning']}>
              <h4>Later balances to review</h4>
              {preview.later.map(({ event, rows }) => (
                <p key={event.id}>
                  <strong>{event.point.label}</strong>:{' '}
                  {rows
                    .map((r) => `${r.name}: ${r.before} → ${r.after}`)
                    .join(' · ')}
                </p>
              ))}
              <label className={styles['check']}>
                <input
                  type="checkbox"
                  checked={reviewLater}
                  onChange={(e) => setReviewLater(e.target.checked)}
                />
                I reviewed the recalculated later balances
              </label>
            </div>
          ) : null}
          <div className={styles['actions']}>
            {preview ? (
              <button
                className={styles['primary']}
                disabled={preview.later.length > 0 && !reviewLater}
                onClick={confirm}
              >
                {preview.point.correctionOf
                  ? 'Confirm correction'
                  : 'Confirm award'}
              </button>
            ) : (
              <button className={styles['primary']} onClick={review}>
                Preview award
              </button>
            )}
            <button
              onClick={() => {
                if (onChange((doc) => discardXpPoint(doc, point.id))) {
                  setSelected('');
                  setPreview(undefined);
                }
              }}
            >
              Discard award draft
            </button>
          </div>
        </section>
      )}
      {error && (
        <p role="alert" className={styles['warning']}>
          {error}
        </p>
      )}
      <details className={styles['history']}>
        <summary>Award history · {xp.events.length} recorded versions</summary>
        {xp.events.map((event) => (
          <div key={event.id} className={styles['historyRow']}>
            <button
              onClick={() =>
                setHistoryId(historyId === event.id ? '' : event.id)
              }
            >
              {event.point.label}
            </button>
            <span>
              {
                document.sessions.find(
                  (s) => s.id === event.point.position.sessionId
                )?.label
              }{' '}
              ·{' '}
              {active.some((e) => e.id === event.id)
                ? 'Current accepted version'
                : 'Superseded; retained'}
            </span>
            {event.replaces && (
              <small>
                Replaces{' '}
                {xp.events.find((e) => e.id === event.replaces)?.point.label}
              </small>
            )}
          </div>
        ))}
        {history && (
          <>
            <AwardDetails
              document={document}
              event={history}
              onOpen={setInspectedEvent}
              onInspectAllocation={inspectAllocation}
            />
            {active.some((e) => e.id === history.id) && (
              <button onClick={() => correct(history)}>Correct award…</button>
            )}
          </>
        )}
      </details>
      <details>
        <summary>Historical session balances</summary>
        <table>
          <thead>
            <tr>
              <th>Character</th>
              <th>Opening</th>
              <th>Closing / current</th>
            </tr>
          </thead>
          <tbody>
            {document.party?.roster.map((c) => {
              const b = sessionXpBalances(document, c.id, sessionId);
              return (
                <tr key={c.id}>
                  <th>{c.name}</th>
                  <td>{balance(b.opening)}</td>
                  <td>{balance(b.closing)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
      {awardEdit && (
        <XpAwardEdit
          review={awardEdit.review}
          mode={awardEdit.mode}
          onClose={() => setAwardEdit(undefined)}
          onSave={(updated) =>
            changePoint({
              bonuses:
                point?.bonuses.map((b) =>
                  b.characterId === updated.characterId ? updated : b
                ) || [],
            })
          }
        />
      )}
      {allocation && (
        <div
          className={styles['backdrop']}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAllocation(undefined);
          }}
        >
          <section
            className={`${styles['modal']} ${styles['smallModal']}`}
            role="dialog"
            aria-modal="true"
            aria-label="XP allocation detail"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setAllocation(undefined);
            }}
          >
            <h2>{allocation.name}</h2>
            <p>Calculated: {xpDisplay(allocation.calculated)}</p>
            <p>Adjusted: {xpDisplay(allocation.accepted)}</p>
            <p>{allocation.reason}</p>
            <button autoFocus onClick={() => setAllocation(undefined)}>
              Close
            </button>
          </section>
        </div>
      )}
      {inspectedEvent && (
        <div
          className={styles['backdrop']}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setInspectedEvent(undefined);
          }}
        >
          <section
            className={styles['modal']}
            role="dialog"
            aria-modal="true"
            aria-label="Historical XP event"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setInspectedEvent(undefined);
            }}
          >
            <h2>{inspectedEvent.title}</h2>
            <p>{inspectedEvent.evidence.label}</p>
            {inspectedEvent.notes && <p>{inspectedEvent.notes}</p>}
            <XpRewardCalculation reward={inspectedEvent} />
            <button autoFocus onClick={() => setInspectedEvent(undefined)}>
              Close
            </button>
          </section>
        </div>
      )}
      {openings && (
        <OpeningBalances
          document={document}
          sessionId={sessionId}
          onChange={onChange}
          onClose={() => setOpenings(false)}
        />
      )}
      {editor && (
        <XpRewardEditor
          key={`${editor.reward.id}:${editor.pointId || ''}`}
          document={document}
          reward={editor.reward}
          onClose={() => setEditor(undefined)}
          onDelete={
            !editor.pointId &&
            xp.rewards.some((r) => r.id === editor.reward.id) &&
            !xp.events.some((e) =>
              e.rewards.some((r) => r.id === editor.reward.id)
            )
              ? () => {
                  setPreview(undefined);
                  return onChange((doc) =>
                    deleteXpReward(doc, editor.reward.id, editor.reward.version)
                  );
                }
              : undefined
          }
          onSave={(reward) => {
            const pointId = editor.pointId;
            const existing = pointId
              ? xp.points
                  .find((p) => p.id === pointId)
                  ?.rewardOverrides.find((r) => r.id === reward.id)
              : xp.rewards.find((r) => r.id === reward.id);
            const next = {
              ...reward,
              version: existing ? existing.version + 1 : reward.version,
            };
            setPreview(undefined);
            return onChange((doc) => {
              const changed = saveXpReward(doc, next, pointId);
              const p = pointId
                ? xpLedger(changed).points.find((p) => p.id === pointId)
                : point;
              return p && !p.confirmedEventId && p.rewardIds.includes(reward.id)
                ? selectXpRewards(changed, p.id, p.rewardIds)
                : changed;
            });
          }}
        />
      )}
    </div>
  );
}

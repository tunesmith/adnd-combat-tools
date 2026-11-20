import { TreasureReview } from './XpTreasureRows';
import { treasurePending } from '../../helpers/campaignXpTreasure';
import { profileClassReviews } from '../../helpers/campaignXpClasses';
import ClassXpBalancesFields from './ClassXpBalancesFields';
import XpClassAwardEdit from './XpClassAwardEdit';
import {
  pendingXpReward,
  inPartyOrder,
  eligibleSessionProfiles,
} from '../../helpers/campaignParty';
import XpHistoryExtension from './XpHistoryExtension';
import XpTimeline from './XpTimeline';
import XpAwardDialog from './XpAwardDialog';
import XpCapDialog from './XpCapDialog';
import XpAwardTable from './XpAwardTable';
import XpAwardEdit from './XpAwardEdit';
import { compareXpAwards, xpAwardRoot } from '../../helpers/campaignXpTimeline';
import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type {
  XpEvent,
  XpPoint,
  XpReward,
  CampaignXp as Ledger,
  XpBonusReview,
  XpCapBasis,
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
  hasPendingXpShares,
  saveXpOpening,
  saveXpPoint,
  saveXpReward,
  sessionXpBalances,
  xpLedger,
  xpSessionOrder,
  stageXpAward,
  withXpDisposition,
  withXpRewardSelection,
  xpOpeningLocked,
  xpBalance,
  xpClassBalances,
  historicalXpPoint,
  xpRewardFitsAward,
} from '../../helpers/campaignXp';
import type {
  XpAwardPreview,
  XpTreasureDisposition,
} from '../../helpers/campaignXp';
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
  onCap,
}: {
  document: CampaignDocument;
  event: XpEvent;
  onOpen: (reward: XpReward) => void;
  onInspectAllocation: InspectAllocation;
  onCap: (id: string, basis?: XpCapBasis) => void;
}) {
  return (
    <div className={styles['historyDetail']}>
      <p>Confirmed {new Date(event.confirmedAt).toLocaleString()}</p>
      {event.reason && <p>{event.reason}</p>}
      <XpAwardTable
        document={document}
        point={event.point}
        confirmedEventId={event.id}
        rewards={event.rewards}
        rows={event.rows}
        readOnly
        onOpen={onOpen}
        onInspectAllocation={onInspectAllocation}
        onCap={onCap}
      />
    </div>
  );
}
const XpAwardEditor = (
  props: React.ComponentProps<typeof XpAwardEdit> & {
    mappingBalance?: number | null;
  }
) =>
  props.review.classes ? (
    <XpClassAwardEdit
      review={props.review}
      mappingBalance={props.mappingBalance}
      onSave={props.onSave}
      onClose={props.onClose}
    />
  ) : (
    <XpAwardEdit {...props} />
  );
function OpeningBalances({
  document,
  sessionId,
  onChange,
  onClose,
  onExtend,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
  onClose: () => void;
  onExtend: () => void;
}) {
  const [entries, setEntries] = useState<Ledger['openings']>(() =>
    eligibleSessionProfiles(document, sessionId).map((profile) => {
      const characterId = profile.characterId;
      const existing = xpLedger(document).openings.find(
        (o) => o.characterId === characterId
      );
      if (
        existing &&
        (existing.balance !== null ||
          existing.classes ||
          !profile.classes ||
          xpOpeningLocked(document, characterId))
      )
        return existing;
      return {
        id: existing?.id ?? uid(),
        characterId,
        sessionId: existing?.sessionId ?? sessionId,
        balance: null,
        reason: existing?.reason ?? '',
        ...(profile.classes
          ? {
              classes: profile.classes.map((v) => ({
                classId: v.id,
                characterClass: v.characterClass,
                balance: null,
              })),
            }
          : {}),
      };
    })
  );
  const [error, setError] = useState('');
  const history = (xpLedger(document).extensions ?? [])
    .map((extension) => ({
      ...extension,
      openings: extension.openings.filter((o) =>
        entries.some((e) => e.characterId === o.previous.characterId)
      ),
    }))
    .filter((extension) => extension.openings.length);
  const locked = (id: string) => xpOpeningLocked(document, id);
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
                locked(entry.characterId)
                  ? entry
                  : {
                      ...entry,
                      balance: 0,
                      ...(entry.classes
                        ? {
                            classes: entry.classes.map((c) => ({
                              ...c,
                              balance: 0,
                            })),
                          }
                        : {}),
                    }
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
                      {entry.classes ? (
                        <ClassXpBalancesFields
                          name={name}
                          classes={entry.classes}
                          disabled={locked(entry.characterId)}
                          onChange={(classes, balance) =>
                            update({ classes, balance })
                          }
                        />
                      ) : (
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
                      )}
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
        {!!history.length && (
          <details>
            <summary>Previous opening balances</summary>
            {history.map((extension) => (
              <div key={extension.id}>
                <p>{new Date(extension.confirmedAt).toLocaleString()}</p>
                <ul>
                  {extension.openings.map(
                    ({ previous, replacement, applied }) => (
                      <li key={previous.id}>
                        {
                          document.party?.roster.find(
                            (c) => c.id === previous.characterId
                          )?.name
                        }
                        {' · '}
                        {
                          document.sessions.find(
                            (s) => s.id === previous.sessionId
                          )?.label
                        }
                        {' · '}
                        {balance(previous.balance)}
                        {' = '}
                        {balance(replacement.balance)}
                        {' before '}
                        {
                          document.sessions.find(
                            (s) => s.id === replacement.sessionId
                          )?.label
                        }
                        {' + '}
                        {balance(applied)}
                        {' XP added'}
                        {previous.reason && <small>{previous.reason}</small>}
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </details>
        )}
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          {!!xpLedger(document).openings.length && (
            <button onClick={onExtend}>Extend history backward…</button>
          )}
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
  onConfirmExtension,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
  onConfirmExtension: (
    change: (doc: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
}) {
  const xp = xpLedger(document);
  const points = xp.points
    .filter((p) => p.position.sessionId === sessionId)
    .sort((a, b) => compareXpAwards(document, a, b));
  const [selected, setSelected] = useState('');
  const savedPoint = points.find((p) => p.id === selected);
  const [draft, setDraft] = useState<XpPoint>();
  const [dispositions, setDispositions] = useState<
    Record<string, XpTreasureDisposition>
  >({});
  const point = savedPoint?.confirmedEventId ? savedPoint : draft;
  const [editor, setEditor] = useState<{
    reward: XpReward;
    pointId?: string;
  }>();
  const [openings, setOpenings] = useState(false),
    [error, setError] = useState('');
  const [extending, setExtending] = useState(false);
  const [reviewedFingerprint, setReviewedFingerprint] = useState<string>();
  const operation = useRef<{ fingerprint: string; id: string; at: string }>();
  const [historyId, setHistoryId] = useState('');
  const [inspectedEvent, setInspectedEvent] = useState<XpReward>();
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
  const [capEdit, setCapEdit] = useState<{
    id: string;
    basis?: XpCapBasis;
    readOnly: boolean;
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
  const visibleEvent = history || selectedEvent;
  const awardOpen = Boolean(visibleEvent || point);
  const capPoint = visibleEvent?.point || point;
  function closeAward() {
    setSelected('');
    setDraft(undefined);
    setDispositions({});
    setHistoryId('');
    setReviewedFingerprint(undefined);
    setAwardEdit(undefined);
    setAllocation(undefined);
    setError('');
    setCapEdit(undefined);
  }
  function changePoint(change: Partial<XpPoint>) {
    if (!draft) return false;
    setDraft({ ...draft, ...change });
    setError('');
    return true;
  }
  function changeSelection(id: string, include: boolean) {
    if (!draft) return;
    const ids = include
      ? draft.rewardIds.includes(id)
        ? draft.rewardIds
        : [...draft.rewardIds, id]
      : draft.rewardIds.filter((rewardId) => rewardId !== id);
    const { bonuses } = withXpRewardSelection(document, draft, ids);
    changePoint({
      rewardIds: ids,
      bonuses: [
        ...draft.bonuses,
        ...bonuses.filter(
          (bonus) =>
            !draft.bonuses.some((old) => old.characterId === bonus.characterId)
        ),
      ],
    });
  }
  function openDraft(next: XpPoint) {
    setDraft(
      next.correctionOf
        ? next
        : {
            ...next,
            bonuses: next.bonuses.map((b) => ({
              ...b,
              classes: profileClassReviews(
                document.party?.profiles.find(
                  (p) =>
                    p.characterId === b.characterId &&
                    p.sessionId === next.position.sessionId
                ),
                b.classes
              )?.map((c) => {
                const current = document.party?.profiles
                  .find(
                    (p) =>
                      p.characterId === b.characterId &&
                      p.sessionId === next.position.sessionId
                  )
                  ?.classes?.find((p) => p.id === c.classId);
                return current
                  ? {
                      ...c,
                      characterClass: current.characterClass,
                      baseLevel: current.baseLevel,
                    }
                  : c;
              }),
            })),
          }
    );
    setSelected(next.id);
    setHistoryId('');
    setDispositions({});
    setReviewedFingerprint(undefined);
    setError('');
  }
  function addPoint() {
    const next = newXpPoint(document, sessionId, uid());
    openDraft(next);
  }
  function correct(event: XpEvent) {
    const id = uid();
    const scratch = beginXpCorrection(document, event.id, id);
    const next = xpLedger(scratch).points.find((p) => p.id === id);
    if (next) openDraft({ ...next, label: event.point.label });
  }
  const historical =
    point && !point.confirmedEventId && historicalXpPoint(document, point);
  const pending = xp.rewards.filter(
    (r) =>
      !rewardSettlement(document, r.id) &&
      hasPendingXpShares(document, r, point?.position.sessionId ?? sessionId) &&
      (!point || xpRewardFitsAward(document, point, r))
  );
  const rewards = Array.from(
    new Map(
      [
        ...pending,
        ...xp.rewards.filter((r) => point?.rewardIds.includes(r.id)),
        ...activeXpEvents(xp.events)
          .flatMap((e) => e.rewards)
          .filter((r) => pending.some((p) => p.id === r.id)),
        ...(point?.rewardOverrides.filter((r) =>
          point.rewardIds.includes(r.id)
        ) ?? []),
      ].map((r) => [r.id, r])
    ).values()
  );
  let projection: CampaignDocument | undefined;
  let projectedPoint: XpPoint | undefined;
  let preview: XpAwardPreview | undefined;
  let previewError = '';
  if (draft && !visibleEvent) {
    try {
      projection = stageXpAward(document, draft, dispositions);
      projectedPoint = xpLedger(projection).points.find(
        (p) => p.id === draft.id
      );
      if (!historical && projectedPoint?.rewardIds.length)
        preview = previewXpAward(projection, draft.id);
    } catch (e) {
      previewError = e instanceof Error ? e.message : String(e);
    }
  }
  const reviewedLater =
    !!preview && reviewedFingerprint === preview.fingerprint;
  function confirm() {
    if (!draft || !preview) return;
    const { fingerprint } = preview;
    if (operation.current?.fingerprint !== fingerprint)
      operation.current = {
        fingerprint,
        id: uid(),
        at: new Date().toISOString(),
      };
    const { id, at } = operation.current;
    if (
      onChange((doc) => {
        if (
          xpLedger(doc).points.find((p) => p.id === draft.id)
            ?.confirmedEventId === id
        )
          return doc;
        return confirmXpAward(
          stageXpAward(doc, draft, dispositions),
          draft.id,
          fingerprint,
          id,
          at,
          reviewedLater
        );
      })
    ) {
      setDraft(undefined);
      setDispositions({});
      setReviewedFingerprint(undefined);
      setError('');
    }
  }
  function saveDraft() {
    if (!draft) return;
    // A timeline draft can be positioned or used for history extension.
    // Disposition experiments are kept in the dialog until confirmation.
    const selectedIds = pointRewards(document, draft)
      .filter((r) => !treasurePending(r))
      .map((r) => r.id);
    if (
      onChange((doc) =>
        saveXpPoint(doc, withXpRewardSelection(doc, draft, selectedIds))
      )
    )
      closeAward();
  }
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
          setReviewedFingerprint(undefined);
          return onChange(change);
        }}
        onSelectPoint={(id) => {
          setHistoryId('');
          setAwardEdit(undefined);
          const next = points.find((p) => p.id === id);
          setDraft(next && !next.confirmedEventId ? next : undefined);
          setDispositions({});
          setSelected(id);
          setInspectedEvent(undefined);
          setReviewedFingerprint(undefined);
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
      {awardOpen && (
        <XpAwardDialog
          title={visibleEvent?.point.label ?? point?.label ?? 'XP award'}
          editable={!visibleEvent && !!point && !point.confirmedEventId}
          onRename={(label) => {
            changePoint({ label });
          }}
          onClose={closeAward}
        >
          {visibleEvent && (
            <section>
              <AwardDetails
                document={document}
                event={visibleEvent}
                onOpen={setInspectedEvent}
                onInspectAllocation={inspectAllocation}
                onCap={(id, basis) => setCapEdit({ id, basis, readOnly: true })}
              />
              {active.some((e) => e.id === visibleEvent.id) && (
                <button onClick={() => correct(visibleEvent)}>
                  Edit award…
                </button>
              )}
            </section>
          )}
          {!visibleEvent && point && !point.confirmedEventId && (
            <section
              aria-label={preview ? 'Confirm XP award' : 'Award draft'}
              className={preview ? styles['preview'] : undefined}
            >
              {historical && (
                <p>
                  Historical draft. Preview and confirm it through Opening
                  balances → Extend history backward.
                </p>
              )}
              <XpAwardTable
                document={projection ?? document}
                point={projectedPoint ?? point}
                rewards={rewards.map((r) =>
                  withXpDisposition(
                    pendingXpReward(
                      document,
                      r,
                      point.rewardOverrides.some((o) => o.id === r.id)
                    ),
                    dispositions[r.id]
                  )
                )}
                rows={preview?.rows}
                onSelect={changeSelection}
                onSettlement={(rewardId, characterId, decision, reason) =>
                  changePoint({
                    settlements: [
                      ...(point.settlements ?? []).filter(
                        (s) =>
                          s.rewardId !== rewardId ||
                          s.characterId !== characterId
                      ),
                      { rewardId, characterId, decision, reason },
                    ],
                  })
                }
                onDisposition={(id, disposition) => {
                  setDispositions({ ...dispositions, [id]: disposition });
                  changeSelection(id, disposition !== 'defer');
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
                      reward:
                        point.rewardOverrides.find((r) => r.id === reward.id) ||
                        xp.rewards.find((r) => r.id === reward.id) ||
                        reward,
                      pointId: point.correctionOf ? point.id : undefined,
                    });
                }}
                onBonus={(review) => setAwardEdit({ review, mode: 'bonus' })}
                onFinal={(review) => setAwardEdit({ review, mode: 'final' })}
                onCap={(id) => setCapEdit({ id, readOnly: false })}
                onInspectAllocation={inspectAllocation}
              />
              {preview?.later.length ? (
                <div className={styles['warning']}>
                  <h4>Later balances to review</h4>
                  {preview.later.map(({ event, differences }) => (
                    <div key={event.id}>
                      <strong>{event.point.label}</strong>
                      {inPartyOrder(
                        document,
                        differences,
                        (r) => r.characterId
                      ).map((r) => (
                        <p key={r.characterId}>
                          {r.name} · {r.changes.join(', ')}
                        </p>
                      ))}
                    </div>
                  ))}
                  <label className={styles['check']}>
                    <input
                      type="checkbox"
                      checked={reviewedLater}
                      onChange={(e) =>
                        setReviewedFingerprint(
                          e.target.checked ? preview?.fingerprint : undefined
                        )
                      }
                    />
                    I reviewed the recalculated later balances
                  </label>
                </div>
              ) : null}
              <div className={styles['actions']}>
                {!historical && (
                  <button
                    className={styles['primary']}
                    disabled={
                      !preview || (preview.later.length > 0 && !reviewedLater)
                    }
                    onClick={confirm}
                  >
                    {point.correctionOf ? 'Confirm changes' : 'Confirm award'}
                  </button>
                )}
                <button onClick={closeAward}>Cancel</button>
                {!point.correctionOf && (
                  <button onClick={saveDraft}>Save draft</button>
                )}
                {savedPoint && !savedPoint.confirmedEventId && (
                  <button
                    onClick={() => {
                      if (onChange((doc) => discardXpPoint(doc, point.id)))
                        closeAward();
                    }}
                  >
                    {point.correctionOf
                      ? 'Discard changes'
                      : 'Discard saved draft'}
                  </button>
                )}
              </div>
            </section>
          )}
          {awardOpen && (error || previewError) && (
            <p role="alert" className={styles['warning']}>
              {error || previewError}
            </p>
          )}
        </XpAwardDialog>
      )}
      {!awardOpen && error && (
        <p role="alert" className={styles['warning']}>
          {error}
        </p>
      )}
      <details className={styles['history']}>
        <summary>Award history · {xp.events.length} recorded versions</summary>
        {xp.events.map((event) => (
          <div key={event.id} className={styles['historyRow']}>
            <button
              onClick={() => {
                setSelected('');
                setReviewedFingerprint(undefined);
                setHistoryId(event.id);
                setError('');
              }}
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
      {capEdit && capPoint && (
        <XpCapDialog
          document={document}
          point={capPoint}
          characterId={capEdit.id}
          basis={capEdit.basis}
          readOnly={capEdit.readOnly}
          onClose={() => setCapEdit(undefined)}
          onSave={(basis) =>
            changePoint({
              caps: [
                ...(point?.caps || []).filter(
                  (c) => c.characterId !== capEdit.id
                ),
                ...(basis ? [{ characterId: capEdit.id, basis }] : []),
              ],
            })
          }
        />
      )}
      {awardEdit && (
        <XpAwardEditor
          review={awardEdit.review}
          mappingBalance={
            draft &&
            !Object.keys(
              xpClassBalances(
                document,
                awardEdit.review.characterId,
                draft.position,
                false,
                undefined,
                xpAwardRoot(document, draft)
              )
            ).length
              ? xpBalance(
                  document,
                  awardEdit.review.characterId,
                  draft.position,
                  false,
                  undefined,
                  xpAwardRoot(document, draft)
                )
              : undefined
          }
          mode={awardEdit.mode}
          onClose={() => setAwardEdit(undefined)}
          onSave={(updated) =>
            changePoint({
              bonuses: [
                ...(draft?.bonuses.filter(
                  (b) => b.characterId !== updated.characterId
                ) ?? []),
                updated,
              ],
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
            {inspectedEvent.input.category === 'treasure' ? (
              <TreasureReview rows={inspectedEvent.input.rows} />
            ) : (
              <p>{inspectedEvent.evidence.label}</p>
            )}
            {inspectedEvent.notes && <p>{inspectedEvent.notes}</p>}
            <XpRewardCalculation document={document} reward={inspectedEvent} />
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
          onExtend={() => {
            setOpenings(false);
            setExtending(true);
          }}
        />
      )}
      {extending && (
        <XpHistoryExtension
          sessionId={sessionId}
          document={document}
          onConfirm={onConfirmExtension}
          onClose={() => setExtending(false)}
        />
      )}
      {editor && (
        <XpRewardEditor
          key={`${editor.reward.id}:${editor.pointId || ''}`}
          document={document}
          reward={editor.reward}
          correction={!!editor.pointId}
          onClose={() => setEditor(undefined)}
          onDelete={
            !editor.pointId &&
            xp.rewards.some((r) => r.id === editor.reward.id) &&
            !xp.events.some((e) =>
              e.rewards.some((r) => r.id === editor.reward.id)
            )
              ? () => {
                  setReviewedFingerprint(undefined);
                  const removed = onChange((doc) =>
                    deleteXpReward(doc, editor.reward.id, editor.reward.version)
                  );
                  if (removed) changeSelection(editor.reward.id, false);
                  return removed;
                }
              : undefined
          }
          onSave={(reward) => {
            if (editor.pointId && draft?.id === editor.pointId) {
              const updated = {
                ...draft,
                rewardOverrides: [
                  ...draft.rewardOverrides.filter((r) => r.id !== reward.id),
                  { ...reward, version: editor.reward.version + 1 },
                ],
              };
              return changePoint(
                withXpRewardSelection(document, updated, updated.rewardIds)
              );
            }
            const existing = xp.rewards.find((r) => r.id === reward.id);
            return onChange((doc) =>
              saveXpReward(doc, {
                ...reward,
                version: existing ? existing.version + 1 : reward.version,
              })
            );
          }}
        />
      )}
    </div>
  );
}

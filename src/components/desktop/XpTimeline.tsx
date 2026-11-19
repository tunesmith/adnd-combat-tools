import { treasurePending } from '../../helpers/campaignXpTreasure';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { XpReward } from '../../helpers/campaignXpModel';
import {
  xpTimelineEntries,
  xpTimelineEntryFrozen,
  moveXpTimelineEntry,
  xpAwardRoot,
} from '../../helpers/campaignXpTimeline';
import {
  rewardSettlement,
  activeXpEvents,
  historicalXpReward,
  historicalXpPoint,
} from '../../helpers/campaignXp';
import styles from './xpWorkspace.module.css';
export default function XpTimeline({
  document,
  sessionId,
  selectedPointId,
  onSelectPoint,
  onSelectEvent,
  onChange,
}: {
  document: CampaignDocument;
  sessionId: string;
  selectedPointId: string;
  onSelectPoint: (id: string) => void;
  onSelectEvent: (reward: XpReward) => void;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
}) {
  const xp = document.xp,
    entries = xpTimelineEntries(document, sessionId);
  const selectedPoint = xp?.points.find((p) => p.id === selectedPointId);
  const selectedRoot = selectedPoint
    ? xpAwardRoot(document, selectedPoint)
    : '';
  return (
    <section aria-label="Session XP timeline">
      <h3>XP timeline</h3>
      {!entries.length ? (
        <p>No XP events or awards in this session.</p>
      ) : (
        <ol className={styles['timeline']}>
          {entries.map((entry, index) => {
            const reward = xp?.rewards.find((r) => r.id === entry.id),
              point = xp?.points.find((p) => p.id === entry.id);
            const correction = xp?.points.find(
              (p) =>
                p.correctionOf &&
                !p.confirmedEventId &&
                xpAwardRoot(document, p) === entry.id
            );
            const settlement = reward
              ? rewardSettlement(document, reward.id)
              : undefined;
            const displayedReward =
              settlement?.rewards.find((r) => r.id === reward?.id) || reward;
            const acceptedAward = point?.confirmedEventId
              ? activeXpEvents(xp?.events || []).find(
                  (e) => xpAwardRoot(document, e.point) === entry.id
                )
              : undefined;
            const displayLabel =
              correction?.label || acceptedAward?.point.label || entry.label;
            const frozen = xpTimelineEntryFrozen(document, entry.id);
            const status = reward
              ? settlement
                ? 'Awarded'
                : activeXpEvents(xp?.events || []).some((e) =>
                    e.rewards.some((r) => r.id === reward.id)
                  )
                ? 'Partly settled · pending shares'
                : historicalXpReward(document, reward)
                ? 'Historical draft'
                : treasurePending(reward.input)
                ? reward.input.category === 'treasure' && reward.input.rows
                  ? 'Awaiting item decisions'
                  : 'Deferred'
                : 'Pending'
              : correction
              ? 'Draft changes'
              : point?.confirmedEventId
              ? 'Confirmed'
              : point && historicalXpPoint(document, point)
              ? 'Historical draft'
              : 'Draft';
            const move = (direction: -1 | 1) =>
              onChange((doc) =>
                moveXpTimelineEntry(doc, sessionId, entry.id, direction)
              );
            return (
              <li
                key={entry.id}
                className={`${styles['timelineRow']} ${
                  entry.kind === 'award' ? styles['timelineAward'] : ''
                }`}
              >
                <span className={styles['timelineKind']}>
                  {entry.kind === 'event' ? 'XP event' : 'XP award'}
                </span>
                <button
                  className={styles['timelineName']}
                  aria-pressed={
                    entry.kind === 'award' && selectedRoot === entry.id
                  }
                  onClick={() => {
                    if (displayedReward) onSelectEvent(displayedReward);
                    else onSelectPoint(correction?.id || entry.id);
                  }}
                >
                  {displayLabel || 'Unnamed award'}
                  <small>{status}</small>
                </button>
                {displayedReward?.notes.trim() && (
                  <span className={styles['timelineNotes']}>
                    {displayedReward.notes}
                  </span>
                )}
                <div className={styles['timelineMoves']}>
                  <button
                    aria-label={`Move ${entry.label} earlier`}
                    title={
                      frozen
                        ? 'Confirmed history stays in place'
                        : 'Move earlier'
                    }
                    disabled={frozen || index === 0}
                    onClick={() => move(-1)}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Move ${entry.label} later`}
                    title={
                      frozen ? 'Confirmed history stays in place' : 'Move later'
                    }
                    disabled={frozen || index === entries.length - 1}
                    onClick={() => move(1)}
                  >
                    ↓
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

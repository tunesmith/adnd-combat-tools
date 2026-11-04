import { useState } from 'react';
import CombatTracker from '../tracker/CombatTracker';
import type { TrackerState } from '../../types/tracker';
import styles from './campaignWorkspace.module.css';

/** Navigation changes only this preview; historical state never enters the edit queue. */
export default function HistoricalCombat({ state }: { state: TrackerState }) {
  const [round, setRound] = useState(state.activeRound);
  return (
    <section aria-label="Historical combat">
      <span className={styles['historical']}>Historical · read only</span>
      <label>
        Round{' '}
        <select
          value={round}
          onChange={(e) => setRound(Number(e.target.value))}
        >
          {state.rounds.map((r, i) => (
            <option key={i} value={i}>
              {r.label || `Round ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
      <CombatTracker
        campaign={{
          active: false,
          readOnly: true,
          state: { ...state, activeRound: round },
          onStateChange: () => false,
        }}
      />
    </section>
  );
}

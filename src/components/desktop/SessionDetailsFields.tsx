import styles from './campaignWorkspace.module.css';

type SessionDetailsDraft = {
  label: string;
  date: string;
  number: string;
};

export default function SessionDetailsFields({
  draft,
  onChange,
  numberRequired = true,
}: {
  draft: SessionDetailsDraft;
  onChange: (next: SessionDetailsDraft) => void;
  numberRequired?: boolean;
}) {
  return (
    <div className={styles['sessionMetadataFields']}>
      <label className={styles['sessionNameField']}>
        Session name
        <input
          autoFocus
          required
          maxLength={1000}
          value={draft.label}
          onChange={(e) => onChange({ ...draft, label: e.target.value })}
        />
      </label>
      <div className={styles['sessionMetadataRow']}>
        <label className={styles['sessionNameField']}>
          Date
          <input
            type="date"
            max="9999-12-31"
            value={draft.date}
            onChange={(e) => onChange({ ...draft, date: e.target.value })}
          />
        </label>
        <label className={styles['sessionNameField']}>
          Session number
          <input
            type="number"
            min={1}
            max={Number.MAX_SAFE_INTEGER}
            step={1}
            required={numberRequired}
            value={draft.number}
            onChange={(e) => onChange({ ...draft, number: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { SaveReminder } from '../../helpers/campaignPartyModel';
import styles from './partyReference.module.css';

export default function SaveReminderEditor({
  rows,
  onChange,
}: {
  rows: SaveReminder[];
  onChange: (rows: SaveReminder[]) => void;
}) {
  const [beforeRoll, setBeforeRoll] = useState(false);
  function update(row: SaveReminder) {
    onChange(rows.map((current) => (current.id === row.id ? row : current)));
  }
  function add() {
    const shared = { id: crypto.randomUUID(), source: '' };
    onChange([
      ...rows,
      beforeRoll
        ? { ...shared, instruction: '' }
        : { ...shared, bonus: '', appliesWhen: '' },
    ]);
  }
  return (
    <fieldset className={styles['editor']}>
      <legend>Saving-throw reminders</legend>
      {rows.map((row, index) => (
        <div className={styles['editorRow']} key={row.id}>
          {'instruction' in row ? (
            <label className={styles['instructionField']}>
              Before the roll
              <input
                required
                maxLength={1000}
                value={row.instruction}
                onChange={(e) =>
                  update({ ...row, instruction: e.target.value })
                }
              />
            </label>
          ) : (
            <>
              <label>
                Bonus
                <input
                  required
                  maxLength={100}
                  value={row.bonus}
                  onChange={(e) => update({ ...row, bonus: e.target.value })}
                />
              </label>
              <label>
                Applies when
                <input
                  required
                  maxLength={1000}
                  value={row.appliesWhen}
                  onChange={(e) =>
                    update({ ...row, appliesWhen: e.target.value })
                  }
                />
              </label>
            </>
          )}
          <label className={styles['sourceField']}>
            Source (optional)
            <input
              maxLength={1000}
              value={row.source}
              onChange={(e) => update({ ...row, source: e.target.value })}
            />
          </label>
          <button
            type="button"
            aria-label={`Remove reminder ${index + 1}`}
            onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
          >
            Remove
          </button>
        </div>
      ))}
      <div className={styles['addReminder']}>
        <select
          aria-label="New reminder type"
          value={beforeRoll ? 'before' : 'bonus'}
          onChange={(e) => setBeforeRoll(e.target.value === 'before')}
        >
          <option value="bonus">Add to the roll</option>
          <option value="before">Before the roll</option>
        </select>
        <button type="button" onClick={add}>
          Add reminder
        </button>
      </div>
    </fieldset>
  );
}

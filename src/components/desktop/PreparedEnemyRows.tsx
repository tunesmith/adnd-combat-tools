import type { PreparedEnemy } from '../../helpers/campaignPreparedEnemies';
import styles from './campaignWorkspace.module.css';

export default function PreparedEnemyRows({
  entries,
  selectedIds,
  placedIds,
  disabled,
  onToggle,
  onEdit,
  onRemove,
}: {
  entries: PreparedEnemy[];
  selectedIds?: readonly string[];
  placedIds?: ReadonlySet<string>;
  disabled?: boolean;
  onToggle?: (id: string, checked: boolean) => void;
  onEdit: (entry: PreparedEnemy) => void;
  onRemove?: (entry: PreparedEnemy) => void;
}) {
  if (!entries.length) return <p>No prepared enemies.</p>;
  return (
    <ul className={styles['preparedRows']}>
      {entries.map((entry) => {
        const { id, combatant } = entry;
        const placed = placedIds?.has(id);
        return (
          <li key={id} className={styles['preparedRow']}>
            {onToggle ? (
              <label className={styles['preparedName']}>
                <input
                  type="checkbox"
                  checked={Boolean(selectedIds?.includes(id) && !placed)}
                  disabled={disabled || placed}
                  onChange={(event) => onToggle(id, event.target.checked)}
                />
                {combatant.name}
              </label>
            ) : (
              <span className={styles['preparedName']}>{combatant.name}</span>
            )}
            <small className={styles['preparedStats']}>
              AC {combatant.armorClass} · HP {combatant.maxHp || '—'}
              {placed && <span>Already in this round</span>}
            </small>
            <div className={styles['preparedRowActions']}>
              <button
                type="button"
                aria-label={`Edit ${combatant.name}`}
                disabled={disabled}
                onClick={() => onEdit(entry)}
              >
                Edit
              </button>
              {onRemove && (
                <button
                  type="button"
                  className={styles['preparedRemove']}
                  aria-label={`Remove ${combatant.name}`}
                  disabled={disabled}
                  onClick={() => onRemove(entry)}
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

import type { DungeonTablePreview } from '../../types/dungeon';
import styles from './DungeonTablePreviewCard.module.css';

type DungeonTablePreviewCardProps = {
  preview: DungeonTablePreview;
  enablePreviewControls?: boolean;
  overrideValue?: number;
  onOverrideChange?: (value: number | undefined) => void;
  onUseOverride?: () => void;
  onAutoRoll?: () => void;
  isCollapsed?: boolean;
  hasResolved?: boolean;
  onToggleCollapse?: () => void;
};

const DungeonTablePreviewCard = ({
  preview,
  enablePreviewControls = true,
  overrideValue,
  onOverrideChange,
  onUseOverride,
  onAutoRoll,
  isCollapsed = false,
  hasResolved = false,
  onToggleCollapse,
}: DungeonTablePreviewCardProps) => {
  const statusLabel = !enablePreviewControls
    ? 'Reference'
    : hasResolved
    ? 'Resolved'
    : 'Pending';

  const statusClass = !enablePreviewControls
    ? styles['statusReference']
    : hasResolved
    ? styles['statusResolved']
    : styles['statusPending'];

  const surface = (
    <>
      <div className={styles['header']}>
        <div>
          <div className={styles['headingGroup']}>
            <div className={styles['title']}>{preview.title}</div>
            <div className={styles['die']}>(d{preview.sides})</div>
          </div>
        </div>
        <div className={styles['metaRow']}>
          <span className={`${styles['status']} ${statusClass}`}>
            {statusLabel}
          </span>
          {onToggleCollapse && (
            <span className={styles['collapseIcon']} aria-hidden="true">
              {isCollapsed ? '▸' : '▾'}
            </span>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className={styles['entries']}>
          {preview.entries.map((entry, index) => (
            <div className={styles['entryRow']} key={`${entry.range}-${index}`}>
              <code className={styles['range']}>{entry.range}</code>
              <span>{entry.label}</span>
            </div>
          ))}
        </div>
      )}

      {isCollapsed && hasResolved && (
        <div className={styles['collapsedNote']}>
          Resolved. Expand to review the full table.
        </div>
      )}
    </>
  );

  return (
    <div className={styles['card']}>
      {onToggleCollapse ? (
        <button
          type="button"
          className={styles['surfaceButton']}
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand table' : 'Collapse table'}
          aria-label={isCollapsed ? 'Expand table' : 'Collapse table'}
        >
          {surface}
        </button>
      ) : (
        <div className={styles['surfaceStatic']}>{surface}</div>
      )}

      {!isCollapsed && enablePreviewControls && onOverrideChange && (
        <div className={styles['controls']}>
          <label className={styles['overrideField']}>
            <span className={styles['overrideLabel']}>Override roll</span>
            <input
              className={styles['overrideInput']}
              type="number"
              min={1}
              max={preview.sides}
              value={overrideValue ?? ''}
              onChange={(event) => {
                const value = event.target.value
                  ? Number(event.target.value)
                  : undefined;
                onOverrideChange(value);
              }}
            />
            <span className={styles['overrideHint']}>
              Enter a value to force the next result.
            </span>
          </label>

          <div className={styles['actions']}>
            <button
              type="button"
              className={`${styles['button']} ${styles['buttonSecondary']}`}
              onClick={onUseOverride}
              disabled={overrideValue === undefined}
            >
              Use override
            </button>
            <button
              type="button"
              className={`${styles['button']} ${styles['buttonPrimary']}`}
              onClick={onAutoRoll}
            >
              AutoRoll
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { DungeonTablePreviewCard };

import type { AnyDungeonTablePreview } from '../../types/dungeon';
import styles from './DungeonTablePreviewCard.module.css';

type DungeonTablePreviewCardProps = {
  preview: AnyDungeonTablePreview;
  enablePreviewControls?: boolean;
  statusLabelOverride?: string;
  statusToneOverride?: 'pending' | 'resolved' | 'reference';
  overrideValue?: number;
  onOverrideChange?: (value: number | undefined) => void;
  onUseOverride?: () => void;
  onAutoRoll?: () => void;
  onEntrySelect?: (value: number) => void;
  isCollapsed?: boolean;
  hasResolved?: boolean;
  onToggleCollapse?: () => void;
};

const DungeonTablePreviewCard = ({
  preview,
  enablePreviewControls = true,
  statusLabelOverride,
  statusToneOverride,
  overrideValue,
  onOverrideChange,
  onUseOverride,
  onAutoRoll,
  onEntrySelect,
  isCollapsed = false,
  hasResolved = false,
  onToggleCollapse,
}: DungeonTablePreviewCardProps) => {
  const statusTone =
    statusToneOverride ??
    (!enablePreviewControls
      ? 'reference'
      : hasResolved
      ? 'resolved'
      : 'pending');

  const statusLabel =
    statusLabelOverride ??
    (statusTone === 'reference'
      ? 'Reference'
      : statusTone === 'resolved'
      ? 'Resolved'
      : 'Pending');

  const statusClass =
    statusTone === 'reference'
      ? styles['statusReference']
      : statusTone === 'resolved'
      ? styles['statusResolved']
      : styles['statusPending'];

  const shouldShowEntriesInline = !isCollapsed;
  const canSelectEntries = !isCollapsed && !hasResolved && !!onEntrySelect;

  const entries = (
    <div className={styles['entries']}>
      {preview.entries.map((entry, index) => {
        const entryRoll = parsePreviewEntryRoll(entry.range);
        const content = (
          <>
            <code className={styles['range']}>{entry.range}</code>
            <span className={styles['entryLabel']}>{entry.label}</span>
          </>
        );

        if (!canSelectEntries || entryRoll === undefined) {
          return (
            <div className={styles['entryRow']} key={`${entry.range}-${index}`}>
              {content}
            </div>
          );
        }

        return (
          <button
            key={`${entry.range}-${index}`}
            type="button"
            className={`${styles['entryRow']} ${styles['entryButton']}`}
            onClick={() => onEntrySelect(entryRoll)}
            aria-label={`Use roll ${entryRoll} for ${entry.label}`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );

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

      {shouldShowEntriesInline && entries}

      {isCollapsed && hasResolved && (
        <div className={styles['collapsedNote']}>
          Expand to review the full table.
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
        <>
          <div className={styles['controls']}>
            <div className={styles['actions']}>
              <button
                type="button"
                className={`${styles['button']} ${styles['buttonPrimary']}`}
                onClick={onAutoRoll}
              >
                AutoRoll
              </button>
            </div>

            <div className={styles['overrideCluster']}>
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
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    onUseOverride?.();
                  }}
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function parsePreviewEntryRoll(range: string): number | undefined {
  const firstMatch = range.match(/\d+/);
  if (!firstMatch) return undefined;
  const value = Number(firstMatch[0]);
  return Number.isInteger(value) ? value : undefined;
}

export { DungeonTablePreviewCard };

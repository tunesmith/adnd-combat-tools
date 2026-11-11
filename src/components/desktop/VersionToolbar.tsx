import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import styles from './campaignWorkspace.module.css';
export default function VersionToolbar({
  versions,
  value,
  onSelect,
  onCapture,
  onRestore,
  onCreate,
  replacementName,
  firstActivation,
  secondaryActions,
  replacementDetails,
}: {
  versions: { id: string; title: string; time: string }[];
  value: string;
  onSelect: (id: string) => void;
  onCapture?: (name: string) => void;
  onRestore?: () => void;
  onCreate?: () => void;
  replacementName?: string;
  firstActivation?: boolean;
  secondaryActions?: ReactNode;
  replacementDetails?: ReactNode;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const openAction = (next: 'capture' | 'restore') => {
    if (menu.current) menu.current.open = false;
    setAction(next);
  };
  const [action, setAction] = useState<'capture' | 'restore' | null>(null),
    [name, setName] = useState('');
  return (
    <div className={styles['versionToolbar']}>
      <label>
        Version{' '}
        <select value={value} onChange={(e) => onSelect(e.target.value)}>
          <option value="">Current</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title} · {new Date(v.time).toLocaleString()}
            </option>
          ))}
        </select>
      </label>
      {value && (
        <>
          <span>Historical</span>
          <button onClick={() => onSelect('')}>Return to current</button>
        </>
      )}
      <details ref={menu} className={styles['versionMenu']}>
        <summary aria-label="Version actions">…</summary>
        <div>
          {!value && onCapture && (
            <button onClick={() => openAction('capture')}>
              Capture checkpoint…
            </button>
          )}
          {value && onRestore && (
            <button
              onClick={() =>
                firstActivation ? onRestore?.() : openAction('restore')
              }
            >
              {firstActivation
                ? 'Use as current inventory'
                : 'Restore this version…'}
            </button>
          )}
          {value && onCreate && (
            <button
              onClick={() => {
                if (menu.current) menu.current.open = false;
                onCreate?.();
              }}
            >
              Create new encounter from this version…
            </button>
          )}
          {secondaryActions}
        </div>
      </details>
      {action && (
        <div className={styles['dialogShade']}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={
              action === 'capture' ? 'Capture checkpoint' : 'Restore version'
            }
            className={styles['versionDialog']}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setAction(null);
              }
            }}
          >
            {action === 'capture' ? (
              <label>
                Checkpoint name
                <input
                  autoFocus
                  maxLength={1000}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            ) : (
              <p>
                Replace {replacementName || 'the current encounter'} with this
                version? Current work will be preserved in a checkpoint.
              </p>
            )}
            {action === 'restore' && replacementDetails}
            <button
              autoFocus={action === 'restore'}
              onClick={() => setAction(null)}
            >
              Cancel
            </button>
            <button
              disabled={action === 'capture' && !name.trim()}
              onClick={() => {
                if (action === 'capture') onCapture?.(name.trim());
                else onRestore?.();
                setAction(null);
                setName('');
              }}
            >
              {action === 'capture' ? 'Capture checkpoint' : 'Restore version'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

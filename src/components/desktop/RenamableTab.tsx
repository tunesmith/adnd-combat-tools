import { useEffect, useRef, useState } from 'react';
import { formatSessionDate } from '../../helpers/campaignSessionMetadata';
import styles from './campaignWorkspace.module.css';

export default function RenamableTab({
  label,
  sessionDate,
  kind,
  selected,
  renameOnMount = false,
  draggable = false,
  onSelect,
  onRename,
  onRenameEnd,
}: {
  label: string;
  sessionDate?: { sessionId: string; value: string };
  kind: 'session' | 'encounter' | 'award';
  selected: boolean;
  renameOnMount?: boolean;
  draggable?: boolean;
  onSelect: () => void;
  onRename: (label: string) => void;
  onRenameEnd?: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(
    renameOnMount ? label : null
  );
  const button = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);

  useEffect(() => {
    if (draft === null && refocus.current) {
      refocus.current = false;
      button.current?.focus();
    }
  }, [draft]);

  function finish(save: boolean, focus: boolean) {
    const name = draft?.trim();
    if (save && name && name !== label) onRename(name);
    refocus.current = focus;
    setDraft(null);
    onRenameEnd?.();
  }

  const dateId = sessionDate && `session-date-${sessionDate.sessionId}`;
  const date = sessionDate && (
    <time
      id={dateId}
      dateTime={sessionDate.value}
      className={styles['sessionTabDate']}
    >
      {formatSessionDate(sessionDate.value)}
    </time>
  );

  if (draft === null)
    return (
      <button
        ref={button}
        draggable={draggable}
        type="button"
        aria-pressed={selected}
        aria-label={sessionDate ? label : undefined}
        aria-describedby={dateId}
        title="Double-click or press F2 to rename"
        onClick={(event) => {
          event.currentTarget.focus();
          onSelect();
        }}
        onDoubleClick={() => setDraft(label)}
        onKeyDown={(e) => {
          if (e.key !== 'F2') return;
          e.preventDefault();
          onSelect();
          setDraft(label);
        }}
      >
        {kind === 'session' ? (
          <span className={styles['sessionTabName']}>{label}</span>
        ) : (
          label
        )}
        {date}
      </button>
    );

  const input = (
    <input
      className={styles['inlineName']}
      aria-label={`Rename ${kind}`}
      aria-describedby={dateId}
      autoFocus
      maxLength={1000}
      value={draft}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => finish(true, false)}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          finish(e.key === 'Enter', true);
        }
      }}
    />
  );
  return kind === 'session' ? (
    <div className={styles['sessionRename']}>
      {input}
      {date}
    </div>
  ) : (
    input
  );
}

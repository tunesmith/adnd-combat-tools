import { useEffect, useRef, useState } from 'react';
import styles from './campaignWorkspace.module.css';

export default function RenamableTab({
  label,
  kind,
  selected,
  renameOnMount = false,
  onSelect,
  onRename,
  onRenameEnd,
}: {
  label: string;
  kind: 'session' | 'encounter';
  selected: boolean;
  renameOnMount?: boolean;
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

  return draft === null ? (
    <button
      ref={button}
      type="button"
      aria-pressed={selected}
      title="Double-click or press F2 to rename"
      onClick={onSelect}
      onDoubleClick={() => setDraft(label)}
      onKeyDown={(e) => {
        if (e.key !== 'F2') return;
        e.preventDefault();
        onSelect();
        setDraft(label);
      }}
    >
      {label}
    </button>
  ) : (
    <input
      className={styles['inlineName']}
      aria-label={`Rename ${kind}`}
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
}

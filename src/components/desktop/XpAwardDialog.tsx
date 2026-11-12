import type { ReactNode } from 'react';
import styles from './xpWorkspace.module.css';

export default function XpAwardDialog({
  title,
  children,
  editable = false,
  onRename,
  onClose,
}: {
  title: string;
  children: ReactNode;
  editable?: boolean;
  onRename: (label: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className={styles['backdrop']}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        tabIndex={-1}
        className={`${styles['modal']} ${styles['awardModal']}`}
        role="dialog"
        aria-modal="true"
        aria-label="XP award"
        onKeyDownCapture={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <div className={styles['heading']}>
          {editable ? (
            <input
              className={styles['awardDialogName']}
              aria-label="Award name"
              placeholder="Award name"
              autoFocus
              maxLength={1000}
              value={title}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => onRename(e.target.value)}
              onBlur={(e) => {
                const name = e.target.value.trim() || 'New award';
                if (name !== title) onRename(name);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
            />
          ) : (
            <h2 className={styles['awardDialogTitle']}>{title}</h2>
          )}
          {!editable && (
            <button autoFocus onClick={onClose}>
              Close award
            </button>
          )}
        </div>
        {children}
      </section>
    </div>
  );
}

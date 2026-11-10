import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import RenamableTab from './RenamableTab';
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
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    if (editable) dialog.current?.focus({ preventScroll: true });
  }, [editable]);

  return (
    <div
      className={styles['backdrop']}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialog}
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
          <h2 className={styles['awardDialogTitle']}>
            {editable ? (
              <RenamableTab
                label={title}
                kind="award"
                selected={false}
                onSelect={() => undefined}
                onRename={onRename}
              />
            ) : (
              title
            )}
          </h2>
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

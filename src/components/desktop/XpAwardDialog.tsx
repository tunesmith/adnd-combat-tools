import type { ReactNode } from 'react';
import RenamableTab from './RenamableTab';
import styles from './xpWorkspace.module.css';

export default function XpAwardDialog({
  title,
  children,
  editable = false,
  renameOnMount = false,
  onRename,
  onRenameEnd,
  onClose,
}: {
  title: string;
  children: ReactNode;
  editable?: boolean;
  renameOnMount?: boolean;
  onRename: (label: string) => void;
  onRenameEnd: () => void;
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
        className={`${styles['modal']} ${styles['awardModal']}`}
        role="dialog"
        aria-modal="true"
        aria-label="XP award"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
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
                renameOnMount={renameOnMount}
                onSelect={() => undefined}
                onRename={onRename}
                onRenameEnd={onRenameEnd}
              />
            ) : (
              title
            )}
          </h2>
          <button autoFocus={!renameOnMount} onClick={onClose}>
            Close award
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

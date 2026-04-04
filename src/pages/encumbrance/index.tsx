import Link from 'next/link';
import styles from './index.module.css';

const EncumbranceIndexPage = () => {
  return (
    <div className={styles['outerContainer']}>
      <div className={styles['title']}>AD&amp;D Encumbrance &amp; Gear</div>
      <div className={styles['contentContainer']}>
        <section className={styles['chooserPanel']}>
          <div className={styles['chooserTitle']}>Choose a View</div>
          <div className={styles['viewGrid']}>
            <article className={styles['viewCard']}>
              <div className={styles['viewCopy']}>
                <span className={styles['viewLabel']}>Dungeon Master</span>
                <h2 className={styles['viewHeading']}>
                  Run the master record.
                </h2>
                <p className={styles['viewDescription']}>
                  Maintain the full party file, keep private notes, and export
                  player-safe copies when you are ready to share them.
                </p>
              </div>
              <Link href="/encumbrance/dm">
                <a className={styles['viewAction']}>Open DM View</a>
              </Link>
            </article>
            <article className={styles['viewCard']}>
              <div className={styles['viewCopy']}>
                <span className={styles['viewLabel']}>Player</span>
                <h2 className={styles['viewHeading']}>Update one character.</h2>
                <p className={styles['viewDescription']}>
                  Open a player file, adjust possessions, and save it back for
                  the dungeon master to import later.
                </p>
              </div>
              <Link href="/encumbrance/player">
                <a className={styles['viewAction']}>Open Player View</a>
              </Link>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EncumbranceIndexPage;

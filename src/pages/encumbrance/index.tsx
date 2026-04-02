import Link from 'next/link';
import styles from '../../components/encumbrance/encumbrance.module.css';

const EncumbranceIndexPage = () => {
  return (
    <div className={styles['outerContainer']}>
      <div className={styles['title']}>AD&amp;D Encumbrance &amp; Gear</div>
      <div className={styles['contentContainer']}>
        <section className={styles['card']}>
          <div className={styles['cardTitle']}>Choose a View</div>
          <div className={styles['summaryGrid']}>
            <div className={styles['summaryValue']}>
              <span className={styles['summaryLabel']}>Dungeon Master</span>
              <p style={{ marginBottom: '0.9rem' }}>
                Maintain the master file and export player-safe copies.
              </p>
              <Link href="/encumbrance/dm">
                <a className={`${styles['button']} ${styles['buttonPrimary']}`}>
                  Open DM View
                </a>
              </Link>
            </div>
            <div className={styles['summaryValue']}>
              <span className={styles['summaryLabel']}>Player</span>
              <p style={{ marginBottom: '0.9rem' }}>
                Load a player file, adjust possessions, and export it back.
              </p>
              <Link href="/encumbrance/player">
                <a className={`${styles['button']} ${styles['buttonPrimary']}`}>
                  Open Player View
                </a>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EncumbranceIndexPage;

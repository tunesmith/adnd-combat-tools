import Link from 'next/link';
import styles from './index.module.css';

const Index = () => {
  return (
    <div className={styles['links']}>
      <Link href={'/calculator'}>AD&D Combat Calculator</Link>
      <br />
      <Link href={'/battle'}>AD&D Battle Grid</Link>
      <br />
      <Link href={'/initiative'}>AD&amp;D Initiative Playground</Link>
      <br />
      <Link href={'/dungeon'}>AD&D Random Dungeon Generator</Link>
      <br />
      <Link href={'/tracker'}>AD&amp;D Combat Tracker</Link>
    </div>
  );
};

export default Index;

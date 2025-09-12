import styles from "./dungeon.module.css";

const DungeonIndexPage = () => {
  return (
    <div className={styles["outerContainer"]}>
      <div className={styles["title"]}>AD&D Random Dungeon Generator</div>
      <div className={styles["contentContainer"]}>
        <p className={styles["placeholder"]}>
          Dungeon tool scaffolded. UI and logic will be added next.
        </p>
      </div>
    </div>
  );
};

export default DungeonIndexPage;


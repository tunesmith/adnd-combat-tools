import getToHit from "../../helpers/getToHit";
import styles from "./cellOutput.module.css";

const CellOutput = ({ red, green }) => {
  const redToHit = getToHit(
    red.class,
    red.level,
    green.armorType,
    green.armorClass,
    red.weapon
  );

  const greenToHit = getToHit(
    green.class,
    green.level,
    red.armorType,
    red.armorClass,
    green.weapon
  );

  return (
    <div className={styles.outerCell}>
      <div className={styles.left}>{redToHit}</div>
      <div className={styles.right}>{greenToHit}</div>
    </div>
  );
};

export default CellOutput;

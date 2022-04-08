import getToHit from "../../helpers/getToHit";
import styles from "./cellOutput.module.css";
import { expandedArmorTypes } from "../../tables/armorType";

const CellOutput = ({ red, green }) => {
  const redToHit = getToHit(
    red.class,
    red.level,
    expandedArmorTypes.filter((prop) => prop.key === green.armorType)[0]
      .armorType,
    green.armorClass,
    red.weapon
  );

  const greenToHit = getToHit(
    green.class,
    green.level,
    expandedArmorTypes.filter((prop) => prop.key === red.armorType)[0]
      .armorType,
    red.armorClass,
    green.weapon
  );

  return (
    <div className={styles["outerCell"]}>
      <div className={styles["left"]}>{redToHit}</div>
      <div className={styles["right"]}>{greenToHit}</div>
    </div>
  );
};

export default CellOutput;

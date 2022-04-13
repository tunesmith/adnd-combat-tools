import getToHit from "../../helpers/getToHit";
import styles from "./cellOutput.module.css";
import { expandedArmorTypes } from "../../tables/armorType";
import { Creature } from "../../types/creature";

const CellOutput = ({ red, green }: { red: Creature; green: Creature }) => {
  const greenArmor = expandedArmorTypes.filter(
    (armorProps) => armorProps.key === green.armorType
  )[0];
  if (!greenArmor) {
    console.error("Unable to find green armor type; using monster armor");
  }
  const redArmor = expandedArmorTypes.filter(
    (armorProps) => armorProps.key === red.armorType
  )[0];
  if (!redArmor) {
    console.error("Unable to find green armor type; using monster armor");
  }
  const redToHit = getToHit(
    red.class,
    red.level,
    greenArmor?.armorType || null,
    green.armorClass,
    red.weapon
  );

  const greenToHit = getToHit(
    green.class,
    green.level,
    redArmor?.armorType || null,
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

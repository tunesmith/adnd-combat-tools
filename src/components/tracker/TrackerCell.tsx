import getToHit from "../../helpers/getToHit";
import { expandedArmorTypes } from "../../tables/armorType";
import type { TrackerCombatant } from "../../types/tracker";
import styles from "./tracker.module.css";

interface TrackerCellProps {
  rowCombatant: TrackerCombatant;
  columnCombatant: TrackerCombatant;
  value: string;
  onChange: (value: string) => void;
}

const TrackerCell = ({
  rowCombatant,
  columnCombatant,
  value,
  onChange,
}: TrackerCellProps) => {
  const rowTargetArmor = expandedArmorTypes.find(
    (armorProps) => armorProps.key === columnCombatant.armorType
  );
  const columnTargetArmor = expandedArmorTypes.find(
    (armorProps) => armorProps.key === rowCombatant.armorType
  );

  const rowToHit = getToHit(
    rowCombatant.class,
    rowCombatant.level,
    rowTargetArmor?.armorType || null,
    columnCombatant.armorClass,
    rowCombatant.weapon
  );
  const columnToHit = getToHit(
    columnCombatant.class,
    columnCombatant.level,
    columnTargetArmor?.armorType || null,
    rowCombatant.armorClass,
    columnCombatant.weapon
  );

  return (
    <td className={styles["interactionCell"]}>
      <div className={styles["cellShell"]}>
        <span className={styles["cellHintTop"]}>{rowToHit}</span>
        <span className={styles["cellHintBottom"]}>{columnToHit}</span>
        <input
          className={styles["cellInput"]}
          type={"text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </td>
  );
};

export default TrackerCell;

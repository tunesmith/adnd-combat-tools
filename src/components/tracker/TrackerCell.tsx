import getToHit from "../../helpers/getToHit";
import { expandedArmorTypes } from "../../tables/armorType";
import type { TrackerCombatant } from "../../types/tracker";
import styles from "./tracker.module.css";

interface TrackerCellProps {
  rowCombatant: TrackerCombatant;
  columnCombatant: TrackerCombatant;
  enemyToPartyValue: string;
  partyToEnemyValue: string;
  onEnemyToPartyChange: (value: string) => void;
  onPartyToEnemyChange: (value: string) => void;
}

const TrackerCell = ({
  rowCombatant,
  columnCombatant,
  enemyToPartyValue,
  partyToEnemyValue,
  onEnemyToPartyChange,
  onPartyToEnemyChange,
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
        <div className={styles["cellHalfEnemyInline"]}>
          <span className={styles["cellEntryLabel"]}>E {rowToHit}+</span>
          <input
            className={styles["cellEntryInputInline"]}
            type={"text"}
            value={enemyToPartyValue}
            onChange={(event) => onEnemyToPartyChange(event.target.value)}
          />
        </div>
        <div className={styles["cellDividerVertical"]} />
        <div className={styles["cellHalfPartyInline"]}>
          <input
            className={styles["cellEntryInputInline"]}
            type={"text"}
            value={partyToEnemyValue}
            onChange={(event) => onPartyToEnemyChange(event.target.value)}
          />
          <span className={styles["cellEntryLabel"]}>P {columnToHit}+</span>
        </div>
      </div>
    </td>
  );
};

export default TrackerCell;

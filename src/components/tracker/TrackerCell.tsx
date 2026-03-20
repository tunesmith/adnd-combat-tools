import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import getToHit from "../../helpers/getToHit";
import { expandedArmorTypes } from "../../tables/armorType";
import type { TrackerCombatant } from "../../types/tracker";
import styles from "./tracker.module.css";

interface TrackerCellProps {
  rowCombatant: TrackerCombatant;
  columnCombatant: TrackerCombatant;
  enemyToPartyValue: string;
  partyToEnemyValue: string;
  isVisible: boolean;
  onToggleVisibility: (value: boolean) => void;
  onEnemyToPartyChange: (value: string) => void;
  onPartyToEnemyChange: (value: string) => void;
  style?: CSSProperties;
}

const TrackerCell = ({
  rowCombatant,
  columnCombatant,
  enemyToPartyValue,
  partyToEnemyValue,
  isVisible,
  onToggleVisibility,
  onEnemyToPartyChange,
  onPartyToEnemyChange,
  style,
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
  const cellHasContent = Boolean(
    enemyToPartyValue.trim() || partyToEnemyValue.trim()
  );
  const isToggleEnabled = !isVisible || !cellHasContent;

  const handleToggle = () => {
    if (!isToggleEnabled) {
      return;
    }

    onToggleVisibility(!isVisible);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTableCellElement>) => {
    if (!isToggleEnabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <td
      className={
        [
          styles["interactionCell"],
          !isVisible ? styles["interactionCellCollapsed"] : "",
          isToggleEnabled ? styles["interactionCellToggleable"] : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
      style={style}
      onClick={isToggleEnabled ? handleToggle : undefined}
      onKeyDown={isToggleEnabled ? handleKeyDown : undefined}
      tabIndex={isToggleEnabled ? 0 : undefined}
      role={isToggleEnabled ? "button" : undefined}
      aria-label={
        isToggleEnabled
          ? isVisible
            ? "Hide empty matchup cell"
            : "Show matchup cell"
          : undefined
      }
    >
      {isVisible ? (
        <div className={styles["cellShell"]}>
          <div className={styles["cellHalfEnemyInline"]}>
            <span className={styles["cellEntryLabel"]}>{rowToHit}</span>
            <input
              className={styles["cellEntryInputInline"]}
              type={"text"}
              value={enemyToPartyValue}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onChange={(event) => onEnemyToPartyChange(event.target.value)}
            />
          </div>
          <div className={styles["cellDividerVertical"]} />
          <div className={styles["cellHalfPartyInline"]}>
            <span className={styles["cellEntryLabel"]}>{columnToHit}</span>
            <input
              className={styles["cellEntryInputInline"]}
              type={"text"}
              value={partyToEnemyValue}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onChange={(event) => onPartyToEnemyChange(event.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className={styles["cellShellCollapsed"]} />
      )}
    </td>
  );
};

export default TrackerCell;

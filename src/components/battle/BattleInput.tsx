import { attackerClassOptions, classMap } from "../../tables/attackerClass";
import { Dispatch, useRef, useState } from "react";
import { getTableByCombatClass } from "../../tables/combatLevel";
import { getWeaponOptions } from "../../tables/weapon";
import {
  expandedArmorTypes,
  getExpandedArmorOptionsByClass,
} from "../../tables/armorType";
import styles from "./battleInput.module.css";
import BattleModal from "./BattleModal";
import {
  CHANGE_CREATURE,
  DELETE_COLUMN,
  DELETE_ROW,
} from "../../helpers/BattleMessage";

interface BattleInputStructure {
  type: number;
  row: number;
  col: number;
  creature?: {
    key: number;
    name: string;
    class: string;
    level: string;
    armorType: number;
    armorClass: number;
    weapon: number;
  };
}

interface BattleInputProps {
  row: number;
  col: number;
  creature: {
    key: number;
    name: string;
    class: string;
    level: string;
    armorType: number;
    armorClass: number;
    weapon: number;
  };
  dispatch: Dispatch<BattleInputStructure>;
}
const BattleInput = ({ row, col, creature, dispatch }: BattleInputProps) => {
  const [creatureName, setCreatureName] = useState<string>(creature.name);
  // console.log(`rendering creature for row ${row}, col ${col}: `, creature);
  const [creatureClass, setCreatureClass] = useState<string>(creature.class);
  const prevCreatureClass = useRef<string>(creature.class);
  const [level, setLevel] = useState<string>(creature.level);
  const [levelOptions, setLevelOptions] = useState(
    getTableByCombatClass(
      creature.class === "monster" ? "monster" : classMap[creature.class]
    )
  );
  const [weaponOptions, setWeaponOptions] = useState(
    getWeaponOptions(creature.class)
  );
  const [weapon, setWeapon] = useState<number>(creature.weapon);
  const [armorTypeOptions, setArmorTypeOptions] = useState(
    getExpandedArmorOptionsByClass(creatureClass)
  );
  const [armorType, setArmorType] = useState<number>(creature.armorType);
  const armorClassOptions = useRef(
    [...Array(21)].map((_, i) => {
      return { value: 10 - i, label: `AC ${10 - i}` };
    })
  );
  const [armorClass, setArmorClass] = useState<number>(creature.armorClass);

  /**
   * Modal logic
   */
  const [open, setOpen] = useState(false);

  const handleCreatureName = (event) => {
    setCreatureName(event.target.value);
    dispatch({
      type: CHANGE_CREATURE,
      row,
      col,
      creature: {
        key: creature.key,
        name: event.target.value,
        class: creatureClass,
        level: level,
        armorType: armorType,
        armorClass: armorClass,
        weapon: weapon,
      },
    });
  };

  const handleCreatureClass = (event) => {
    const newCreatureClass = event.value;
    if (newCreatureClass !== prevCreatureClass.current) {
      setCreatureClass(newCreatureClass);
      const newLevelOptions = getTableByCombatClass(
        newCreatureClass === "monster" ? "monster" : classMap[newCreatureClass]
      );
      setLevelOptions(newLevelOptions);

      setLevel("1");

      const newArmorTypeOptions =
        getExpandedArmorOptionsByClass(newCreatureClass);
      setArmorTypeOptions(newArmorTypeOptions);
      const newArmorType = newArmorTypeOptions[0].value;
      setArmorType(newArmorType);

      const newArmorClass = newArmorType ? newArmorType : armorClass;
      setArmorClass(newArmorClass);

      const newWeaponOptions = getWeaponOptions(newCreatureClass);
      setWeaponOptions(newWeaponOptions);
      const newWeapon = newWeaponOptions[0].value;
      setWeapon(newWeapon);

      prevCreatureClass.current = newCreatureClass;

      dispatch({
        type: CHANGE_CREATURE,
        row,
        col,
        creature: {
          key: creature.key,
          name: creatureName,
          class: newCreatureClass,
          level: "1",
          armorType: newArmorTypeOptions[0].value,
          armorClass: newArmorTypeOptions[0].value
            ? newArmorTypeOptions[0].value
            : armorClass,
          weapon: newWeapon,
        },
      });
    }
  };

  const handleLevel = (event) => {
    setLevel(event.value);
    dispatch({
      type: CHANGE_CREATURE,
      row,
      col,
      creature: {
        key: creature.key,
        name: creatureName,
        class: creatureClass,
        level: event.value,
        armorType: armorType,
        armorClass: armorClass,
        weapon: weapon,
      },
    });
  };

  const handleArmorType = (event) => {
    setArmorType(event.value);
    const derivedArmorClass = expandedArmorTypes.filter(
      (armorProps) => armorProps.key === event.value
    )[0].armorType;
    if (event.value) {
      setArmorClass(derivedArmorClass);
    }
    dispatch({
      type: CHANGE_CREATURE,
      row,
      col,
      creature: {
        key: creature.key,
        name: creatureName,
        class: creatureClass,
        level: level,
        armorType: event.value,
        armorClass: event.value ? derivedArmorClass : armorClass,
        weapon: weapon,
      },
    });
  };

  const handleArmorClass = (event) => {
    setArmorClass(event.value);
    dispatch({
      type: CHANGE_CREATURE,
      row,
      col,
      creature: {
        key: creature.key,
        name: creatureName,
        class: creatureClass,
        level: level,
        armorType: armorType,
        armorClass: event.value,
        weapon: weapon,
      },
    });
  };

  const handleWeapon = (event) => {
    setWeapon(event.value);
    dispatch({
      type: CHANGE_CREATURE,
      row,
      col,
      creature: {
        key: creature.key,
        name: creatureName,
        class: creatureClass,
        level: level,
        armorType: armorType,
        armorClass: armorClass,
        weapon: event.value,
      },
    });
  };

  return (
    <>
      <div className={styles["container"]}>
        <div className={styles["removeInput"]}>
          <button
            className={
              row < 1 ? styles["buttonRemoveColumn"] : styles["buttonRemoveRow"]
            }
            onClick={() =>
              dispatch(
                row < 1
                  ? { type: DELETE_COLUMN, row, col }
                  : { type: DELETE_ROW, row, col }
              )
            }
          >
            x
          </button>
        </div>
        <div
          // data-text={"click to edit"}
          className={
            row < 1 ? styles["battleInputColumn"] : styles["battleInputRow"]
          }
          onClick={() => {
            setOpen(true);
          }}
        >
          <div>
            {creatureName && (
              <>
                <span className={styles["creatureName"]}>{creatureName}</span>
                <br />
              </>
            )}
            {
              attackerClassOptions.filter(
                (option) => option.value === creatureClass
              )[0].label
            }
            : {creatureClass === "monster" ? <>HD </> : <>L</>}
            {level}
            <br />
            {armorType > 1 && (
              <>
                {
                  armorTypeOptions.filter(
                    (option) => option.value === armorType
                  )[0].label
                }
                <br />
              </>
            )}
            AC {armorClass}
            <br />
            {weaponOptions.filter((option) => option.value === weapon)[0].label}
          </div>
        </div>
        {open && (
          <BattleModal
            setOpen={setOpen}
            creatureName={creatureName}
            handleCreatureName={handleCreatureName}
            creatureClass={creatureClass}
            handleCreatureClass={handleCreatureClass}
            levelOptions={levelOptions}
            level={level}
            handleLevel={handleLevel}
            armorTypeOptions={armorTypeOptions}
            armorType={armorType}
            handleArmorType={handleArmorType}
            armorClassOptions={armorClassOptions}
            armorClass={armorClass}
            handleArmorClass={handleArmorClass}
            weaponOptions={weaponOptions}
            weapon={weapon}
            handleWeapon={handleWeapon}
            row={row}
          />
        )}
      </div>
    </>
  );
};

export default BattleInput;

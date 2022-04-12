import {
  attackerClassOptions,
  getGeneralClass,
} from "../../tables/attackerClass";
import React, { FocusEvent, Dispatch, useRef, useState } from "react";
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
import { SingleValue } from "react-select";
import {
  ArmorClassOption,
  ArmorTypeOption,
  CreatureOption,
  LevelOption,
  WeaponOption,
} from "./types";

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
  const [levelOptions, setLevelOptions] = useState<LevelOption[]>(
    getTableByCombatClass(
      creature.class === "monster" ? "monster" : getGeneralClass(creature.class)
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
  const armorClassOptions = useRef<ArmorClassOption[]>(
    [...Array(21)].map((_, i) => {
      return { value: 10 - i, label: `AC ${10 - i}` };
    })
  );
  const [armorClass, setArmorClass] = useState<number>(creature.armorClass);

  /**
   * Modal logic
   */
  const [open, setOpen] = useState<boolean>(false);

  const handleCreatureName = (event: FocusEvent<HTMLInputElement>) => {
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

  const getDerivedArmorClass = (armorTypeId: number): number =>
    expandedArmorTypes.filter((armorProps) => armorProps.key === armorTypeId)[0]
      ?.armorType || 10;

  const handleCreatureClass = (option: SingleValue<CreatureOption>) => {
    const newCreatureClass = option?.value;
    if (newCreatureClass) {
      if (newCreatureClass !== prevCreatureClass.current) {
        setCreatureClass(newCreatureClass);
        const newLevelOptions = getTableByCombatClass(
          newCreatureClass === "monster"
            ? "monster"
            : getGeneralClass(newCreatureClass)
        );
        setLevelOptions(newLevelOptions);

        setLevel("1");

        const newArmorTypeOptions =
          getExpandedArmorOptionsByClass(newCreatureClass);
        setArmorTypeOptions(newArmorTypeOptions);
        const newArmorType = newArmorTypeOptions[0].value;
        setArmorType(newArmorType);

        setArmorClass(getDerivedArmorClass(newArmorType));

        const newWeaponOptions = getWeaponOptions(newCreatureClass);
        setWeaponOptions(newWeaponOptions);
        const newWeapon = newWeaponOptions[0]?.value;
        if (newWeapon) {
          setWeapon(newWeapon);
        } else {
          console.error(
            `Unable to load new weapon, using previous weapon: ${weapon}`
          );
        }

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
            weapon: newWeapon || weapon,
          },
        });
      }
    } else {
      console.error("Could not switch creature class");
    }
  };

  const handleLevel = (
    option: SingleValue<{ label: string; value: string }>
  ) => {
    const newLevel = option?.value;
    if (newLevel) {
      setLevel(newLevel);
      dispatch({
        type: CHANGE_CREATURE,
        row,
        col,
        creature: {
          key: creature.key,
          name: creatureName,
          class: creatureClass,
          level: newLevel,
          armorType: armorType,
          armorClass: armorClass,
          weapon: weapon,
        },
      });
    } else {
      console.error("could not switch to new level");
    }
  };

  const handleArmorType = (option: SingleValue<ArmorTypeOption>) => {
    const newArmorType = option?.value;
    if (newArmorType) {
      setArmorType(newArmorType);
      // When picking a new armor type, set the armor class accordingly... this may prove bothersome though
      const derivedArmorClass = getDerivedArmorClass(newArmorType);
      setArmorClass(derivedArmorClass);
      dispatch({
        type: CHANGE_CREATURE,
        row,
        col,
        creature: {
          key: creature.key,
          name: creatureName,
          class: creatureClass,
          level: level,
          armorType: newArmorType,
          armorClass: derivedArmorClass,
          weapon: weapon,
        },
      });
    } else {
      console.error("Could not switch to new armor type");
    }
  };

  const handleArmorClass = (option: SingleValue<ArmorClassOption>) => {
    const newArmorClass = option?.value;
    if (newArmorClass) {
      setArmorClass(newArmorClass);
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
          armorClass: newArmorClass,
          weapon: weapon,
        },
      });
    } else {
      console.error("Could not switch to new armor class");
    }
  };

  const handleWeapon = (option: SingleValue<WeaponOption>) => {
    const newWeapon = option?.value;
    if (newWeapon) {
      setWeapon(newWeapon);
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
          weapon: newWeapon,
        },
      });
    } else {
      console.error(`Could not select new weapon`);
    }
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
            {attackerClassOptions.filter(
              (option) => option.value === creatureClass
            )[0]?.label || "(No class selected)"}
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
            {weaponOptions.filter((option) => option.value === weapon)[0]
              ?.label || "(No weapon selected"}
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

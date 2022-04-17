import {
  attackerClassOptions,
  BARD,
  getGeneralClass,
  MONSTER,
} from "../../tables/attackerClass";
import React, { FocusEvent, Dispatch, useRef, useState } from "react";
import {
  getLevelOptionsByCombatClass,
  monsterLevels,
} from "../../tables/combatLevel";
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
  ExpandedArmorTypeOption,
  CreatureOption,
  LevelOption,
  WeaponOption,
} from "../../types/option";
import { Creature } from "../../types/creature";
import { ReducerAction } from "./Battle";

interface BattleInputProps {
  row: number;
  col: number;
  creature: Creature;
  dispatch: Dispatch<ReducerAction>;
}
const BattleInput = ({ row, col, creature, dispatch }: BattleInputProps) => {
  const [creatureName, setCreatureName] = useState<string | undefined>(
    creature.name
  );
  // console.log(`rendering creature for row ${row}, col ${col}: `, creature);
  const [creatureClass, setCreatureClass] = useState<number>(creature.class);
  const prevCreatureClass = useRef<number>(creature.class);
  const [level, setLevel] = useState<number>(creature.level);
  const [levelOptions, setLevelOptions] = useState<LevelOption[]>(
    getLevelOptionsByCombatClass(
      creature.class === MONSTER ? MONSTER : getGeneralClass(creature.class)
    )
  );
  const [weaponOptions, setWeaponOptions] = useState<WeaponOption[]>(
    getWeaponOptions(creature.class)
  );
  const [weapon, setWeapon] = useState<number>(creature.weapon);
  const [armorTypeOptions, setArmorTypeOptions] = useState<
    ExpandedArmorTypeOption[]
  >(getExpandedArmorOptionsByClass(creatureClass));
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
        const newLevelOptions = getLevelOptionsByCombatClass(
          newCreatureClass === MONSTER
            ? MONSTER
            : getGeneralClass(newCreatureClass)
        );
        setLevelOptions(newLevelOptions);

        setLevel(newCreatureClass === MONSTER ? 3 : 1);

        const newArmorTypeOptions =
          getExpandedArmorOptionsByClass(newCreatureClass);
        setArmorTypeOptions(newArmorTypeOptions);
        const newArmorType = newArmorTypeOptions[0]?.value;
        if (newArmorType) {
          setArmorType(newArmorType);
          setArmorClass(getDerivedArmorClass(newArmorType));
        } else {
          console.error(
            `Unable to set new armor type or armor class for new creature class: ${newCreatureClass}`
          );
        }

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
            level: newCreatureClass === MONSTER ? 3 : 1,
            armorType: newArmorType || armorType,
            armorClass: newArmorType
              ? getDerivedArmorClass(newArmorType)
              : armorClass,
            weapon: newWeapon || weapon,
          },
        });
      }
    } else {
      console.error("Could not switch creature class");
    }
  };

  const handleLevel = (option: SingleValue<LevelOption>) => {
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

  const handleArmorType = (option: SingleValue<ExpandedArmorTypeOption>) => {
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
    if (newArmorClass || newArmorClass === 0) {
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

  const armorLabel = armorTypeOptions.filter(
    (option: ExpandedArmorTypeOption) => option.value === armorType
  )[0]?.label;

  if (!armorLabel) {
    console.error(`Could not find armor label for armor type: ${armorType}`);
  }

  const levelLabel =
    creatureClass === MONSTER ? monsterLevels.get(level)?.label : `${level}`;
  if (!levelLabel) {
    console.log(levelOptions);
    console.error(`Could not find level label where value is: ${level}`);
  }

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
            {levelLabel && (
              <>
                :{" "}
                {creatureClass === MONSTER ? (
                  <>HD </>
                ) : creatureClass === BARD ? (
                  <>F</>
                ) : (
                  <>L</>
                )}
                {levelLabel}
              </>
            )}
            <br />
            {armorType > 1 && armorLabel && (
              <>
                {armorLabel}
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

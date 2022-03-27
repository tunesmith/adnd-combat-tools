import Select from "react-select";
import { attackerClassOptions, classMap } from "../../tables/attackerClass";
import { Dispatch, useEffect, useMemo, useRef, useState } from "react";
import { getTableByCombatClass } from "../../tables/combatLevel";
import { getWeaponOptions } from "../../tables/weapon";
import { getArmorOptions } from "../../tables/armorType";
import customStyles from "../../helpers/selectCustomStyles";

interface BattleInputStructure {
  row: number;
  col: number;
  creature: {
    class: string;
    level: string;
    armorType: string;
    armorClass: number;
    weapon: string;
  };
}

interface BattleInputProps {
  row: number;
  col: number;
  creature: {
    class: string;
    level: string;
    armorType: string;
    armorClass: number;
    weapon: string;
  };
  dispatch: Dispatch<BattleInputStructure>;
}
const BattleInput = ({ row, col, creature, dispatch }: BattleInputProps) => {
  console.log(`row: ${row}, col: ${col}`);
  const [attackerClass, setAttackerClass] = useState<string>(creature.class);
  const prevAttackerClass = useRef<string>(creature.class);
  const [attackerLevel, setAttackerLevel] = useState<string>(creature.level);
  const [attackerLevelOptions, setAttackerLevelOptions] = useState(
    getTableByCombatClass(creature.class)
  );
  const [weaponOptions, setWeaponOptions] = useState(
    getWeaponOptions(creature.class)
  );
  const [attackerWeapon, setAttackerWeapon] = useState<string>(
    weaponOptions[0].value
  );
  const [armorTypeOptions, setArmorTypeOptions] = useState(getArmorOptions);
  const [targetArmorType, setTargetArmorType] = useState<string>(
    armorTypeOptions[0].value
  );
  const armorClassOptions = useRef(
    [...Array(21)].map((v, i) => {
      return { value: 10 - i, label: `AC ${10 - i}` };
    })
  );
  const [targetArmorClass, setTargetArmorClass] = useState<number>(
    creature.armorClass
  );

  const handleAttackerClass = (event) => {
    const newAttackerClass = event.value;
    if (newAttackerClass !== prevAttackerClass.current) {
      setAttackerClass(event.value);
      const newAttackerLevelOptions = getTableByCombatClass(
        event.value === "monster" ? "monster" : classMap[event.value]
      );
      setAttackerLevelOptions(newAttackerLevelOptions);
      setAttackerLevel("1");
      const newWeaponOptions = getWeaponOptions(event.value);
      setWeaponOptions(newWeaponOptions);
      setAttackerWeapon(newWeaponOptions[0].value);
      const newArmorTypeOptions = getArmorOptions;
      setArmorTypeOptions(newArmorTypeOptions);
      setTargetArmorType(newArmorTypeOptions[0].value);
      prevAttackerClass.current = newAttackerClass;

      dispatch({
        row,
        col,
        creature: {
          class: newAttackerClass,
          level: "1",
          armorType: newArmorTypeOptions[0].value,
          armorClass: targetArmorClass,
          weapon: newWeaponOptions[0].value,
        },
      });
    }
  };

  const handleAttackerLevel = (event) => {
    setAttackerLevel(event.value);
    dispatch({
      row,
      col,
      creature: {
        class: attackerClass,
        level: event.value,
        armorType: targetArmorType,
        armorClass: targetArmorClass,
        weapon: attackerWeapon,
      },
    });
  };

  const handleArmorType = (event) => {
    setTargetArmorType(event.value);
    if (event.value.trim()) {
      setTargetArmorClass(parseInt(event.value, 10));
    }
    dispatch({
      row,
      col,
      creature: {
        class: attackerClass,
        level: attackerLevel,
        armorType: event.value,
        armorClass: event.value.trim()
          ? parseInt(event.value, 10)
          : targetArmorClass,
        weapon: attackerWeapon,
      },
    });
  };

  const handleArmorClass = (event) => {
    setTargetArmorClass(event.value);
    dispatch({
      row,
      col,
      creature: {
        class: attackerClass,
        level: attackerLevel,
        armorType: targetArmorType,
        armorClass: event.value,
        weapon: attackerWeapon,
      },
    });
  };

  const handleAttackerWeapon = (event) => {
    setAttackerWeapon(event.value);
    dispatch({
      row,
      col,
      creature: {
        class: attackerClass,
        level: attackerLevel,
        armorType: targetArmorType,
        armorClass: targetArmorClass,
        weapon: event.value,
      },
    });
  };

  return (
    <>
      <label>
        <Select
          isSearchable={false}
          instanceId={"attackerClass"}
          styles={customStyles}
          value={attackerClassOptions.filter(
            (option) => option.value === attackerClass
          )}
          options={attackerClassOptions}
          onChange={handleAttackerClass}
        />
      </label>
      <br />
      <label>
        <Select
          isSearchable={false}
          instanceId={"attackerLevel"}
          styles={customStyles}
          value={attackerLevelOptions.filter(
            (option) => option.value === attackerLevel
          )}
          options={attackerLevelOptions}
          onChange={handleAttackerLevel}
        />
      </label>
      <br />
      <label>
        <Select
          isSearchable={false}
          instanceId={"targetArmorType"}
          styles={customStyles}
          value={armorTypeOptions.filter(
            (option) => option.value === targetArmorType
          )}
          options={armorTypeOptions}
          onChange={handleArmorType}
        />
      </label>
      <br />
      <label>
        <Select
          isSearchable={false}
          instanceId={"targetArmorClass"}
          styles={customStyles}
          value={armorClassOptions.current.filter(
            (option) => option.value === targetArmorClass
          )}
          options={armorClassOptions.current}
          onChange={handleArmorClass}
        />
      </label>
      <br />
      <label>
        <Select
          isSearchable={false}
          instanceId={"attackerWeapon"}
          styles={customStyles}
          value={weaponOptions.filter(
            (option) => option.value === attackerWeapon
          )}
          options={weaponOptions}
          onChange={handleAttackerWeapon}
        />
      </label>
    </>
  );
};

export default BattleInput;

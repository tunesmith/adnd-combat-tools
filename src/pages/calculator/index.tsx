import { useEffect, useReducer, useRef, useState } from "react";
import Select from "react-select";
import attackerClassOptions, { classMap } from "../../tables/attackerClass";
import {
  getTableByCombatClass,
  getThac,
  getThaco,
} from "../../tables/combatLevel";
import { getWeaponAdjustment, getWeaponOptions } from "../../tables/weapon";
import { getArmorOptions } from "../../tables/armorType";

const Calculator = () => {
  const [targetArmorClass, setTargetArmorClass] = useState<number>(10);
  const [attackerClass, setAttackerClass] = useState<string>("monster");
  const prevAttackerClass = useRef<string>("monster");
  const [attackerLevelOptions, setAttackerLevelOptions] = useState(
    getTableByCombatClass("monster")
  );
  const [weaponOptions, setWeaponOptions] = useState(
    getWeaponOptions("monster")
  );
  const [armorTypeOptions, setArmorTypeOptions] = useState(getArmorOptions);
  const [targetArmorType, setTargetArmorType] = useState<string>(
    armorTypeOptions[0].value
  );

  const armorClassOptions = useRef(
    [...Array(21)].map((v, i) => {
      return { value: 10 - i, label: 10 - i };
    })
  );
  const [attackerLevel, setAttackerLevel] = useState<string>("1");
  const [attackerWeapon, setAttackerWeapon] = useState<string>(
    weaponOptions[0].value
  );

  const [toHit, setToHit] = useState<number | undefined>(undefined);

  const handleArmorClass = (event) => {
    setTargetArmorClass(event.value);
  };

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
    }
  };

  const handleArmorType = (event) => {
    setTargetArmorType(event.value);
  };
  const handleAttackerLevel = (event) => {
    setAttackerLevel(event.value);
  };

  const handleAttackerWeapon = (event) => {
    setAttackerWeapon(event.value);
  };

  useEffect(() => {
    console.log("=~=~=~ re-calculating ~=~=~=");
    const thaco = getThaco(
      attackerClass === "monster" ? "monster" : classMap[attackerClass],
      attackerLevel
    );
    console.log(`thaco: ${thaco}`);
    const thac = getThac(targetArmorClass, thaco);
    console.log(`thac: ${thac}`);
    const adjustment = targetArmorType.trim()
      ? getWeaponAdjustment(attackerWeapon, targetArmorType)
      : 0;
    console.log(`adj: ${adjustment}`);
    setToHit(thac - adjustment);
  }, [
    attackerClass,
    attackerLevel,
    attackerWeapon,
    targetArmorType,
    targetArmorClass,
  ]);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  /**
   * TODO:
   *  - Styling
   */
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Class of Attacker:
        <Select
          instanceId={"attackerClass"}
          value={attackerClassOptions.filter(
            (option) => option.value === attackerClass
          )}
          options={attackerClassOptions}
          onChange={handleAttackerClass}
        />
      </label>
      <br />
      <label>
        Attacker {attackerClass === "monster" ? "Hit Dice" : "Level"}:
        <Select
          instanceId={"attackerLevel"}
          value={attackerLevelOptions.filter(
            (option) => option.value === attackerLevel
          )}
          options={attackerLevelOptions}
          onChange={handleAttackerLevel}
        />
      </label>
      <br />
      <label>
        Attacker Weapon:
        <Select
          instanceId={"attackerWeapon"}
          value={weaponOptions.filter(
            (option) => option.value === attackerWeapon
          )}
          options={weaponOptions}
          onChange={handleAttackerWeapon}
        />
      </label>
      <br />
      <label>
        Target Armor Type:
        <Select
          instanceId={"targetArmorType"}
          value={armorTypeOptions.filter(
            (option) => option.value === targetArmorType
          )}
          options={armorTypeOptions}
          onChange={handleArmorType}
        />
      </label>
      <br />
      <label>
        Target AC:
        <Select
          instanceId={"targetArmorClass"}
          value={armorClassOptions.current.filter(
            (option) => option.value === targetArmorClass
          )}
          options={armorClassOptions.current}
          onChange={handleArmorClass}
        />
      </label>
      <br />
      {toHit && <div>To Hit: {toHit}</div>}
    </form>
  );
};

export default Calculator;

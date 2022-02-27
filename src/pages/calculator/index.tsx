import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import attackerClassOptions, { classMap } from "../../tables/attackerClass";
import {
  getTableByCombatClass,
  getThac,
  getThaco,
} from "../../tables/combatLevel";
import { getWeaponAdjustment, getWeaponOptions } from "../../tables/weapon";
import { getArmorOptions } from "../../tables/armorType";
import styles from "./calculator.module.css";

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
    if (event.value.trim()) {
      setTargetArmorClass(parseInt(event.value, 10));
    }
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

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "#F0EFDD",
    }),

    option: (provided, state) => {
      // console.log(provided);
      return {
        ...provided,
        backgroundColor: "#F0EFDD",
        color: "black",
      };
    },
  };

  /**
   * TODO:
   *  - Styling
   */
  return (
    <div className={styles.outerContainer}>
      <div className={styles.title}>AD&D Combat Calculator</div>
      <div className={styles.calcContainer}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <label>
              Class of Attacker:
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
              Attacker {attackerClass === "monster" ? "Hit Dice" : "Level"}:
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
              Attacker Weapon:
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
            <br />
            <label>
              Target Armor Type:
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
              Target AC:
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
          </form>
        </div>
        <div className={styles.toHitContainer}>
          {toHit && (
            <div className={styles.toHitBox}>
              <div>To Hit:</div>
              <div className={styles.toHit}>{toHit}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;

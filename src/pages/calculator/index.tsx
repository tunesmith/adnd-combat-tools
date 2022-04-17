import { FormEvent, useEffect, useRef, useState } from "react";
import Select, { SingleValue } from "react-select";
import {
  attackerClassOptions,
  getGeneralClass,
  MONSTER,
} from "../../tables/attackerClass";
import { getLevelOptionsByCombatClass } from "../../tables/combatLevel";
import { getWeaponOptions } from "../../tables/weapon";
import { getArmorOptions } from "../../tables/armorType";
import styles from "./calculator.module.css";
import customStyles from "../../helpers/selectCustomStyles";
import getToHit from "../../helpers/getToHit";
import { ArmorTypeOption, LevelOption, WeaponOption } from "../../types/option";

const Calculator = () => {
  const [targetArmorClass, setTargetArmorClass] = useState<number>(10);
  const [attackerClass, setAttackerClass] = useState<string>("monster");
  const prevAttackerClass = useRef<string>("monster");
  const [attackerLevelOptions, setAttackerLevelOptions] = useState(
    getLevelOptionsByCombatClass(MONSTER)
  );
  const [weaponOptions, setWeaponOptions] = useState(
    getWeaponOptions("monster")
  );
  const [armorTypeOptions, setArmorTypeOptions] = useState(getArmorOptions);
  const [targetArmorType, setTargetArmorType] = useState<string>(
    armorTypeOptions[0]!.value
  );

  const armorClassOptions = useRef(
    [...Array(21)].map((_, i) => {
      return { value: 10 - i, label: 10 - i };
    })
  );
  const [attackerLevel, setAttackerLevel] = useState<string>("1");
  const [attackerWeapon, setAttackerWeapon] = useState<number>(
    weaponOptions[0]!.value
  );

  const [toHit, setToHit] = useState<number | undefined>(undefined);

  const handleArmorClass = (
    option: SingleValue<{ label: number; value: number }>
  ) => {
    if (option?.value) {
      setTargetArmorClass(option.value);
    }
  };

  const handleAttackerClass = (
    option: SingleValue<{ label: string; value: string }>
  ) => {
    const newAttackerClass = option?.value;
    if (newAttackerClass && newAttackerClass !== prevAttackerClass.current) {
      setAttackerClass(newAttackerClass);
      const newAttackerLevelOptions = getLevelOptionsByCombatClass(
        newAttackerClass === "monster"
          ? MONSTER
          : getGeneralClass(newAttackerClass)
      );
      setAttackerLevelOptions(newAttackerLevelOptions);
      setAttackerLevel("1");
      const newWeaponOptions = getWeaponOptions(newAttackerClass);
      setWeaponOptions(newWeaponOptions);
      if (newWeaponOptions[0]) {
        setAttackerWeapon(newWeaponOptions[0]?.value);
      } else {
        console.error("Unable to set new weapon, retaining old weapon");
      }
      const newArmorTypeOptions = getArmorOptions;
      setArmorTypeOptions(newArmorTypeOptions);
      if (newArmorTypeOptions[0]) {
        setTargetArmorType(newArmorTypeOptions[0].value);
      } else {
        console.error("Unable to set new armor type, retaining old armor type");
      }
      prevAttackerClass.current = newAttackerClass;
    }
  };

  const handleArmorType = (option: SingleValue<ArmorTypeOption>) => {
    const newArmorType = option?.value;
    if (newArmorType) {
      setTargetArmorType(newArmorType);
      if (newArmorType.trim()) {
        setTargetArmorClass(parseInt(newArmorType, 10));
      }
    }
  };
  const handleAttackerLevel = (option: SingleValue<LevelOption>) => {
    const newLevel = option?.value;
    if (newLevel) {
      setAttackerLevel(newLevel);
    } else {
      console.error("Could not set new level.");
    }
  };

  const handleAttackerWeapon = (option: SingleValue<WeaponOption>) => {
    const newWeapon = option?.value;
    if (newWeapon) {
      setAttackerWeapon(newWeapon);
    } else {
      console.error("Could not set new weapon.");
    }
  };

  useEffect(() => {
    setToHit(
      getToHit(
        attackerClass,
        attackerLevel,
        targetArmorType.trim() ? parseInt(targetArmorType, 10) : null,
        targetArmorClass,
        attackerWeapon
      )
    );
  }, [
    attackerClass,
    attackerLevel,
    targetArmorType,
    targetArmorClass,
    attackerWeapon,
  ]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className={styles["outerContainer"]}>
      <div className={styles["title"]}>AD&D Combat Calculator</div>
      <div className={styles["calcContainer"]}>
        <div className={styles["formContainer"]}>
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
        <div className={styles["toHitContainer"]}>
          {(toHit || toHit === 0) && (
            <div className={styles["toHitBox"]}>
              <div>To Hit:</div>
              <div className={styles["toHit"]}>{toHit}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;

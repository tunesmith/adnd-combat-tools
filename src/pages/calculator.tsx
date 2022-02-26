import { useEffect, useState } from "react";
import Select from "react-select";
import armorOptions from "../tables/armorType";
import attackerClassOptions, { classMap } from "../tables/attackerClass";
import { getTableByCombatClass } from "../tables/combatLevel";
import { weaponOptions } from "../tables/weapon";

const Calculator = () => {
  const [targetArmorClass, setTargetArmorClass] = useState<number>(10);
  const [targetArmorType, setTargetArmorType] = useState<string>("");
  const [attackerClass, setAttackerClass] = useState<string>("monster");
  const [attackerLevelOptions, setAttackerLevelOptions] = useState(
    getTableByCombatClass("monster")
  );
  const [attackerLevel, setAttackerLevel] = useState<string>("1");
  const [attackerWeapon, setAttackerWeapon] =
    useState<string>("None (Monster)");

  // console.log(attackerLevelOptions);

  // const handleChange = (event) => {
  //   const name = event.target.name;
  //   const value = event.target.value;
  //   setInputs((values) => ({ ...values, [name]: value }));
  // };

  const handleArmorClass = (event) => {
    setTargetArmorClass(event.target.value);
  };

  const handleAttackerClass = (event) => {
    setAttackerClass(event.value);
    const newAttackerLevelOptions = getTableByCombatClass(
      event.value === "monster" ? "monster" : classMap[event.value]
    );
    console.log(newAttackerLevelOptions);
    setAttackerLevelOptions(newAttackerLevelOptions);
    setAttackerLevel("1");
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

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  // useEffect(() => {
  //   console.log(`gonna get class for new attacker class: ${attackerClass}`);
  //   setAttackerLevelOptions(getTableByCombatClass(attackerClass));
  // }, [attackerClass]);

  /**
   * TODO:
   *  - Maybe even make weapon list dependent on attacker class
   *  - Start looking up thaco and doing calculations
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
        Attacker Level:
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
          value={armorOptions.filter(
            (option) => option.value === targetArmorType
          )}
          options={armorOptions}
          onChange={handleArmorType}
        />
      </label>
      <br />
      <label>
        Target AC:
        <input
          type="number"
          name="targetArmorClass"
          value={targetArmorClass}
          onChange={handleArmorClass}
        />
      </label>
    </form>
  );
};

export default Calculator;

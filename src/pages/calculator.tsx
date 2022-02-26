import { useState } from "react";
import Select from "react-select";
import attackerClassOptions, { classMap } from "../tables/attackerClass";
import { getTableByCombatClass } from "../tables/combatLevel";
import { getWeaponOptions } from "../tables/weapon";
import { getArmorOptions } from "../tables/armorType";

const Calculator = () => {
  console.log("rendering...");
  const [targetArmorClass, setTargetArmorClass] = useState<number>(10);
  const [attackerClass, setAttackerClass] = useState<string>("monster");
  const [attackerLevelOptions, setAttackerLevelOptions] = useState(
    getTableByCombatClass("monster")
  );
  const [weaponOptions, setWeaponOptions] = useState(
    getWeaponOptions("monster")
  );
  const [armorTypeOptions, setArmorTypeOptions] = useState(
    getArmorOptions("monster")
  );
  const [targetArmorType, setTargetArmorType] = useState<string>(
    armorTypeOptions[0].value
  );

  const [attackerLevel, setAttackerLevel] = useState<string>("1");
  const [attackerWeapon, setAttackerWeapon] = useState<string>(
    weaponOptions[0].value
  );

  const handleArmorClass = (event) => {
    setTargetArmorClass(event.target.value);
  };

  const handleAttackerClass = (event) => {
    setAttackerClass(event.value);
    const newAttackerLevelOptions = getTableByCombatClass(
      event.value === "monster" ? "monster" : classMap[event.value]
    );
    setAttackerLevelOptions(newAttackerLevelOptions);
    setAttackerLevel("1");
    const newWeaponOptions = getWeaponOptions(event.value);
    setWeaponOptions(newWeaponOptions);
    setAttackerWeapon(newWeaponOptions[0].value);
    const newArmorTypeOptions = getArmorOptions(event.value);
    setArmorTypeOptions(newArmorTypeOptions);
    setTargetArmorType(newArmorTypeOptions[0].value);
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

  /**
   * TODO:
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

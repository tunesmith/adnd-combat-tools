import { useState } from "react";
import Select from "react-select";
import armorOptions from "../tables/armorType";
import combatClassOptions from "../tables/combatClass";
import { getTableByCombatClass } from "../tables/combatLevel";

const Calculator = () => {
  const [inputs, setInputs] = useState<{
    targetArmorClass: number;
    targetArmorType: number;
  }>();

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setInputs((values) => ({ ...values, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert(inputs);
  };

  const monsterOptions = getTableByCombatClass("monster");

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Target AC:
        <input
          type="number"
          name="targetArmorClass"
          value={inputs?.targetArmorClass || ""}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Target Armor Type:
        <Select options={armorOptions} />
      </label>
      <br />
      <label>
        Class of Attacker:
        <Select options={combatClassOptions} />
      </label>
      <br />
      <label>
        Attacker Level:
        <Select options={monsterOptions} />
      </label>
    </form>
  );
};

export default Calculator;

import { useState } from "react";
import Select from "react-select";
import armorOptions from "../tables/armorType";

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
      <label>
        Target Armor Type:
        <Select options={armorOptions} />
      </label>
      <input type="submit" />
    </form>
  );
};

export default Calculator;

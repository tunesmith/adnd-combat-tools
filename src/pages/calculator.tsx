import {useState} from "react";

const Calculator = () => {
    const [inputs, setInputs] = useState<{
        targetArmorClass: number;
        targetArmorType: number
    } >();

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setInputs(values => ({...values, [name]: value}))
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        alert(inputs);
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>Target AC:
                <input
                    type="number"
                    name="targetArmorClass"
                    value={inputs?.targetArmorClass || ""}
                    onChange={handleChange}
                />
            </label>
            <label>Target Armor Type:
                <select value={inputs?.targetArmorType} onChange={handleChange}>
                    <option value="10">10 - No Armor</option>
                    <option value="9">9 - Shield only</option>
                    <option value="8">8 - Leather or padded armor</option>
                    <option value="7">7 - Leather or padded armor + shield / studded leather / ring mail</option>
                    <option value="6">6 - Studded leather or ring mail + shield / scale mail</option>
                    <option value="5">5 - Scale mail + shield / chain mail</option>
                    <option value="4">4 - Chain mail + shield / splint mail / banded mail</option>
                    <option value="3">3 - Splint or banded mail + shield / plate mail</option>
                    <option value="2">2 - Plate mail + shield</option>
                </select>
            </label>
            <input type="submit" />
        </form>
    )
}

export default Calculator;

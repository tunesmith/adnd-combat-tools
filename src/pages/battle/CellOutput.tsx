import getToHit from "../../helpers/getToHit";

const CellOutput = ({ red, green }) => {
  // console.log("rendering cell... ");
  // console.log("cell red: ");
  // console.log(red);
  // console.log("cell green: ");
  // console.log(green);
  const redToHit = getToHit(
    red.class,
    red.level,
    green.armorType,
    green.armorClass,
    red.weapon
  );

  const greenToHit = getToHit(
    green.class,
    green.level,
    red.armorType,
    red.armorClass,
    green.weapon
  );

  return (
    <div>
      {redToHit}, {greenToHit}
    </div>
  );
};

export default CellOutput;

const monsterArmor = [" "];
const druidArmor = ["10", "9", "8", "7"];
const magicuserArmor = ["10"];
const thiefArmor = ["10", "8"];
const assassinArmor = ["10", "9", "8", "7"];
const bardArmor = ["10", "8", "5"];

const armorTypes = {
  " ": "Natural Armor (Monster)",
  10: "10 - No Armor",
  9: "9 - Shield only",
  8: "8 - Leather or padded armor",
  7: "7 - Leather or padded armor + shield / studded leather / ring mail",
  6: "6 - Studded leather or ring mail + shield / scale mail",
  5: "5 - Scale mail + shield / chain mail",
  4: "4 - Chain mail + shield / splint mail / banded mail",
  3: "3 - Splint or banded mail + shield / plate mail",
  2: "2 - Plate mail + shield",
};

const filterArmorTypes = (armorTypes, restrictions) =>
  Object.entries(armorTypes).filter((option) =>
    restrictions.includes(option[0])
  );

const armorTypeClasses = {
  monster: () => filterArmorTypes(armorTypes, monsterArmor),
  cleric: () => Object.entries(armorTypes).slice(0, -1),
  druid: () => filterArmorTypes(armorTypes, druidArmor),
  fighter: () => Object.entries(armorTypes).slice(0, -1),
  paladin: () => Object.entries(armorTypes).slice(0, -1),
  ranger: () => Object.entries(armorTypes).slice(0, -1),
  magicuser: () => filterArmorTypes(armorTypes, magicuserArmor),
  illusionist: () => filterArmorTypes(armorTypes, magicuserArmor),
  thief: () => filterArmorTypes(armorTypes, thiefArmor),
  assassin: () => filterArmorTypes(armorTypes, assassinArmor),
  monk: () => filterArmorTypes(armorTypes, magicuserArmor),
  bard: () => filterArmorTypes(armorTypes, bardArmor),
};

export const getArmorOptionsByClass = (attackerClass) =>
  armorTypeClasses[attackerClass]()
    .reverse()
    .map(([value, label]) => ({ value, label }));

export const getArmorOptions = Object.entries(armorTypes)
  .reverse()
  .map(([value, label]) => ({ value, label }));

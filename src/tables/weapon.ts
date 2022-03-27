const clericWeapons = [
  "Club (Held)",
  "Club (Hurled)",
  "Fist or Open Hand",
  "Flail, Footman’s",
  "Flail, Horseman’s",
  "Hammer, Lucern",
  "Hammer (Held)",
  "Hammer (Hurled)",
  "Mace, Footman’s",
  "Mace, Horseman’s",
  "Staff, quarter",
];
const druidWeapons = [
  "Club (Held)",
  "Club (Hurled)",
  "Dagger (Held)",
  "Dagger (Hurled)",
  "Dart",
  "Fist or Open Hand",
  "Hammer, Lucern",
  "Hammer (Held)",
  "Hammer (Hurled)",
  "Scimitar",
  "Sling (bullet)",
  "Sling (stone)",
  "Spear (held)",
  "Spear (hurled)",
  "Staff, quarter",
];
const magicuserWeapons = [
  "Dagger (Held)",
  "Dagger (Hurled)",
  "Dart",
  "Fist or Open Hand",
  "Staff, quarter",
];
const thiefWeapons = [
  "Club (Held)",
  "Club (Hurled)",
  "Dagger (Held)",
  "Dagger (Hurled)",
  "Dart",
  "Fist or Open Hand",
  "Sling (bullet)",
  "Sling (stone)",
  "Sword, broad",
  "Sword, long",
  "Sword, short",
];
const monkWeapons = [
  "Axe, Hand (Held)",
  "Axe, Hand (Hurled)",
  "Bardiche",
  "Bec de Corbin",
  "Bill-Guisarme",
  "Bo Stick",
  "Club (Held)",
  "Club (Hurled)",
  "Crossbow, heavy",
  "Crossbow, light",
  "Dagger (Held)",
  "Dagger (Hurled)",
  "Fauchard",
  "Fauchard-Fork",
  "Fist or Open Hand",
  "Fork, Military",
  "Glaive",
  "Glaive-Guisarme",
  "Guisarme",
  "Guisarme-Voulge",
  "Halberd",
  "Hammer, Lucern",
  "Javelin",
  "Jo Stick",
  "Lance (heavy horse)",
  "Lance (light horse)",
  "Lance (medium horse)",
  "Partisan",
  "Pike, awl",
  "Ranseur",
  "Spear (held)",
  "Spear (hurled)",
  "Spetum",
  "Staff, quarter",
  "Trident",
  "Voulge",
];
const bardWeapons = [
  "Club (Held)",
  "Club (Hurled)",
  "Dagger (Held)",
  "Dagger (Hurled)",
  "Dart",
  "Fist or Open Hand",
  "Javelin",
  "Sling (bullet)",
  "Sling (stone)",
  "Scimitar",
  "Spear (held)",
  "Spear (hurled)",
  "Staff, quarter",
  "Sword, bastard",
  "Sword, broad",
  "Sword, long",
  "Sword, short",
];

const weapons = new Map([
  ["Natural Weapon (Monster)", [0, 0, 0, 0, 0, 0, 0, 0, 0]],
  ["Axe, Battle", [-3, -2, -1, -1, 0, 0, 1, 1, 2]],
  ["Axe, Hand (Held)", [-3, -2, -2, -1, 0, 0, 1, 1, 1]],
  ["Axe, Hand (Hurled)", [-4, -3, -2, -1, -1, 0, 0, 0, 1]],
  ["Bardiche", [-2, -1, 0, 0, 1, 1, 2, 2, 3]],
  ["Bec de Corbin", [2, 2, 2, 0, 0, 0, 0, 0, -1]],
  ["Bill-Guisarme", [0, 0, 0, 0, 0, 0, 1, 0, 0]],
  ["Bo Stick", [-9, -7, -5, -3, -1, 0, 1, 0, 3]],
  ["Bow, composite, long", [-3, -3, -1, 0, 1, 2, 2, 2, 3]],
  ["Bow, composite, short", [-3, -3, -1, 0, 1, 2, 2, 2, 3]],
  ["Bow, long", [-1, 0, 0, 1, 2, 3, 3, 3, 3]],
  ["Bow, short", [-5, -4, -1, 0, 0, 1, 2, 2, 2]],
  ["Club (Held)", [-5, -4, -3, -2, -1, -1, 0, 0, 1]],
  ["Club (Hurled)", [-7, -5, -3, -2, -1, -1, -1, 0, 0]],
  ["Crossbow, heavy", [-1, 0, 1, 2, 3, 3, 4, 4, 4]],
  ["Crossbow, light", [-2, -1, 0, 0, 1, 2, 3, 3, 3]],
  ["Dagger (Held)", [-3, -3, -2, -2, 0, 0, 1, 1, 3]],
  ["Dagger (Hurled)", [-5, -4, -3, -2, -1, -1, 0, 0, 1]],
  ["Dart", [-5, -4, -3, -2, -1, 0, 1, 0, 1]],
  ["Fauchard", [-2, -2, -1, -1, 0, 0, 0, -1, -1]],
  ["Fauchard-Fork", [-1, -1, -1, 0, 0, 0, 1, 0, 1]],
  ["Fist or Open Hand", [-7, -5, -3, -1, 0, 0, 2, 0, 4]],
  ["Flail, Footman’s", [2, 2, 1, 2, 1, 1, 1, 1, -1]],
  ["Flail, Horseman’s", [0, 0, 0, 0, 0, 1, 1, 1, 0]],
  ["Fork, Military", [-2, -2, -1, 0, 0, 1, 1, 0, 1]],
  ["Glaive", [-1, -1, 0, 0, 0, 0, 0, 0, 0]],
  ["Glaive-Guisarme", [-1, -1, 0, 0, 0, 0, 0, 0, 0]],
  ["Guisarme", [-2, -2, -1, -1, 0, 0, 0, -1, -1]],
  ["Guisarme-Voulge", [-1, -1, 0, 1, 1, 1, 0, 0, 0]],
  ["Halberd", [1, 1, 1, 2, 2, 2, 1, 1, 0]],
  ["Hammer, Lucern", [1, 1, 2, 2, 2, 1, 1, 0, 0]],
  ["Hammer (Held)", [0, 1, 0, 1, 0, 0, 0, 0, 0]],
  ["Hammer (Hurled)", [-2, -1, 0, 0, 0, 0, 0, 0, 1]],
  ["Javelin", [-5, -4, -3, -2, -1, 0, 1, 0, 1]],
  ["Jo Stick", [-8, -6, -4, -2, -1, 0, 1, 0, 2]],
  ["Lance (heavy horse)", [3, 3, 2, 2, 2, 1, 1, 0, 0]],
  ["Lance (light horse)", [-2, -2, -1, 0, 0, 0, 0, 0, 0]],
  ["Lance (medium horse)", [0, 1, 1, 1, 1, 0, 0, 0, 0]],
  ["Mace, Footman’s", [1, 1, 0, 0, 0, 0, 0, 1, -1]],
  ["Mace, Horseman’s", [1, 1, 0, 0, 0, 0, 0, 0, 0]],
  ["Morning Star", [0, 1, 1, 1, 1, 1, 1, 2, 2]],
  ["Partisan", [0, 0, 0, 0, 0, 0, 0, 0, 0]],
  ["Pick, Military, Footman’s", [2, 2, 1, 1, 0, -1, -1, -1, -2]],
  ["Pick, Military, Horseman’s", [1, 1, 1, 1, 0, 0, -1, -1, -1]],
  ["Pike, awl", [-1, 0, 0, 0, 0, 0, 0, -1, -2]],
  ["Ranseur", [-2, -1, -1, 0, 0, 0, 0, 0, 1]],
  ["Scimitar", [-3, -2, -2, -1, 0, 0, 1, 1, 3]],
  ["Sling (bullet)", [-2, -2, -1, 0, 0, 0, 2, 1, 3]],
  ["Sling (stone)", [-5, -4, -2, -1, 0, 0, 2, 1, 3]],
  ["Spear (held)", [-2, -1, -1, -1, 0, 0, 0, 0, 0]],
  ["Spear (hurled)", [-3, -3, -2, -2, -1, 0, 0, 0, 0]],
  ["Spetum", [-2, -1, 0, 0, 0, 0, 0, 1, 2]],
  ["Staff, quarter", [-7, -5, -3, -1, 0, 0, 1, 1, 1]],
  ["Sword, bastard", [0, 0, 1, 1, 1, 1, 1, 1, 0]],
  ["Sword, broad", [-3, -2, -1, 0, 0, 1, 1, 1, 2]],
  ["Sword, long", [-2, -1, 0, 0, 0, 0, 0, 1, 2]],
  ["Sword, short", [-3, -2, -1, 0, 0, 0, 1, 0, 2]],
  ["Sword, two-handed", [2, 2, 2, 2, 3, 3, 3, 1, 0]],
  ["Trident", [-3, -2, -1, -1, 0, 0, 1, 0, 1]],
  ["Voulge", [-1, -1, 0, 1, 1, 1, 0, 0, 0]],
]);

export const getWeaponAdjustment = (weapon, armorType) => {
  console.log(weapons.get(weapon));
  return weapons.get(weapon)[armorType - 2];
};

const filterWeaponClasses = (weapons, restrictions) =>
  Array.from(weapons).filter((option) => restrictions.includes(option[0]));

const weaponClasses = {
  monster: weapons,
  cleric: filterWeaponClasses(weapons, clericWeapons),
  druid: filterWeaponClasses(weapons, druidWeapons),
  fighter: Array.from(weapons).slice(1),
  paladin: Array.from(weapons).slice(1),
  ranger: Array.from(weapons).slice(1),
  magicuser: filterWeaponClasses(weapons, magicuserWeapons),
  illusionist: filterWeaponClasses(weapons, magicuserWeapons),
  thief: filterWeaponClasses(weapons, thiefWeapons),
  assassin: Array.from(weapons).slice(1),
  monk: filterWeaponClasses(weapons, monkWeapons),
  bard: filterWeaponClasses(weapons, bardWeapons),
};

export const getWeaponOptions = (attackerClass) =>
  Array.from(weaponClasses[attackerClass]).map(([label, value]) => ({
    value: label,
    label,
  }));

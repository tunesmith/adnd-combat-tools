export const MONSTER = 1;
export const CLERIC = 2;
export const DRUID = 3;
export const FIGHTER = 4;
export const RANGER = 5;
export const PALADIN = 6;
export const MAGIC_USER = 7;
export const ILLUSIONIST = 8;
export const THIEF = 9;
export const ASSASSIN = 10;
export const MONK = 11;
export const BARD = 12;

const attackerClass = {
  monster: "Monster",
  cleric: "Cleric",
  druid: "Druid",
  fighter: "Fighter",
  ranger: "Ranger",
  paladin: "Paladin",
  magicuser: "Magic-User",
  illusionist: "Illusionist",
  thief: "Thief",
  assassin: "Assassin",
  monk: "Monk",
  bard: "Bard",
};

const classMap = new Map<string, number>([
  ["cleric", CLERIC],
  ["druid", CLERIC],
  ["fighter", FIGHTER],
  ["ranger", FIGHTER],
  ["paladin", FIGHTER],
  ["magicuser", MAGIC_USER],
  ["illusionist", MAGIC_USER],
  ["thief", THIEF],
  ["assassin", THIEF],
  ["monk", CLERIC],
  ["bard", FIGHTER], // TODO change to BARD
]);

export const getGeneralClass = (className: string): number => {
  const generalClass = classMap.get(className);
  if (generalClass) {
    return generalClass;
  } else {
    console.error(
      `Could not get general class for ${className}, returning FIGHTER`
    );
    return FIGHTER;
  }
};

export const attackerClassOptions = Object.entries(attackerClass).map(
  ([value, label]) => ({ value, label })
);

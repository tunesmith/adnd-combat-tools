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

const attackerClass = new Map<number, string>([
  [MONSTER, "Monster"],
  [CLERIC, "Cleric"],
  [DRUID, "Druid"],
  [FIGHTER, "Fighter"],
  [RANGER, "Ranger"],
  [PALADIN, "Paladin"],
  [MAGIC_USER, "Magic-User"],
  [ILLUSIONIST, "Illusionist"],
  [THIEF, "Thief"],
  [ASSASSIN, "Assassin"],
  [MONK, "Monk"],
  [BARD, "Bard"],
]);

const classMap = new Map<number, number>([
  [CLERIC, CLERIC],
  [DRUID, CLERIC],
  [FIGHTER, FIGHTER],
  [RANGER, FIGHTER],
  [PALADIN, FIGHTER],
  [MAGIC_USER, MAGIC_USER],
  [ILLUSIONIST, MAGIC_USER],
  [THIEF, THIEF],
  [ASSASSIN, THIEF],
  [MONK, CLERIC],
  [BARD, BARD],
]);

export const getGeneralClass = (className: number): number => {
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

export const attackerClassOptions = Array.from(attackerClass).map(
  ([value, label]) => ({ value, label })
);

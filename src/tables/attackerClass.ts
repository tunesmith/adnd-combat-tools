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

const classMap = {
  cleric: "cleric",
  druid: "cleric",
  fighter: "fighter",
  ranger: "fighter",
  paladin: "fighter",
  magicuser: "magicuser",
  illusionist: "magicuser",
  thief: "thief",
  assassin: "thief",
  monk: "cleric",
  bard: "fighter",
};

export const getGeneralClass = (className: string): string => {
  return classMap[className];
};

export const attackerClassOptions = Object.entries(attackerClass).map(
  ([value, label]) => ({ value, label })
);

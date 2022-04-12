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

const classMap = new Map<string, string>([
  ["cleric", "cleric"],
  ["druid", "cleric"],
  ["fighter", "fighter"],
  ["ranger", "fighter"],
  ["paladin", "fighter"],
  ["magicuser", "magicuser"],
  ["illusionist", "magicuser"],
  ["thief", "thief"],
  ["assassin", "thief"],
  ["monk", "cleric"],
  ["bard", "fighter"],
]);

export const getGeneralClass = (className: string): string => {
  const generalClass = classMap.get(className);
  if (generalClass) {
    return generalClass;
  } else {
    console.error(
      `Could not get general class for ${className}, returning 'fighter'`
    );
    return "fighter";
  }
};

export const attackerClassOptions = Object.entries(attackerClass).map(
  ([value, label]) => ({ value, label })
);

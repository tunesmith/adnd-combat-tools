const combatClass = {
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

export const classMap = {
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

const combatClassOptions = Object.entries(combatClass).map(
  ([value, label]) => ({ value, label })
);

export default combatClassOptions;

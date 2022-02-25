export const monsterLevels = new Map([
  ["up to 1-1", "21"],
  ["1-1", "20"],
  ["1", "19"],
  ["1+", "18"],
  ["2-3+", "16"],
  ["4-5+", "15"],
  ["6-7+", "13"],
  ["8-9+", "12"],
  ["10-11+", "10"],
  ["12-13+", "9"],
  ["14-15+", "8"],
  ["16+", "7"],
]);

interface LevelMap {
  [key: number]: number;
}
export const fighterLevels: LevelMap = {
  0: 21,
  1: 20,
  3: 18,
  5: 16,
  7: 14,
  9: 12,
  11: 10,
  13: 8,
  15: 6,
  17: 4,
};

export const clericLevels: LevelMap = {
  1: 20,
  4: 18,
  7: 16,
  10: 14,
  13: 12,
  16: 10,
  19: 9,
};

export const thiefLevels: LevelMap = {
  1: 21,
  5: 19,
  9: 16,
  13: 14,
  17: 12,
  21: 10,
};

export const magicUserLevels: LevelMap = {
  1: 21,
  6: 19,
  11: 16,
  16: 13,
  21: 11,
};

/**
 * Every combat line adds up to thaco,
 * except that 20 hits for five additional ac levels
 * @param ac
 * @param thaco
 */
export const getThac = (ac, thaco) => {
  const simpleThac = thaco - ac;
  if (simpleThac >= 20) {
    return Math.max(20, simpleThac - 5);
  }
  return simpleThac;
};

export const getInterpolatedOptions = (
  levels: LevelMap
): { value: string; label: string }[] => {
  const entries: [string, number][] = Object.entries(levels);
  let interpolatedLevels: [string, number][] = [];

  // ugh... possible without mutation? is there a "flat reduce"?
  for (let i = 0; i < entries.length; i++) {
    if (entries[i + 1]) {
      interpolatedLevels.push(entries[i]);

      const [level, thaco] = entries[i];
      const [nextLevel, _] = entries[i + 1];

      for (let j = parseInt(level, 10); j + 1 < parseInt(nextLevel, 10); j++) {
        interpolatedLevels.push([`${j + 1}`, thaco]);
      }
    } else {
      // For the last line, for example, make '21' be '21+'
      interpolatedLevels.push([`${entries[i][0]}+`, entries[i][1]]);
    }
  }

  return interpolatedLevels.map(([label, value]) => ({
    value: `${value}`,
    label,
  }));
};

export const getTableByCombatClass = (
  combatClass: string
): { value: string; label: string }[] => {
  switch (combatClass) {
    case "monster":
      return Array.from(monsterLevels).map(([label, value]) => ({
        value,
        label,
      }));
    case "fighter":
      return getInterpolatedOptions(fighterLevels);
    case "cleric":
      return getInterpolatedOptions(clericLevels);
    case "magicuser":
      return getInterpolatedOptions(magicUserLevels);
    case "thief":
      return getInterpolatedOptions(thiefLevels);
  }
};

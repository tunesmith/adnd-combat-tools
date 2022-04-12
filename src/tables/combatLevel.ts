import { LevelOption } from "../components/battle/types";

export const monsterLevels = new Map([
  ["up to 1-1", 21],
  ["1-1", 20],
  ["1", 19],
  ["1+", 18],
  ["2-3+", 16],
  ["4-5+", 15],
  ["6-7+", 13],
  ["8-9+", 12],
  ["10-11+", 10],
  ["12-13+", 9],
  ["14-15+", 8],
  ["16+", 7],
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
 * Given level, look up thaco.
 * @param levelMap
 * @param targetLevel
 */
const getLevelThaco = (levelMap: LevelMap, targetLevel: string): number =>
  Object.entries(levelMap).reduce<number>(
    (previous, [level, thaco]) =>
      parseInt(level, 10) <= parseInt(targetLevel, 10) ? thaco : previous,
    30
  );

/**
 * Given class and level, get thaco.
 *
 * @param attackerClass
 * @param attackerLevel
 */
export const getThaco = (
  attackerClass: string,
  attackerLevel: string
): number => {
  switch (attackerClass) {
    case "fighter":
      return getLevelThaco(fighterLevels, attackerLevel);
    case "cleric":
      return getLevelThaco(clericLevels, attackerLevel);
    case "magicuser":
      return getLevelThaco(magicUserLevels, attackerLevel);
    case "thief":
      return getLevelThaco(thiefLevels, attackerLevel);
    default: {
      // case "monster"
      const monsterThaco = monsterLevels.get(attackerLevel);
      if (monsterThaco) {
        return monsterThaco;
      } else {
        console.error(
          `Unable to get monster thaco for level: ${attackerLevel}, returning thaco 19 for HD1`
        );
        return 19;
      }
    }
  }
};
/**
 * Every combat line adds up to thaco,
 * except that 20 hits for five additional ac levels
 * @param ac
 * @param thaco
 */
export const getThac = (ac: number, thaco: number) => {
  const simpleThac = thaco - ac;
  if (simpleThac >= 20) {
    return Math.max(20, simpleThac - 5);
  }
  return simpleThac;
};

const getClassLevels = (
  levels: LevelMap
): { value: string; label: string }[] => {
  // this is so dumb. There's not a better way?
  const arrayOfKeys = Object.entries(levels).map((val) => parseInt(val[0], 10));
  const max = Math.max(...arrayOfKeys);
  const min = Math.min(...arrayOfKeys);
  return Array.from(Array(max - min + 1).keys()).map((key) => {
    return {
      value: `${key + min}`,
      label: `Level ${key + min}${key + min === max ? "+" : ""}`,
    };
  });
};

export const getTableByCombatClass = (combatClass: string): LevelOption[] => {
  switch (combatClass) {
    case "fighter":
      return getClassLevels(fighterLevels);
    case "cleric":
      return getClassLevels(clericLevels);
    case "magicuser":
      return getClassLevels(magicUserLevels);
    case "thief":
      return getClassLevels(thiefLevels);
    default: // case "monster"
      return Array.from(monsterLevels).map(([label]) => ({
        value: label,
        label: `${label} HD`,
      }));
  }
};

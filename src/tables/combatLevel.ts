import { LevelOption } from "../types/option";
import { BARD, CLERIC, FIGHTER, MAGIC_USER, THIEF } from "./attackerClass";

interface LevelProps {
  label?: string;
  thaco: number;
}

/**
 * I cannot (don't want to) support all possible multi-class combinations.
 * Therefore, "pick the class most beneficial to combat in terms of thaco and armor type"
 * Then for level, "pick the level of the class"
 *
 * A bard always engages in combat at the level he or she attained as a fighter.
 */
export const monsterLevels = new Map<number, LevelProps>([
  [1, { label: "up to 1-1", thaco: 21 }],
  [2, { label: "1-1", thaco: 20 }],
  [3, { label: "1", thaco: 19 }],
  [4, { label: "1+", thaco: 18 }],
  [5, { label: "2-3+", thaco: 16 }],
  [6, { label: "4-5+", thaco: 15 }],
  [7, { label: "6-7+", thaco: 13 }],
  [8, { label: "8-9+", thaco: 12 }],
  [9, { label: "10-11+", thaco: 10 }],
  [10, { label: "12-13+", thaco: 9 }],
  [11, { label: "14-15+", thaco: 8 }],
  [12, { label: "16+", thaco: 7 }],
]);
const fighterLevels = new Map<number, LevelProps>([
  [0, { thaco: 21 }],
  [1, { thaco: 20 }],
  [3, { thaco: 18 }],
  [5, { thaco: 16 }],
  [7, { thaco: 14 }],
  [9, { thaco: 12 }],
  [11, { thaco: 10 }],
  [13, { thaco: 8 }],
  [15, { thaco: 6 }],
  [17, { thaco: 4 }],
]);
const clericLevels = new Map<number, LevelProps>([
  [1, { thaco: 20 }],
  [4, { thaco: 18 }],
  [7, { thaco: 16 }],
  [10, { thaco: 14 }],
  [13, { thaco: 12 }],
  [16, { thaco: 10 }],
  [19, { thaco: 9 }],
]);
const thiefLevels = new Map<number, LevelProps>([
  [1, { thaco: 21 }],
  [5, { thaco: 19 }],
  [9, { thaco: 16 }],
  [13, { thaco: 14 }],
  [17, { thaco: 12 }],
  [21, { thaco: 10 }],
]);
const magicUserLevels = new Map<number, LevelProps>([
  [1, { thaco: 21 }],
  [6, { thaco: 19 }],
  [11, { thaco: 16 }],
  [16, { thaco: 13 }],
  [21, { thaco: 11 }],
]);
const bardLevels = new Map<number, LevelProps>([
  [1, { thaco: 20 }],
  [3, { thaco: 18 }],
  [5, { thaco: 16 }],
  [7, { thaco: 14 }],
  [8, { thaco: 14 }],
]);

/**
 * Given level, look up thaco.
 * @param levelProps
 * @param targetLevel
 */
const getLevelThaco = (
  levelProps: Map<number, LevelProps>,
  targetLevel: number
): number =>
  Array.from(levelProps).reduce<number>(
    (previous, [level, props]) =>
      level <= targetLevel ? props.thaco : previous,
    30
  );

/**
 * Given general combat class and level, get thaco.
 *
 * @param combatClass
 * @param attackerLevel
 */
export const getThaco = (
  combatClass: number,
  attackerLevel: number
): number => {
  switch (combatClass) {
    case FIGHTER:
      return getLevelThaco(fighterLevels, attackerLevel);
    case CLERIC:
      return getLevelThaco(clericLevels, attackerLevel);
    case MAGIC_USER:
      return getLevelThaco(magicUserLevels, attackerLevel);
    case THIEF:
      return getLevelThaco(thiefLevels, attackerLevel);
    case BARD:
      return getLevelThaco(bardLevels, attackerLevel);
    default: {
      // case "monster"
      const monsterThaco = monsterLevels.get(attackerLevel);
      if (monsterThaco) {
        return monsterThaco.thaco;
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
  levels: Map<number, LevelProps>,
  bard: boolean = false
): LevelOption[] => {
  const keys: number[] = Array.from(levels.keys());
  const max = Math.max(...keys);
  const min = Math.min(...keys);

  return Array.from(Array(max - min + 1).keys()).map((key) => {
    return {
      value: key + min,
      label: bard
        ? `Level F${key + min}`
        : `Level ${key + min}${key + min === max ? "+" : ""}`,
    };
  });
};

/**
 * Given a general combat class, get the list of level options for a select dropdown
 * @param combatClass
 */
export const getLevelOptionsByCombatClass = (
  combatClass: number
): LevelOption[] => {
  switch (combatClass) {
    case FIGHTER:
      return getClassLevels(fighterLevels);
    case CLERIC:
      return getClassLevels(clericLevels);
    case MAGIC_USER:
      return getClassLevels(magicUserLevels);
    case THIEF:
      return getClassLevels(thiefLevels);
    case BARD:
      return getClassLevels(bardLevels, true);
    default: // case "monster"
      return Array.from(monsterLevels).map(([levelId, levelProps]) => ({
        value: levelId,
        label: `${levelProps.label} HD`,
      }));
  }
};

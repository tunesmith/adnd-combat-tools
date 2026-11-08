import {
  xpAdd,
  xpCompare,
  xpNumber,
  xpMultiply,
  xpZero,
  xpExact,
} from '../helpers/xpArithmetic';
/** AD&D 1e DMG, printed pp.84–85. Coefficients only; judgments remain explicit. */
export const monsterXpBands = [
  {
    id: 'under-one',
    label: 'Up to 1−1 HD',
    maximum: 1,
    base: 5,
    perHp: 1,
    special: 2,
    exceptional: 25,
  },
  {
    id: 'one',
    label: '1−1 to 1 HD',
    maximum: 1,
    base: 10,
    perHp: 1,
    special: 4,
    exceptional: 35,
  },
  {
    id: 'two',
    label: '1+1 to 2 HD',
    maximum: 2,
    base: 20,
    perHp: 2,
    special: 8,
    exceptional: 45,
  },
  {
    id: 'three',
    label: '2+1 to 3 HD',
    maximum: 3,
    base: 35,
    perHp: 3,
    special: 15,
    exceptional: 55,
  },
  {
    id: 'four',
    label: '3+1 to 4 HD',
    maximum: 4,
    base: 60,
    perHp: 4,
    special: 25,
    exceptional: 65,
  },
  {
    id: 'five',
    label: '4+1 to 5 HD',
    maximum: 5,
    base: 90,
    perHp: 5,
    special: 40,
    exceptional: 75,
  },
  {
    id: 'six',
    label: '5+1 to 6 HD',
    maximum: 6,
    base: 150,
    perHp: 6,
    special: 75,
    exceptional: 125,
  },
  {
    id: 'seven',
    label: '6+1 to 7 HD',
    maximum: 7,
    base: 225,
    perHp: 8,
    special: 125,
    exceptional: 175,
  },
  {
    id: 'eight',
    label: '7+1 to 8 HD',
    maximum: 8,
    base: 375,
    perHp: 10,
    special: 175,
    exceptional: 275,
  },
  {
    id: 'nine',
    label: '8+1 to 9 HD',
    maximum: 9,
    base: 600,
    perHp: 12,
    special: 300,
    exceptional: 400,
  },
  {
    id: 'ten',
    label: '9+1 to 10+ HD',
    maximum: 10,
    base: 900,
    perHp: 14,
    special: 450,
    exceptional: 600,
  },
  {
    id: 'twelve',
    label: '11 to 12+ HD',
    maximum: 12,
    base: 1300,
    perHp: 16,
    special: 700,
    exceptional: 850,
  },
  {
    id: 'fourteen',
    label: '13 to 14+ HD',
    maximum: 14,
    base: 1800,
    perHp: 18,
    special: 950,
    exceptional: 1200,
  },
  {
    id: 'sixteen',
    label: '15 to 16+ HD',
    maximum: 16,
    base: 2400,
    perHp: 20,
    special: 1250,
    exceptional: 1600,
  },
  {
    id: 'eighteen',
    label: '17 to 18+ HD',
    maximum: 18,
    base: 3000,
    perHp: 25,
    special: 1550,
    exceptional: 2000,
  },
  {
    id: 'twenty',
    label: '19 to 20+ HD',
    maximum: 20,
    base: 4000,
    perHp: 30,
    special: 2100,
    exceptional: 2500,
  },
  {
    id: 'twenty-one',
    label: '21+ HD',
    maximum: Infinity,
    base: 5000,
    perHp: 35,
    special: 2600,
    exceptional: 3000,
  },
] as const;
export interface XpMonster {
  id: string;
  name: string;
  count: number;
  basis: 'hit-dice' | 'level';
  hitDice: string | null;
  hpAdjustment: number;
  startingHp: string | null;
  special: number;
  exceptional: number;
  bandOverride: string | null;
  bandReason: string;
}
export function monsterCoefficients(monster: XpMonster) {
  if (
    monster.hitDice === null ||
    (monster.basis === 'hit-dice' &&
      xpCompare(xpNumber(monster.hitDice), xpZero()) <= 0)
  )
    throw new Error(
      `${monster.name}: enter actual HD/level; tracker category IDs are not HD.`
    );
  const hd = xpNumber(monster.hitDice);
  const override =
    monster.bandOverride &&
    monsterXpBands.find((b) => b.id === monster.bandOverride);
  if (monster.bandOverride && (!override || !monster.bandReason.trim()))
    throw new Error('A monster band override needs a valid band and reason.');
  if (override) return override;
  const isOne = xpCompare(hd, xpNumber(1)) === 0;
  // 'Up to' excludes 1−1; exactly 1−1 belongs to the second printed row.
  if (
    xpCompare(hd, xpNumber(1)) < 0 ||
    (isOne && monster.basis === 'hit-dice' && monster.hpAdjustment < -1)
  )
    return monsterXpBands[0];
  // The footnote treats a class level n as the n+1 HP hit-dice category.
  const plus = monster.basis === 'level' || monster.hpAdjustment > 0;
  const band = monsterXpBands
    .slice(1)
    .find(
      (b) =>
        b.maximum === Infinity ||
        xpCompare(hd, xpNumber(b.maximum)) < 0 ||
        (xpCompare(hd, xpNumber(b.maximum)) === 0 && (!plus || b.maximum >= 10))
    );
  if (!band) throw new Error('No monster XP band.');
  return band;
}
export function calculateMonster(monster: XpMonster) {
  const coefficients = monsterCoefficients(monster);
  if (monster.startingHp === null)
    throw new Error(`${monster.name}: actual starting HP is unknown.`);
  const ability =
    coefficients.base +
    monster.special * coefficients.special +
    monster.exceptional * coefficients.exceptional;
  const raw = xpAdd(
    xpNumber(ability * monster.count),
    xpMultiply(xpNumber(monster.startingHp), xpNumber(coefficients.perHp))
  );
  const difficulty = monsterDifficulty(monster);
  return {
    coefficients: {
      ...coefficients,
      maximum: coefficients.maximum === Infinity ? null : coefficients.maximum,
    },
    raw: xpExact(raw),
    difficulty: xpExact(difficulty),
  };
}

export function monsterDifficulty(monster: XpMonster) {
  if (monster.hitDice === null)
    throw new Error(`${monster.name}: actual HD/level is unknown.`);
  return xpMultiply(
    xpAdd(
      xpNumber(monster.hitDice || '0'),
      xpNumber(
        monster.special +
          monster.exceptional +
          (monster.basis === 'hit-dice' && monster.hpAdjustment > 0 ? 1 : 0)
      )
    ),
    xpNumber(monster.count)
  );
}

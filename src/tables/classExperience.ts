import type { PartyProfile } from '../helpers/campaignPartyModel';

// First XP point of each level, verified against the AD&D 1e PHB (Orange Spine):
// cleric p20, druid p21, fighter p22, paladin p24, ranger p25,
// magic-user pp25–26, illusionist p26, thief p27, assassin p30,
// monk p31, bard pp117–118. Numeric facts only; no page/source extracts bundled.
const progressions: Partial<
  Record<
    PartyProfile['characterClass'],
    { minimums: readonly number[]; increment?: number }
  >
> = {
  cleric: {
    minimums: [
      0, 1501, 3001, 6001, 13001, 27501, 55001, 110001, 225001, 450001, 675001,
    ],
    increment: 225000,
  },
  druid: {
    minimums: [
      0, 2001, 4001, 7501, 12501, 20001, 35001, 60001, 90001, 125001, 200001,
      300001, 750001, 1500001,
    ],
  },
  fighter: {
    minimums: [
      0, 2001, 4001, 8001, 18001, 35001, 70001, 125001, 250001, 500001, 750001,
    ],
    increment: 250000,
  },
  paladin: {
    minimums: [
      0, 2751, 5501, 12001, 24001, 45001, 95001, 175001, 350001, 700001,
      1050001,
    ],
    increment: 350000,
  },
  ranger: {
    minimums: [
      0, 2251, 4501, 10001, 20001, 40001, 90001, 150001, 225001, 325001, 650001,
      975001,
    ],
    increment: 325000,
  },
  'magic-user': {
    minimums: [
      0, 2501, 5001, 10001, 22501, 40001, 60001, 90001, 135001, 250001, 375001,
      750001, 1125001, 1500001, 1875001, 2250001, 2625001, 3000001,
    ],
    increment: 375000,
  },
  illusionist: {
    minimums: [
      0, 2251, 4501, 9001, 18001, 35001, 60001, 95001, 145001, 220001, 440001,
      660001,
    ],
    increment: 220000,
  },
  thief: {
    minimums: [
      0, 1251, 2501, 5001, 10001, 20001, 42501, 70001, 110001, 160001, 220001,
      440001,
    ],
    increment: 220000,
  },
  assassin: {
    minimums: [
      0, 1501, 3001, 6001, 12001, 25001, 50001, 100001, 200001, 300001, 425001,
      575001, 750001, 1000001, 1500001,
    ],
  },
  monk: {
    minimums: [
      0, 2251, 4751, 10001, 22501, 47501, 98001, 200001, 350001, 500001, 700001,
      950001, 1250001, 1750001, 2250001, 2750001, 3250001,
    ],
  },
  bard: {
    minimums: [
      0, 2001, 4001, 8001, 16001, 25001, 40001, 60001, 85001, 110001, 150001,
      200001, 400001, 600001, 800001, 1000001, 1200001, 1400001, 1600001,
      1800001, 2000001, 2200001, 3000001,
    ],
  },
};
export function nextLevelXp(
  characterClass: PartyProfile['characterClass'],
  baseLevel: number
): number | null {
  if (!Number.isInteger(baseLevel) || baseLevel < 1 || baseLevel > 99)
    return null;
  const table = progressions[characterClass];
  if (!table) return null;
  const printed = table.minimums[baseLevel];
  if (printed !== undefined) return printed;
  const last = table.minimums[table.minimums.length - 1];
  if (table.increment === undefined || last === undefined) return null;
  return last + (baseLevel + 1 - table.minimums.length) * table.increment;
}

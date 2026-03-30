import { CharacterClass } from '../../models/characterClass';

interface HitPointBonus {
  bonus: number;
  reRoll: number;
}

export const getHitPointBonus = (
  characterClass: CharacterClass,
  constitution: number
): HitPointBonus => {
  // Default bonuses for non-fighters
  const constitutionTable: Record<number, HitPointBonus> = {
    3: { bonus: -2, reRoll: 0 },
    4: { bonus: -1, reRoll: 0 },
    5: { bonus: -1, reRoll: 0 },
    6: { bonus: 0, reRoll: 0 },
    7: { bonus: 0, reRoll: 0 },
    8: { bonus: 0, reRoll: 0 },
    9: { bonus: 0, reRoll: 0 },
    10: { bonus: 0, reRoll: 0 },
    11: { bonus: 0, reRoll: 0 },
    12: { bonus: 0, reRoll: 0 },
    13: { bonus: 0, reRoll: 0 },
    14: { bonus: 0, reRoll: 0 },
    15: { bonus: 1, reRoll: 0 },
    16: { bonus: 2, reRoll: 0 },
    17: { bonus: 2, reRoll: 0 },
    18: { bonus: 2, reRoll: 0 },
    19: { bonus: 2, reRoll: 1 },
  };

  // Adjust for Fighters, Paladins, and Rangers
  const isFighterType =
    characterClass === CharacterClass.Fighter ||
    characterClass === CharacterClass.Paladin ||
    characterClass === CharacterClass.Ranger;

  if (isFighterType) {
    if (constitution === 17) return { bonus: 3, reRoll: 0 };
    if (constitution === 18) return { bonus: 4, reRoll: 0 };
    if (constitution === 19) return { bonus: 5, reRoll: 1 };
  }

  // Default lookup for all other cases
  return constitutionTable[constitution] || { bonus: 0, reRoll: 0 };
};

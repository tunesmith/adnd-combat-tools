import { getTableEntry, rollDice } from "../../helpers/dungeonLookup";
import {
  characterMax,
  incompatibleClasses,
  multiClassCombinations,
  multiClassLikelihood,
  raceToClasses,
} from "../../../tables/dungeon/monster/character";
import {
  CharacterRace,
  characterRace,
} from "../../../tables/dungeon/monster/character/characterRace";
import {
  CharacterClass,
  characterClass,
} from "../../../tables/dungeon/monster/character/characterClass";

/**
 * DMG p11: rolling methods for characters and henchmen
 * DMG p100: stats adjustments and traits for NPCs
 * DMG p176: character party instructions
 *
 * @param monsterLevel
 * @param dungeonLevel
 */
export const characterResult = (
  monsterLevel: number,
  dungeonLevel: number
): PartyResult => {
  const charactersCount = rollDice(4) + 1;
  const othersCount = 9 - charactersCount;
  const henchmen = dungeonLevel > 3;
  const characterLevel = getCharacterLevel(monsterLevel, dungeonLevel);
  const otherLevel = henchmen ? getHenchmanLevel(characterLevel) : 0;

  const mainParty = createParty([], charactersCount).map(
    (ch): PartyMember => ({
      level: characterLevel,
      characterClass: ch,
      characterRole: CharacterRole.Main,
    })
  );

  // Use the main party as the starting compatibility pool
  const otherPartyMembers = createParty(
    mainParty.map((member) => member.characterClass),
    othersCount
  ).map(
    (ch): PartyMember => ({
      level: otherLevel,
      characterClass: ch,
      characterRole: henchmen
        ? CharacterRole.Henchman
        : CharacterRole.ManAtArms,
    })
  );

  return {
    mainCharacters: mainParty,
    otherCharacters: otherPartyMembers,
    henchmen,
  };
};

// Man-at-arms: 4-7 hit points each (DMG p30). I think this makes more sense
// than 1-6 hit points. On the other hand DMB p100 says "minimum of 4 hit points",
// and offers a constitution bonus. Hmm. I suppose that could lead to as many
// as eight hit points if taken literally. What's the point of a hit point
// bonus if 4-7 hp is prescribed? I think 4-7 hit points is for men-at-arms
// a party may encounter in the wild, but a rolled man-at-arms should be
// 1-6 with hit point bonuses applied (if any), minimum 4hp.

// All men-at-arms are
enum CharacterRole {
  Main,
  Henchman,
  ManAtArms,
}
interface PartyMember {
  level: number; // Character level (0 for men-at-arms)
  characterClass: CharacterClass; // Enum for character class
  characterRole: CharacterRole; // Role in the party
}

interface PartyResult {
  mainCharacters: PartyMember[]; // The main party members
  otherCharacters: PartyMember[]; // Includes henchmen or men-at-arms
  henchmen: boolean; // Indicates if henchmen are present
}
export const formatPartyResult = (result: PartyResult): string => {
  const charactersText = result.mainCharacters
    .map(
      (member) => `${CharacterClass[member.characterClass]} (L${member.level})`
    )
    .join(", ");

  const overallPartyText = result.otherCharacters
    .map(
      (member) => `${CharacterClass[member.characterClass]} (L${member.level})`
    )
    .join(", ");

  return `
    Main Characters: ${charactersText}
    Other ${result.henchmen ? "Henchmen" : "Men-At-Arms"}: ${overallPartyText}
  `.trim();
};

/**
 * The level of each character will be equal to that of the level of the
 * dungeon or the level of monster, whichever is greater, through the
 * 4th level. Thereafter, it will be between 7th and 12th, determined
 * by a roll of d6 +6, and adjusted as follows: If the total is higher
 * than the level of the dungeon, reduce it by -1. If it is lower than
 * the level of the dungeon, adjust it upwards by +1, but not to exceed
 * 12 levels unless the dungeon level is 16th or deeper.
 *
 * Translation: I believe "through the 4th level" refers to dungeon
 * level, not either dungeon/monster level, because if it referred to
 * either, it would be impossible to experience a character level of
 * 5th or 6th level. On the 4th dungeon level, it is possible to
 * meet 5th or 6th level monsters.
 *
 * @param monsterLevel
 * @param dungeonLevel
 */
const getCharacterLevel = (
  monsterLevel: number,
  dungeonLevel: number
): number => {
  if (dungeonLevel <= 4) {
    return Math.max(monsterLevel, dungeonLevel);
  }
  const roll = rollDice(6) + 6;
  if (roll > dungeonLevel) return roll - 1;
  if (roll < dungeonLevel && (roll < 12 || dungeonLevel >= 16)) {
    return roll + 1;
  }
  return roll;
};

/**
 * Each henchman will have a level equal to one-third that of his or her master,
 * rounded down in all cases where fractions are below one-half, and plus 1 level
 * per 3 levels of the master's experience level where the character’s level is
 * above 8th. For example, o 5th level magic-user would have a 2nd level henchman,
 * as one-third of 5 is 1.7; at 9th level the character’s henchman would be 3 +3
 * (one third of 9 plus 1 level for every 3 levels of experience of the master
 * equals 3 + 3) or 6th level. Bonus for the level of the character master is only
 * in whole numbers, all fractions being dropped, i.e. at 11th level there is still
 * only a bonus of 3, but at 12th there is a bonus of 4.
 *
 * @param characterLevel
 */
const getHenchmanLevel = (characterLevel: number): number => {
  const baseHenchmanLevel = Math.round(characterLevel / 3);
  const henchmanLevelBonus =
    characterLevel > 8 ? Math.floor(characterLevel / 3) : 0;
  return baseHenchmanLevel + henchmanLevelBonus;
};

const getRace = (): CharacterRace => {
  const raceRoll = rollDice(characterRace.sides);
  return getTableEntry(raceRoll, characterRace);
};

const getNumberOfClasses = (
  characterRace: CharacterRace,
  multiClassProbability: number
): number => {
  if (multiClassProbability > multiClassLikelihood[characterRace]) {
    return 1;
  }
  if (
    characterRace === CharacterRace.Elf ||
    characterRace === CharacterRace.HalfElf
  ) {
    if (rollDice(100) <= 25) {
      return 3;
    }
  }
  return 2;
};

function getRandomClassForRace(race: CharacterRace): CharacterClass {
  while (true) {
    // Roll a random class based on the character table
    const roll = rollDice(characterClass.sides); // e.g., d100 for a 100-sided table
    const candidateClass = getTableEntry(roll, characterClass);

    // Check if the class is valid for the race
    if (raceToClasses[race]?.includes(candidateClass)) {
      return candidateClass; // Valid result, return the class
    }
    // Otherwise, reroll
  }
}

function getMultiClass(
  characterRace: CharacterRace,
  numClasses: number
): CharacterClass[] {
  const selectedClasses: CharacterClass[] = [];
  while (selectedClasses.length < numClasses) {
    const roll = rollDice(characterClass.sides);
    const candidate = getTableEntry(roll, characterClass);

    const validMultiClass = multiClassCombinations[characterRace]
      ?.filter((combo) => combo.length === numClasses) // Only combos of the right size
      .some((combo) => {
        const includesCandidate = combo.includes(candidate);
        const isNotDuplicate = !selectedClasses.includes(candidate);
        const matchesSelected = selectedClasses.every((cls) =>
          combo.includes(cls)
        );
        return includesCandidate && isNotDuplicate && matchesSelected;
      });

    if (validMultiClass) {
      selectedClasses.push(candidate);
    }
  }
  return selectedClasses;
}

function createParty(
  initialParty: CharacterClass[] = [],
  partySize: number = 9
): CharacterClass[] {
  const party: CharacterClass[] = [...initialParty];
  const counts: Record<CharacterClass, number> = Object.fromEntries(
    Object.values(CharacterClass).map((c) => [c, 0])
  ) as Record<CharacterClass, number>;

  // Initialize counts based on the initial party
  for (const member of initialParty) {
    counts[member]++;
  }

  while (party.length < partySize) {
    const nonHumanRoll = rollDice(100);
    const characterRace = nonHumanRoll <= 20 ? getRace() : CharacterRace.Human;
    const multiClassProbability = rollDice(100);
    const numClasses = getNumberOfClasses(characterRace, multiClassProbability);

    const characterClasses =
      numClasses === 1
        ? [getRandomClassForRace(characterRace)] // Single-class
        : getMultiClass(characterRace, numClasses); // Multi-class

    characterClasses.forEach((candidate) => {
      if (!isCompatible(candidate, party)) {
        return; // Skip this combination if any part is incompatible
      }
      if (counts[candidate] >= characterMax[candidate]) {
        return; // Skip if max limit for this class is reached
      }
      party.push(candidate);
      counts[candidate]++;
    });
  }

  return party;
}

function isCompatible(
  candidate: CharacterClass,
  party: CharacterClass[]
): boolean {
  // Check if candidate conflicts with any existing party members
  for (const member of party) {
    if (
      incompatibleClasses[member]?.includes(candidate) ||
      incompatibleClasses[candidate]?.includes(member)
    ) {
      return false;
    }
  }

  return true;
}

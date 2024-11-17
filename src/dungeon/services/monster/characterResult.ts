import { getTableEntry, rollDice } from "../../helpers/dungeonLookup";
import {
  CharacterRace,
  characterRace,
} from "../../../tables/dungeon/monster/character/characterRace";
import {
  CharacterClass,
  characterClass,
} from "../../../tables/dungeon/monster/character/characterClass";
import { characterMax } from "../../models/characterMax";
import { incompatibleClasses } from "../../models/incompatibleClasses";
import { multiClassLikelihood } from "../../models/multiClassLikelihood";
import { allowedClassesByRace } from "../../models/allowedClassesByRace";
import { allowedMultiClassCombinationsByRace } from "../../models/allowedMultiClassCombinationsByRace";
import { getCharacterLevel } from "../../helpers/character/getCharacterLevel";
import { getHenchmanLevel } from "../../helpers/character/getHenchmanLevel";

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
  // levels are "base levels", which might change due to multi-classing
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

const getRace = (): CharacterRace => {
  const raceRoll = rollDice(characterRace.sides);
  return getTableEntry(raceRoll, characterRace);
};

/**
 * Note there is something crazy here. The DMG says:
 *
 * About 50% of non-humans will have two professions,
 * about 25% of those will have three.
 *
 * First, we definitely interpret this to mean "25% of
 * the 50%", rather than an additional 25%.
 *
 * But, note that only elves and half-elves can have three.
 *
 * Staring closely at the table, we see that we would
 * overall expect 52.25% of non-humans to be multi-class,
 * which is close enough to "about 50%".
 *
 * To have roughly 25% of those be three-class, just from
 * elves and half-elves, that means that elves and half-elves
 * would each need to have a 30.74% chance of being three-class,
 * rather than a straight 25% chance.
 *
 * We'll just use 30%. That means we'd expect an overall
 * percentage of the multi-class being three-class of being
 * 24.4%, which is also close enough to "about 25%".
 *
 * @param characterRace
 * @param multiClassProbability
 */
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
    if (rollDice(100) <= 30) {
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
    if (allowedClassesByRace[race]?.includes(candidateClass)) {
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

    const validMultiClass = allowedMultiClassCombinationsByRace[characterRace]
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

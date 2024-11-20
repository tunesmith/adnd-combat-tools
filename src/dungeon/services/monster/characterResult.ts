import { rollDice } from "../../helpers/dungeonLookup";
import { CharacterClass } from "../../../tables/dungeon/monster/character/characterClass";
import { characterMax } from "../../models/characterMax";
import { getCharacterLevel } from "../../helpers/character/getCharacterLevel";
import { getHenchmanLevel } from "../../helpers/character/getHenchmanLevel";
import {
  CharacterSheet,
  PartyResult,
} from "../../models/character/characterSheet";
import { isCompatibleRace } from "../../helpers/party/isCompatibleRace";
import { isCompatibleClass } from "../../helpers/party/isCompatibleClass";
import { getNumberOfClasses } from "../../helpers/character/getNumberOfClasses";
import { getCharacterRace } from "../../helpers/character/getCharacterRace";
import { getRandomClassForRace } from "../../helpers/character/getRandomClassForRace";
import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import { allowedMultiClassCombinationsByRace } from "../../models/allowedMultiClassCombinationsByRace";
import { getCharacterClass } from "../../helpers/character/getCharacterClass";
import { Gender } from "../../models/character/gender";
import { getAttributes } from "../../helpers/character/attributes/getAttributes";
import { getProfessions } from "../../helpers/character/getProfessions";

/**
 * There are some tricky intricacies here having to do with whether a generated
 * NPC can truly join the party in question.
 *
 * We solve this by moving in stages, from the most general to the most specific.
 *
 * What seems to make sense is to pick the race first, and then try again if we
 * have generated an incompatible race.
 *
 * What's next is to generate how many classes that race has, knowing that elves
 * and half-elves can sometimes have three classes.
 *
 * @param charactersCount
 * @param characterLevel
 */
export const createMainParty = (
  charactersCount: number,
  characterLevel: number
): CharacterSheet[] => {
  const counts: Record<CharacterClass, number> = Object.fromEntries(
    Object.values(CharacterClass).map((c) => [c, 0])
  ) as Record<CharacterClass, number>;

  const party: CharacterSheet[] = [];

  while (party.length < charactersCount) {
    const characterRace = getCharacterRace();
    if (!isCompatibleRace(characterRace, party)) {
      continue; // skip if race is incompatible with who is already in the party
    }

    // humans are always 1 class, non-humans are sometimes 2 or even 3
    const numClasses = getNumberOfClasses(characterRace);

    // Generate the character sheet
    const characterSheet =
      numClasses === 1
        ? getRandomClassForRace(characterRace, characterLevel) // Single-class
        : getMultiClassForRace(characterRace, numClasses, characterLevel); // Multi-class

    // Check compatibility and limits
    const exceedsLimits = characterSheet.professions.some(
      (profession) =>
        !isCompatibleClass(profession.characterClass, party) ||
        counts[profession.characterClass] >=
          characterMax[profession.characterClass]
    );

    if (exceedsLimits) {
      continue; // Skip this character sheet entirely if any class is incompatible or exceeds the limit
    }

    // Update counts and add to the party
    characterSheet.professions.forEach((profession) => {
      counts[profession.characterClass]++;
    });

    party.push(characterSheet);
  }

  return party;
};

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

  const mainParty = createMainParty(charactersCount, characterLevel);
  // const mainParty = createParty([], charactersCount).map(
  //   (ch): PartyMember => ({
  //     level: characterLevel,
  //     characterClass: ch,
  //     characterRole: CharacterRole.Main,
  //   })
  // );

  // // Use the main party as the starting compatibility pool
  // const otherPartyMembers = createParty(
  //   mainParty.map((member) => member.characterClass),
  //   othersCount
  // ).map(
  //   (ch): PartyMember => ({
  //     level: otherLevel,
  //     characterClass: ch,
  //     characterRole: henchmen
  //       ? CharacterRole.Henchman
  //       : CharacterRole.ManAtArms,
  //   })
  // );

  console.log(`othersCount: ${othersCount}, otherLevel: ${otherLevel}`);

  return {
    mainCharacters: mainParty,
    otherCharacters: [],
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

/**
 * @param characterRace
 * @param numClasses
 * @param characterLevel
 */
function getMultiClassForRace(
  characterRace: CharacterRace,
  numClasses: number,
  characterLevel: number
): CharacterSheet {
  const selectedClasses: CharacterClass[] = [];

  // Step 1: Pre-filter valid combinations by race and number of classes
  let validCombinations = allowedMultiClassCombinationsByRace[
    characterRace
  ]?.filter((combo) => combo.length === numClasses); // Only combos of the correct size

  // Step 2: Generate classes until all are selected
  while (selectedClasses.length < numClasses) {
    const candidate = getCharacterClass();

    // Re-check validity for this candidate against remaining valid combinations
    const validMultiClass = validCombinations.some((combo) => {
      const includesCandidate = combo.includes(candidate);
      const isNotDuplicate = !selectedClasses.includes(candidate);
      return includesCandidate && isNotDuplicate;
    });

    if (validMultiClass) {
      selectedClasses.push(candidate);

      // Re-filter valid combinations after adding the new class
      validCombinations = validCombinations.filter((combo) =>
        combo.includes(candidate)
      );
    }
  }

  // Step 3: Classes are selected. Now, fill out the character sheet
  const genderRoll = rollDice(2);
  const gender = genderRoll === 1 ? Gender.Male : Gender.Female;
  const attributes = getAttributes(selectedClasses, characterRace, gender);
  const professions = getProfessions(
    characterRace,
    selectedClasses,
    attributes,
    characterLevel,
    numClasses
  );

  return {
    gender: gender,
    attributes: attributes,
    characterRace: characterRace,
    professions: professions,
  };
}

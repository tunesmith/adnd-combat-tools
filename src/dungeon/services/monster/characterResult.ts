import { rollDice } from "../../helpers/dungeonLookup";
import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
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
    console.log(`numClasses: ${numClasses} (sticking to single-class for now`);

    const characterSheet = getRandomClassForRace(characterRace, characterLevel);
    // const characterClasses =
    //   numClasses === 1
    //     ? [getRandomClassForRace(characterRace, characterLevel)] // Single-class
    //     : getMultiClass(characterRace, numClasses); // Multi-class

    characterSheet.professions.forEach((profession) => {
      if (!isCompatibleClass(profession.characterClass, party)) {
        return; // Skip this combination if any part is incompatible
      }
      if (
        counts[profession.characterClass] >=
        characterMax[profession.characterClass]
      ) {
        return; // Skip if max limit for this class is reached
      }
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

export const formatPartyResult = (result: PartyResult): string => {
  const charactersText = result.mainCharacters
    .map(
      (member) =>
        `${member.gender} ` +
        `${CharacterRace[member.characterRace]} ` +
        member.professions.map(
          (profession) =>
            `${CharacterClass[profession.characterClass]} (L${
              profession.level
            }) `
        ) +
        `STR${member.attributes.STR} INT${member.attributes.INT} WIS${member.attributes.WIS} ` +
        `DEX${member.attributes.DEX} CON${member.attributes.DEX} CHA${member.attributes.CHA}`
    )
    .join(",\n ");

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
 * Remember that WIS min 13 if a multi-classed half-elven cleric (!!)
 * It's the only special case that depends on both class and race,
 * and only for multi-classed. Weird.
 *
 * @param characterRace
 * @param numClasses
 */
// function getMultiClass(
//   characterRace: CharacterRace,
//   numClasses: number
// ): CharacterClass[] {
//   const selectedClasses: CharacterClass[] = [];
//   while (selectedClasses.length < numClasses) {
//     const roll = rollDice(characterClass.sides);
//     const candidate = getTableEntry(roll, characterClass);
//
//     const validMultiClass = allowedMultiClassCombinationsByRace[characterRace]
//       ?.filter((combo) => combo.length === numClasses) // Only combos of the right size
//       .some((combo) => {
//         const includesCandidate = combo.includes(candidate);
//         const isNotDuplicate = !selectedClasses.includes(candidate);
//         const matchesSelected = selectedClasses.every((cls) =>
//           combo.includes(cls)
//         );
//         return includesCandidate && isNotDuplicate && matchesSelected;
//       });
//
//     if (validMultiClass) {
//       selectedClasses.push(candidate);
//     }
//   }
//   return selectedClasses;
// }

// function createParty(
//   initialParty: CharacterClass[] = [],
//   partySize: number = 9
// ): CharacterClass[] {
//   const party: CharacterClass[] = [...initialParty];
//   const counts: Record<CharacterClass, number> = Object.fromEntries(
//     Object.values(CharacterClass).map((c) => [c, 0])
//   ) as Record<CharacterClass, number>;
//
//   // Initialize counts based on the initial party
//   for (const member of initialParty) {
//     counts[member]++;
//   }
//
//   while (party.length < partySize) {
//     const nonHumanRoll = rollDice(100);
//     const characterRace = nonHumanRoll <= 20 ? getRace() : CharacterRace.Human;
//     const multiClassProbability = rollDice(100);
//     const numClasses = getNumberOfClasses(characterRace, multiClassProbability);
//
//     const characterClasses =
//       numClasses === 1
//         ? [getRandomClassForRace(characterRace)] // Single-class
//         : getMultiClass(characterRace, numClasses); // Multi-class
//
//     characterClasses.forEach((candidate) => {
//       if (!isCompatibleClass(candidate, party)) {
//         return; // Skip this combination if any part is incompatible
//       }
//       if (counts[candidate] >= characterMax[candidate]) {
//         return; // Skip if max limit for this class is reached
//       }
//       party.push(candidate);
//       counts[candidate]++;
//     });
//   }
//
//   return party;
// }

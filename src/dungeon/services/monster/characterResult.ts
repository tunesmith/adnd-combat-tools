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
import { allowedNpcClassesByRace } from "../../models/allowedNpcClassesByRace";
import { getCharacterLevel } from "../../helpers/character/getCharacterLevel";
import { getHenchmanLevel } from "../../helpers/character/getHenchmanLevel";
import { getMaxLevel } from "../../helpers/character/getMaxLevel";
import { Attribute, Attributes } from "../../models/attributes";
import { Gender } from "../../models/character/gender";
import {
  CharacterSheet,
  PartyResult,
} from "../../models/character/characterSheet";
import { isCompatibleRace } from "../../helpers/party/isCompatibleRace";
import { isCompatibleClass } from "../../helpers/party/isCompatibleClass";
import { getNumberOfClasses } from "../../helpers/character/getNumberOfClasses";
import { rollAttribute } from "../../helpers/character/attributes/rollAttribute";

export const createMainParty = (
  charactersCount: number,
  characterLevel: number
): CharacterSheet[] => {
  const counts: Record<CharacterClass, number> = Object.fromEntries(
    Object.values(CharacterClass).map((c) => [c, 0])
  ) as Record<CharacterClass, number>;

  const party: CharacterSheet[] = [];

  while (party.length < charactersCount) {
    const nonHumanRoll = rollDice(100);
    const characterRace = nonHumanRoll <= 20 ? getRace() : CharacterRace.Human;

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

const getRace = (): CharacterRace => {
  const raceRoll = rollDice(characterRace.sides);
  return getTableEntry(raceRoll, characterRace);
};

/**
 * Level restrictions are tricky here because the DMG leaves this fairly
 * undefined. It just says:
 *
 * "If the profession of the character or henchman is very limited or
 * impossible for the race, use it, or its closest approximation, as
 * one of two or three classes of the individual."
 *
 * This is one of the rare 100% contradictory instructions in the DMG,
 * as it is immediately contradicted by describing a different method
 * for determining multi-class occurrence, one that isn't compatible
 * with simply *choosing* to make a single-class character a multi-class
 * character.
 *
 * But more relevantly, there is no indication of what "very limited"
 * means. It can only mean level limitations. But what is the cutoff
 * point?
 *
 * One clue I found in PHB is this statement:
 *
 * As halflings ore unable to work beyond 6th level as fighters, it is
 * most probable that the character will be a thief or a multi-classed
 * fighter/thief.
 *
 * This is weak evidence of 6th level being a cutoff, though, as there
 * isn't similar language for the half-elf or half-orc being limited
 * as cleric, at L5 and L4 respectively.
 *
 * We're left to try to intuit something that is as close to BtB intent
 * as possible, while also avoiding contradicting anything as much as
 * possible.
 *
 * For a single-class case like this, I think the most straightforward
 * interpretation would be to simply allow the class if the class's
 * maximum level *equals or exceeds* the characterLevel parameter.
 * Otherwise, we should re-roll.
 *
 * @param characterRace
 * @param characterLevel
 */
function getRandomClassForRace(
  characterRace: CharacterRace,
  characterLevel: number
): CharacterSheet {
  while (true) {
    // Roll a random class based on the character table
    const roll = rollDice(characterClass.sides); // e.g., d100 for a 100-sided table
    const candidateClass = getTableEntry(roll, characterClass);

    // Check if the class is valid for the race
    if (allowedNpcClassesByRace[characterRace]?.includes(candidateClass)) {
      const genderRoll = rollDice(2);
      const gender = genderRoll === 1 ? Gender.Male : Gender.Female;
      const attributes = getAttributes(candidateClass, characterRace, gender);

      if (
        getMaxLevel(characterRace, candidateClass, attributes) >= characterLevel
      ) {
        return {
          characterRace: characterRace,
          gender: gender,
          attributes: attributes,
          professions: [
            {
              characterClass: candidateClass,
              level: characterLevel,
            },
          ],
        };
      }
    }
    // Otherwise, re-roll
  }
}

/**
 * For NPCs, we're following the rule of 3d6 for normal attributes,
 * and 4d6 for "key" attributes for a class. On top of that, we then
 * adjust them by the values specified in the NPC generation sections
 * of the DMG, and the race adjustments (including min/max) of the PHB.
 * We do not allocate scores; we roll them in order.
 *
 * @param candidateClass
 * @param candidateRace
 * @param gender
 */
const getAttributes = (
  candidateClass: CharacterClass,
  candidateRace: CharacterRace,
  gender: Gender
): Attributes => {
  return {
    STR: rollAttribute(
      Attribute.Strength,
      candidateClass,
      candidateRace,
      gender
    ),
    INT: rollAttribute(
      Attribute.Intelligence,
      candidateClass,
      candidateRace,
      gender
    ),
    WIS: rollAttribute(Attribute.Wisdom, candidateClass, candidateRace, gender),
    DEX: rollAttribute(
      Attribute.Dexterity,
      candidateClass,
      candidateRace,
      gender
    ),
    CON: rollAttribute(
      Attribute.Constitution,
      candidateClass,
      candidateRace,
      gender
    ),
    CHA: rollAttribute(
      Attribute.Charisma,
      candidateClass,
      candidateRace,
      gender
    ),
  };
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

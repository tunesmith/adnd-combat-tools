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
import { allowedNpcClassesByRace } from "../../models/allowedNpcClassesByRace";
import { getCharacterLevel } from "../../helpers/character/getCharacterLevel";
import { getHenchmanLevel } from "../../helpers/character/getHenchmanLevel";
import { incompatibleRaces } from "../../models/incompatibleRaces";
import raceAttributes from "../../models/raceAttributes";
import { npcClassAttributes } from "../../models/npcClassAttributes";

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

interface CharacterProfession {
  level: number;
  characterClass: CharacterClass;
}

export enum Attribute {
  Strength = "STR",
  Intelligence = "INT",
  Wisdom = "WIS",
  Dexterity = "DEX",
  Constitution = "CON",
  Charisma = "CHA",
}

export interface Attributes extends Record<Attribute, number> {}

export enum Gender {
  Male = "M",
  Female = "F",
}

interface CharacterSheet {
  professions: CharacterProfession[];
  characterRace: CharacterRace;
  attributes: Attributes;
  gender: Gender;
}

interface PartyResult {
  mainCharacters: CharacterSheet[]; // The main party members
  otherCharacters: PartyMember[]; // Includes henchmen or men-at-arms
  henchmen: boolean; // Indicates if henchmen are present
}
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
 */
const getNumberOfClasses = (characterRace: CharacterRace): number => {
  const multiClassProbability = rollDice(100);
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

const getMaxLevel = (
  candidateRace: CharacterRace,
  candidateClass: CharacterClass,
  attributes: Attributes
): number => {
  switch (candidateRace) {
    case CharacterRace.Human:
      return Infinity;
    case CharacterRace.Dwarf:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 8;
        case CharacterClass.Fighter: {
          if (attributes.STR < 17) {
            return 7;
          } else if (attributes.STR === 17) {
            return 8;
          } else {
            return 9;
          }
        }
        case CharacterClass.Thief:
          return Infinity;
        case CharacterClass.Assassin:
          return 9;
        default:
          return 0;
      }
    case CharacterRace.Elf:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 7;
        case CharacterClass.Fighter: {
          if (attributes.STR < 17) {
            return 5;
          } else if (attributes.STR === 17) {
            return 6;
          } else {
            return 7;
          }
        }
        case CharacterClass.MagicUser: {
          if (attributes.INT < 17) {
            return 9;
          } else if (attributes.INT === 17) {
            return 10;
          } else {
            return 11;
          }
        }
        case CharacterClass.Thief:
          return Infinity;
        case CharacterClass.Assassin:
          return 10;
        default:
          return 0;
      }
    case CharacterRace.Gnome:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 7;
        case CharacterClass.Fighter: {
          if (attributes.STR < 18) {
            return 5;
          } else {
            return 6;
          }
        }
        case CharacterClass.Illusionist: {
          if (attributes.INT < 17 || attributes.DEX < 17) {
            return 5;
          } else if (attributes.INT === 17 && attributes.DEX === 17) {
            return 6;
          } else {
            return 7;
          }
        }
        case CharacterClass.Thief:
          return Infinity;
        case CharacterClass.Assassin:
          return 8;
        default:
          return 0;
      }
    case CharacterRace.HalfElf:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 5;
        case CharacterClass.Druid:
          return Infinity;
        case CharacterClass.Fighter: {
          if (attributes.STR < 17) {
            return 6;
          } else if (attributes.STR === 17) {
            return 7;
          } else {
            return 8;
          }
        }
        case CharacterClass.Ranger: {
          if (attributes.STR < 17) {
            return 6;
          } else if (attributes.STR === 17) {
            return 7;
          } else {
            return 8;
          }
        }
        case CharacterClass.MagicUser: {
          if (attributes.INT < 17) {
            return 6;
          } else if (attributes.INT === 17) {
            return 7;
          } else {
            return 8;
          }
        }
        case CharacterClass.Thief:
          return Infinity;
        case CharacterClass.Assassin:
          return 11;
        default:
          return 0;
      }
    case CharacterRace.Halfling:
      switch (candidateClass) {
        case CharacterClass.Druid:
          return 6;
        case CharacterClass.Fighter:
          return 4; // Hairfeet only
        case CharacterClass.Thief:
          return Infinity;
        default:
          return 0;
      }
    case CharacterRace.HalfOrc:
      switch (candidateClass) {
        case CharacterClass.Cleric:
          return 4;
        case CharacterClass.Fighter:
          return 10;
        case CharacterClass.Thief: {
          if (attributes.DEX < 17) {
            return 6;
          } else if (attributes.DEX === 17) {
            return 7;
          } else {
            return 8;
          }
        }
        case CharacterClass.Assassin:
          return Infinity;
        default:
          return 0;
      }
  }
};

const getAttributeDice = (
  attribute: Attribute,
  candidateClass: CharacterClass
): number => {
  switch (candidateClass) {
    case CharacterClass.Cleric:
      switch (attribute) {
        case Attribute.Wisdom:
          return 4;
        case Attribute.Strength:
          return 4;
        case Attribute.Constitution:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Druid:
      switch (attribute) {
        case Attribute.Wisdom:
          return 4;
        case Attribute.Charisma:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Fighter:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Constitution:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Paladin:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Intelligence:
          return 4;
        case Attribute.Wisdom:
          return 4;
        case Attribute.Constitution:
          return 4;
        case Attribute.Charisma:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Ranger:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Intelligence:
          return 4;
        case Attribute.Wisdom:
          return 4;
        case Attribute.Constitution:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.MagicUser:
      switch (attribute) {
        case Attribute.Intelligence:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Illusionist:
      switch (attribute) {
        case Attribute.Intelligence:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Thief:
      switch (attribute) {
        case Attribute.Intelligence:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Assassin:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Intelligence:
          return 4;
        case Attribute.Dexterity:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Monk:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Wisdom:
          return 4;
        case Attribute.Dexterity:
          return 4;
        case Attribute.Constitution:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.Bard:
      switch (attribute) {
        case Attribute.Strength:
          return 4;
        case Attribute.Intelligence:
          return 4;
        case Attribute.Wisdom:
          return 4;
        case Attribute.Dexterity:
          return 4;
        case Attribute.Constitution:
          return 4;
        case Attribute.Charisma:
          return 4;
        default:
          return 3;
      }
    case CharacterClass.ManAtArms:
      return 3;
    default:
      return 3;
  }
};

const rollAttributeDice = (dice: number): number => {
  if (dice < 3) {
    throw new Error("The number of dice must be at least 3");
  }

  // Roll the specified number of d6 dice
  const rolls: number[] = Array.from(
    { length: dice },
    () => Math.floor(Math.random() * 6) + 1
  );

  // Sort the rolls in descending order
  rolls.sort((a, b) => b - a);

  // Take the three highest rolls and sum them
  return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
};

const assessRacialPenalty = (
  attribute: Attribute,
  score: number,
  candidateRace: CharacterRace
) => {
  switch (candidateRace) {
    case CharacterRace.Dwarf:
      return attribute === Attribute.Charisma ? score - 2 : score;
    case CharacterRace.Elf:
      return attribute === Attribute.Constitution ? score - 1 : score;
    case CharacterRace.Gnome:
      return attribute === Attribute.Charisma ? score - 1 : score;
    case CharacterRace.Halfling:
      return attribute === Attribute.Strength ? score - 1 : score;
    case CharacterRace.HalfOrc:
      return attribute === Attribute.Charisma ? score - 2 : score;
    default:
      return score;
  }
};

const assessRacialBonus = (
  attribute: Attribute,
  score: number,
  candidateRace: CharacterRace
) => {
  switch (candidateRace) {
    case CharacterRace.Dwarf:
      switch (attribute) {
        case Attribute.Strength:
          return score + 1;
        case Attribute.Constitution:
          return score + 2;
        default:
          return score;
      }
    case CharacterRace.Elf:
      switch (attribute) {
        case Attribute.Intelligence:
          return score + 1;
        case Attribute.Dexterity:
          return score + 2;
        default:
          return score;
      }
    case CharacterRace.Gnome:
      switch (attribute) {
        case Attribute.Wisdom:
          return score + 1;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterRace.Halfling:
      switch (attribute) {
        case Attribute.Dexterity:
          return score + 2;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterRace.HalfOrc:
      switch (attribute) {
        case Attribute.Strength:
          return score + 1;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    default:
      return score;
  }
};

const assessNpcBonus = (
  attribute: Attribute,
  score: number,
  candidateClass: CharacterClass
) => {
  switch (candidateClass) {
    case CharacterClass.Cleric:
      return attribute === Attribute.Wisdom ? score + 2 : score;
    case CharacterClass.Fighter:
      switch (attribute) {
        case Attribute.Strength:
          return score + 2;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterClass.Ranger:
      switch (attribute) {
        case Attribute.Strength:
          return score + 2;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterClass.Paladin:
      switch (attribute) {
        case Attribute.Strength:
          return score + 2;
        case Attribute.Constitution:
          return score + 1;
        default:
          return score;
      }
    case CharacterClass.MagicUser:
      switch (attribute) {
        case Attribute.Intelligence:
          return score + 2;
        case Attribute.Dexterity:
          return score + 1;
        default:
          return score;
      }
    case CharacterClass.Thief:
      switch (attribute) {
        case Attribute.Intelligence:
          return score + 1;
        case Attribute.Dexterity:
          return score + 2;
        default:
          return score;
      }
    case CharacterClass.Assassin:
      switch (attribute) {
        case Attribute.Strength:
          return score + 1;
        case Attribute.Intelligence:
          return score + 1;
        case Attribute.Dexterity:
          return score + 2;
        default:
          return score;
      }
    default:
      return score;
  }
};

const rollAttribute = (
  attribute: Attribute,
  candidateClass: CharacterClass,
  candidateRace: CharacterRace,
  gender: Gender
): number => {
  const dice = getAttributeDice(attribute, candidateClass);
  const rawScore = rollAttributeDice(dice);
  // Now for each raw score I need to adjust it in several ways.
  // First, I'll adjust it downward by racial penalty. Since we adjust
  // upward later, I don't want to risk adjusting it downward below a
  // race/class minimum.
  const racePenaltyAdjustedScore = assessRacialPenalty(
    attribute,
    rawScore,
    candidateRace
  );

  // Next, I'll adjust it upward to race minimums.
  const raceRange = raceAttributes[candidateRace][gender][attribute];
  const raceMinAdjustedScore = Math.max(
    racePenaltyAdjustedScore,
    raceRange.min
  );

  // Next, I'll adjust it upward to class minimums.
  const classRange = npcClassAttributes[candidateClass][attribute];
  const classMinAdjustedScore = Math.max(raceMinAdjustedScore, classRange.min);

  // Now we'll apply race bonuses
  const raceBonusAdjustedScore = assessRacialBonus(
    attribute,
    classMinAdjustedScore,
    candidateRace
  );

  // Then, there are the additional DMG results
  const npcAdjustedScore = assessNpcBonus(
    attribute,
    raceBonusAdjustedScore,
    candidateClass
  );

  // Now we are done with upward adjustments, need to adjust *downward*
  // for race and class maximums
  const raceMaxAdjustedScore = Math.min(npcAdjustedScore, raceRange.max);
  const classMaxAdjustedScore = Math.min(raceMaxAdjustedScore, classRange.max);

  // Finally, I need to do some special handling for fighter exceptional strength,
  // Since there are race/gender limits for this score.
  return getStrengthAdjustedScore(
    attribute,
    candidateClass,
    candidateRace,
    gender,
    classMaxAdjustedScore
  );
};

/**
 * I may regret this, but I think I can just store Strength as a
 * decimal, where 18.00 is interpreted as raw 18 for non-fighters,
 * and 18/100 for fighters.
 *
 * @param attribute
 * @param candidateClass
 * @param candidateRace
 * @param gender
 * @param score
 */
const getStrengthAdjustedScore = (
  attribute: Attribute,
  candidateClass: CharacterClass,
  candidateRace: CharacterRace,
  gender: Gender,
  score: number
): number => {
  if (
    attribute === Attribute.Strength &&
    (candidateClass === CharacterClass.Fighter ||
      candidateClass === CharacterClass.Paladin ||
      candidateClass === CharacterClass.Ranger) &&
    score === 18
  ) {
    switch (candidateRace) {
      case CharacterRace.Human:
        return gender === Gender.Male
          ? getExceptionalStrength(100)
          : getExceptionalStrength(50);
      case CharacterRace.Dwarf:
        return gender === Gender.Male ? getExceptionalStrength(99) : score;
      case CharacterRace.Elf:
        return gender === Gender.Male ? getExceptionalStrength(75) : score;
      case CharacterRace.Gnome:
        return gender === Gender.Male ? getExceptionalStrength(50) : score;
      case CharacterRace.HalfElf:
        return gender === Gender.Male ? getExceptionalStrength(90) : score;
      case CharacterRace.Halfling:
        return score;
      case CharacterRace.HalfOrc:
        return gender === Gender.Male
          ? getExceptionalStrength(99)
          : getExceptionalStrength(75);
      default:
        return score;
    }
  }
  return score;
};

/**
 * Rather than roll d100 and cap it, I think it's better to
 * scale, as otherwise female human fighters with 18 strength
 * would be 50% likely to be clustered at 18/50, which seems
 * silly.
 *
 * For human male fighters, we can consider a raw 18 as 18/00,
 * since a raw 18 is otherwise impossible for a fighter.
 *
 * @param max
 */
const getExceptionalStrength = (max: number): number => {
  const exceptionalStrength = rollDice(max) / 100;
  return exceptionalStrength === 1 ? 18 : 18 + exceptionalStrength;
};

/**
 * For NPCs, we're following the rule of 3d6 for normal attributes,
 * and 4d6 for "key" attributes for a class. On top of that, we then
 * adjust them by the values specified in the NPC generation sections
 * of the DMG, and the race adjustments (including min/max) of the PHB.
 * We do not allocate scores; we roll them in order.
 *
 * TODO Exceptional Strength? I guess not yet, not until after it is
 *  clear they are a fighter
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

function isCompatibleClass(
  candidate: CharacterClass,
  party: CharacterSheet[]
): boolean {
  // Check if candidate conflicts with any existing party members
  for (const sheet of party) {
    for (const profession of sheet.professions) {
      if (
        incompatibleClasses[profession.characterClass]?.includes(candidate) ||
        incompatibleClasses[candidate]?.includes(profession.characterClass)
      ) {
        return false;
      }
    }
  }

  return true;
}

const isCompatibleRace = (
  candidateRace: CharacterRace,
  party: CharacterSheet[]
): boolean => {
  for (const member of party) {
    if (
      incompatibleRaces[member.characterRace].includes(candidateRace) ||
      incompatibleRaces[candidateRace].includes(member.characterRace)
    ) {
      return false;
    }
  }

  return true;
};

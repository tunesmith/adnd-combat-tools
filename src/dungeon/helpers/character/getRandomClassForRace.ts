import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import { CharacterSheet } from "../../models/character/characterSheet";
import { getTableEntry, rollDice } from "../dungeonLookup";
import { characterClass } from "../../../tables/dungeon/monster/character/characterClass";
import { allowedNpcClassesByRace } from "../../models/allowedNpcClassesByRace";
import { Gender } from "../../models/character/gender";
import { getAttributes } from "./attributes/getAttributes";
import { getMaxLevel } from "./getMaxLevel";

/**
 * Level restrictions are tricky here because the DMG leaves this fairly
 * undefined. It just says:
 *
 * "If the profession of the character or henchman is very limited or
 * impossible for the race, use it, or its closest approximation, as
 * one of two or three classes of the individual."
 *
 * The indication is that a level-limited class would only be
 * attractive to a non-human if part of a multi-class.
 *
 * This is one of the rare 100% contradictory instructions in the DMG,
 * as it is immediately contradicted by describing a different method
 * for determining multi-class occurrence, one that isn't compatible
 * with simply *choosing* to make a single-class character a multi-class
 * character. The problem is if we use probability to determine whether
 * a non-human is multi-class, but then *also* assign a non-human to
 * multi-class if they roll a level-limited class, then we would end
 * up with an improperly high probability of multi-class non-humans.
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
 * as cleric, at L5 and L4 respectively. (I should also note that in
 * most circumstances, however, the halfling would actually be limited
 * to L4, as Hairfeet are limited to L4, and Hairfeet are most typical.)
 *
 * We're left to try to intuit something that is as close to BtB intent
 * as possible, while also avoiding contradicting anything as much as
 * possible.
 *
 * For a single-class case like this, I think the most straightforward
 * interpretation would be to simply allow the class if the class's
 * maximum level *equals or exceeds* the characterLevel parameter.
 * Otherwise, we should re-roll. Reasoning: why would such a restricted
 * character be exploring such a deep level of the dungeon?
 *
 * @param characterRace
 * @param characterLevel
 */
export function getRandomClassForRace(
  characterRace: CharacterRace,
  characterLevel: number
): CharacterSheet {
  while (true) {
    // Roll a random class based on the character table
    const roll = rollDice(characterClass.sides); // e.g., d100 for a 100-sided table
    const candidateClass = getTableEntry(roll, characterClass);

    // First if the class is even allowed for the race
    if (allowedNpcClassesByRace[characterRace]?.includes(candidateClass)) {
      const genderRoll = rollDice(2);
      const gender = genderRoll === 1 ? Gender.Male : Gender.Female;
      // We need attributes as some max levels are dependent on attribute scores
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

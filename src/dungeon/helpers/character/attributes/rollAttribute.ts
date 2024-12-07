import { Attribute } from "../../../models/attributes";
import { CharacterRace } from "../../../../tables/dungeon/monster/character/characterRace";
import { Gender } from "../../../models/character/gender";
import { getAttributeDice } from "./getAttributeDice";
import { rollAttributeDice } from "./rollAttributeDice";
import { assessRacialPenalty } from "./assessRacialPenalty";
import raceAttributeLimits from "../../../models/raceAttributeLimits";
import { npcClassAttributeLimits } from "../../../models/npcClassAttributeLimits";
import { assessRacialBonus } from "./assessRacialBonus";
import { assessNpcClassBonus } from "./assessNpcClassBonus";
import { getStrengthAdjustedScore } from "./fighter/getStrengthAdjustedScore";
import { CharacterClass } from "../../../models/characterClass";

/**
 * Rolling a single attribute for an NPC is actually rather complicated.
 * You have to figure out how many dice to roll, roll them, adjust by
 * racial minimums and maximums, adjust by class minimums, adjust by
 * racial penalties and bonuses, adjust by additional NPC class bonuses,
 * and roll exceptional strength when relevant!
 *
 * And in the right order!
 *
 * @param attribute
 * @param candidateClasses
 * @param candidateRace
 * @param gender
 */
export const rollAttribute = (
  attribute: Attribute,
  candidateClasses: CharacterClass[],
  candidateRace: CharacterRace,
  gender: Gender
): number => {
  const dice = getAttributeDice(attribute, candidateClasses);
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
  const raceRange = raceAttributeLimits[candidateRace][gender][attribute];
  const raceMinAdjustedScore = Math.max(
    racePenaltyAdjustedScore,
    raceRange.min
  );

  // Next, I'll adjust it upward to class minimums.
  // Calculate the maximum minimum score across all candidate classes
  const maxClassMin = Math.max(
    ...candidateClasses.map(
      (candidateClass) => npcClassAttributeLimits[candidateClass][attribute]
    )
  );
  // Adjust the score upward to the maximum of the race minimum and class minimums
  const classMinAdjustedScore = Math.max(raceMinAdjustedScore, maxClassMin);

  // Remember that WIS min 13 if a multi-classed half-elven cleric. Weird asterisk rule from PHB
  // that is mentioned both in cleric description and the wisdom table.
  const adjustedWisdomMinimum =
    attribute === Attribute.Wisdom &&
    candidateRace === CharacterRace.HalfElf &&
    candidateClasses.length > 1 &&
    candidateClasses.includes(CharacterClass.Cleric)
      ? 13
      : 0;

  const wisdomAdjustedScore = Math.max(
    classMinAdjustedScore,
    adjustedWisdomMinimum
  );

  // Now we'll apply race bonuses
  const raceBonusAdjustedScore = assessRacialBonus(
    attribute,
    wisdomAdjustedScore,
    candidateRace
  );

  // Then, there are the additional DMG class bonuses
  const npcAdjustedScore = assessNpcClassBonus(
    attribute,
    raceBonusAdjustedScore,
    candidateClasses
  );

  // Now we are done with upward adjustments, need to adjust *downward*
  // for race and class maximums
  const raceMaxAdjustedScore = Math.min(npcAdjustedScore, raceRange.max);

  // I used to also adjust downward by *class* maximum, but I realized I was just
  // always inferring that to be 18... and races can explicitly hit 19 sometimes,
  // and it's pretty clear that race should take precedence there. I couldn't think
  // of a case where "class maximum" would ever hold precedence over race maximum,
  // so I'm omitting that, and sticking with race maximum.

  // Finally, I need to do some special handling for fighter exceptional strength,
  // Since there are race/gender limits for this score.
  return getStrengthAdjustedScore(
    attribute,
    candidateClasses,
    candidateRace,
    gender,
    raceMaxAdjustedScore
  );
};

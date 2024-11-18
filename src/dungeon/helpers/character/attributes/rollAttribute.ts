import { Attribute } from "../../../models/attributes";
import { CharacterClass } from "../../../../tables/dungeon/monster/character/characterClass";
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
 * @param candidateClass
 * @param candidateRace
 * @param gender
 */
export const rollAttribute = (
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
  const raceRange = raceAttributeLimits[candidateRace][gender][attribute];
  const raceMinAdjustedScore = Math.max(
    racePenaltyAdjustedScore,
    raceRange.min
  );

  // Next, I'll adjust it upward to class minimums.
  const classRange = npcClassAttributeLimits[candidateClass][attribute];
  const classMinAdjustedScore = Math.max(raceMinAdjustedScore, classRange.min);

  // Now we'll apply race bonuses
  const raceBonusAdjustedScore = assessRacialBonus(
    attribute,
    classMinAdjustedScore,
    candidateRace
  );

  // Then, there are the additional DMG class bonuses
  const npcAdjustedScore = assessNpcClassBonus(
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

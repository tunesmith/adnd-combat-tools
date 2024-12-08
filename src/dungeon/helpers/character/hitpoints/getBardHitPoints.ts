import { BardLevels } from "../../../models/character/characterSheet";
import { Attributes } from "../../../models/attributes";
import { getHitPoints } from "../getHitPoints";
import { CharacterClass } from "../../../models/characterClass";

/**
 * The hit point calculation is affected by the following phrase in PHB 118:
 *
 * [...] the bard has as many hit dice as he or she has previously earned as a fighter
 * (plus the possible addition of those earned as a thief if that class level exceeds the
 * class level of fighter).
 *
 * This implies multi-classing rules, at least for hit point calculation. Therefore,
 * we can award thief hit points if the thief level *exceeds* that of the fighter level.
 * Otherwise, we stick with thief level, and award bard hit points after level 1 is
 * completed.
 *
 * @param bardLevels
 * @param constitution
 */
export const getBardHitPoints = (
  bardLevels: BardLevels,
  constitution: Attributes["CON"]
): number => {
  const fighterHitPoints = getHitPoints(
    [
      {
        level: bardLevels[CharacterClass.Fighter],
        characterClass: CharacterClass.Fighter,
      },
    ],
    constitution
  );
  const thiefHitPoints =
    bardLevels[CharacterClass.Thief] > bardLevels[CharacterClass.Fighter]
      ? getHitPoints(
          [
            {
              level: bardLevels[CharacterClass.Thief],
              characterClass: CharacterClass.Thief,
            },
          ],
          constitution,
          bardLevels[CharacterClass.Fighter]
        )
      : 0;

  const bardHitPoints =
    bardLevels[CharacterClass.Bard] > 0
      ? getHitPoints(
          [
            {
              level: bardLevels[CharacterClass.Bard],
              characterClass: CharacterClass.Bard,
            },
          ],
          constitution
        )
      : 0;

  return fighterHitPoints + thiefHitPoints + bardHitPoints;
};

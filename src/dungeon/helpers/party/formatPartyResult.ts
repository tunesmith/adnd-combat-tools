import { PartyResult } from "../../models/character/characterSheet";
import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import { CharacterClass } from "../../models/characterClass";

/**
 * This is probably temporary, just be able to output a string
 * representation, until I later create a React component for it
 *
 * @param result
 */
export const formatPartyResult = (result: PartyResult): string => {
  const charactersText = result.mainCharacters
    .map(
      (member) =>
        `${member.gender} ` +
        `${CharacterRace[member.characterRace]} ` +
        (member.isBard
          ? `${CharacterClass[CharacterClass.Bard]} (F${
              member.bardLevels[CharacterClass.Fighter]
            }/T${member.bardLevels[CharacterClass.Thief]}/B${
              member.bardLevels[CharacterClass.Bard]
            })`
          : member.professions
              .map(
                (profession) =>
                  `${CharacterClass[profession.characterClass]} (L${
                    profession.level
                  })`
              )
              .join(", ")) +
        " " +
        `STR${member.attributes.STR} INT${member.attributes.INT} WIS${member.attributes.WIS} ` +
        `DEX${member.attributes.DEX} CON${member.attributes.CON} CHA${member.attributes.CHA} ` +
        `(hp: ${member.hitPoints})` +
        member.followers.map(
          (follower) =>
            `\n    ${follower.gender} ` +
            `${CharacterRace[follower.characterRace]} ` +
            (follower.isBard
              ? `${CharacterClass[CharacterClass.Bard]} (F${
                  follower.bardLevels[CharacterClass.Fighter]
                }/T${follower.bardLevels[CharacterClass.Thief]}/B${
                  follower.bardLevels[CharacterClass.Bard]
                })`
              : follower.professions
                  .map(
                    (profession) =>
                      `${CharacterClass[profession.characterClass]} (L${
                        profession.level
                      })`
                  )
                  .join(", ")) +
            " " +
            `STR${follower.attributes.STR} INT${follower.attributes.INT} WIS${follower.attributes.WIS} ` +
            `DEX${follower.attributes.DEX} CON${follower.attributes.CON} CHA${follower.attributes.CHA} ` +
            `(hp: ${follower.hitPoints})`
        )
    )
    .join(",\n ");

  return `
    Main Characters:\n ${charactersText}
  `.trim();
};

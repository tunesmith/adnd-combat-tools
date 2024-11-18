import { PartyResult } from "../../models/character/characterSheet";
import { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import { CharacterClass } from "../../../tables/dungeon/monster/character/characterClass";

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

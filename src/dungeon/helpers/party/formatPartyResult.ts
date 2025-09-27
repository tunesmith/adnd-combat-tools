import type {
  CharacterSheet,
  PartyResult,
} from '../../models/character/characterSheet';
import { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import { CharacterClass } from '../../models/characterClass';

export type PartySummaryMember = {
  member: string;
  followers: string[];
};

export type PartySummary = {
  main: PartySummaryMember[];
  includesHenchmen: boolean;
};

export const summarizePartyResult = (result: PartyResult): PartySummary => {
  const main = result.mainCharacters.map((member) => ({
    member: formatCharacter(member),
    followers: member.followers.map((follower) => formatCharacter(follower)),
  }));

  return {
    main,
    includesHenchmen: result.henchmen,
  };
};

/**
 * This is probably temporary, just be able to output a string
 * representation, until I later create a React component for it
 *
 * @param result
 */
export const formatPartyResult = (result: PartyResult): string => {
  const summary = summarizePartyResult(result);
  const charactersText = summary.main
    .map((entry) => {
      const followerText = entry.followers
        .map((follower) => `    Follower: ${follower}`)
        .join('\n');
      return followerText.length > 0
        ? `${entry.member}\n${followerText}`
        : entry.member;
    })
    .join(',\n ');

  const henchmenText = summary.includesHenchmen
    ? '\n Includes henchmen capable of accompanying the party.'
    : '';

  return `
    Main Characters:\n ${charactersText}${henchmenText}
  `.trim();
};

function formatCharacter(character: CharacterSheet): string {
  const classText = character.isBard
    ? `${CharacterClass[CharacterClass.Bard]} (F${
        character.bardLevels[CharacterClass.Fighter]
      }/T${character.bardLevels[CharacterClass.Thief]}/B${
        character.bardLevels[CharacterClass.Bard]
      })`
    : character.professions
        .map(
          (profession) =>
            `${CharacterClass[profession.characterClass]} (L${
              profession.level
            })`
        )
        .join(', ');

  return (
    `${character.gender} ${
      CharacterRace[character.characterRace]
    } ${classText} ` +
    `STR${character.attributes.STR} INT${character.attributes.INT} WIS${character.attributes.WIS} ` +
    `DEX${character.attributes.DEX} CON${character.attributes.CON} CHA${character.attributes.CHA} ` +
    `(hp: ${character.hitPoints})`
  );
}

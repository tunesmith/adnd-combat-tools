import type {
  CharacterSheet,
  PartyResult,
} from '../../models/character/characterSheet';
import { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import { CharacterClass } from '../../models/characterClass';
import { Alignment } from '../../models/allowedAlignmentsByClass';

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
  const lines: string[] = ['Main Characters:'];
  summary.main.forEach((entry) => {
    lines.push(`- ${entry.member}`);
    entry.followers.forEach((follower) => {
      lines.push(`  - ${follower}`);
    });
  });

  if (summary.includesHenchmen) {
    lines.push('- Includes henchmen capable of accompanying the party.');
  }

  return lines.join('\n');
};

function formatCharacter(character: CharacterSheet): string {
  const alignmentCode = alignmentToCode(character.alignment);
  const classText = character.isManAtArms
    ? 'Man-at-Arms'
    : character.isBard
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
    `[${alignmentCode}] ${character.gender} ${
      CharacterRace[character.characterRace]
    } ${classText} ` +
    `STR${character.attributes.STR} INT${character.attributes.INT} WIS${character.attributes.WIS} ` +
    `DEX${character.attributes.DEX} CON${character.attributes.CON} CHA${character.attributes.CHA} ` +
    `(hp: ${character.hitPoints})`
  );
}

const alignmentCodeMap: Record<Alignment, string> = {
  [Alignment.LawfulGood]: 'LG',
  [Alignment.LawfulNeutral]: 'LN',
  [Alignment.LawfulEvil]: 'LE',
  [Alignment.NeutralGood]: 'NG',
  [Alignment.TrueNeutral]: 'N',
  [Alignment.NeutralEvil]: 'NE',
  [Alignment.ChaoticGood]: 'CG',
  [Alignment.ChaoticNeutral]: 'CN',
  [Alignment.ChaoticEvil]: 'CE',
};

function alignmentToCode(alignment: Alignment): string {
  return alignmentCodeMap[alignment] ?? 'N';
}

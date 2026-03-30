import type {
  CharacterSheet,
  PartyResult,
  CharacterProfession,
  BardLevels,
  CharacterMagicItem,
} from '../../models/character/characterSheet';
import type { Attributes } from '../../models/attributes';
import { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import { CharacterClass } from '../../models/characterClass';
import { Alignment } from '../../models/allowedAlignmentsByClass';
import type { Gender } from '../../models/character/gender';

export type PartyCharacterSummary = {
  alignment: Alignment;
  gender: Gender;
  characterRace: CharacterRace;
  hitPoints: number;
  attributes: Attributes;
  professions: CharacterProfession[];
  isBard: boolean;
  bardLevels: BardLevels;
  isManAtArms?: boolean;
  magicItems: CharacterMagicItem[];
};

type PartySummaryMember = {
  member: PartyCharacterSummary;
  followers: PartyCharacterSummary[];
};

export type PartySummary = {
  main: PartySummaryMember[];
  includesHenchmen: boolean;
};

export const summarizePartyResult = (result: PartyResult): PartySummary => {
  const main = result.mainCharacters.map((member) => ({
    member: toSummaryCharacter(member),
    followers: member.followers.map((follower) => toSummaryCharacter(follower)),
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
    lines.push(`- ${formatCharacterSummary(entry.member)}`);
    entry.followers.forEach((follower) => {
      lines.push(`  - ${formatCharacterSummary(follower)}`);
    });
  });

  if (summary.includesHenchmen) {
    lines.push('- Includes henchmen capable of accompanying the party.');
  }

  return lines.join('\n');
};

function formatCharacterSummary(character: PartyCharacterSummary): string {
  const alignmentCode = alignmentToCode(character.alignment);
  const classText = describeClasses(character);

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

export function alignmentToCode(alignment: Alignment): string {
  return alignmentCodeMap[alignment] ?? 'N';
}

const alignmentNameMap: Record<Alignment, string> = {
  [Alignment.LawfulGood]: 'Lawful Good',
  [Alignment.LawfulNeutral]: 'Lawful Neutral',
  [Alignment.LawfulEvil]: 'Lawful Evil',
  [Alignment.NeutralGood]: 'Neutral Good',
  [Alignment.TrueNeutral]: 'True Neutral',
  [Alignment.NeutralEvil]: 'Neutral Evil',
  [Alignment.ChaoticGood]: 'Chaotic Good',
  [Alignment.ChaoticNeutral]: 'Chaotic Neutral',
  [Alignment.ChaoticEvil]: 'Chaotic Evil',
};

export function alignmentToName(alignment: Alignment): string {
  return alignmentNameMap[alignment] ?? 'Neutral';
}

function toSummaryCharacter(character: CharacterSheet): PartyCharacterSummary {
  return {
    alignment: character.alignment,
    gender: character.gender,
    characterRace: character.characterRace,
    hitPoints: character.hitPoints,
    attributes: { ...character.attributes },
    professions: character.professions.map((profession) => ({
      characterClass: profession.characterClass,
      level: profession.level,
    })),
    isBard: character.isBard,
    bardLevels: { ...character.bardLevels },
    isManAtArms: character.isManAtArms,
    magicItems: (character.magicItems ?? []).map((item) => ({ ...item })),
  };
}

export function describeClasses(character: PartyCharacterSummary): string {
  if (character.isManAtArms) return 'Man-at-Arms';
  if (character.isBard) {
    const fighter = character.bardLevels[CharacterClass.Fighter];
    const thief = character.bardLevels[CharacterClass.Thief];
    const bardLevel = character.bardLevels[CharacterClass.Bard];
    return `Bard (F${fighter}/T${thief}/B${bardLevel})`;
  }
  if (character.professions.length === 0) return 'Unknown';
  return character.professions
    .map(
      (profession) =>
        `${CharacterClass[profession.characterClass]} (L${profession.level})`
    )
    .join(', ');
}

import type { CharacterSheet } from '../../models/character/characterSheet';
import { Alignment } from '../../models/allowedAlignmentsByClass';

const extremeConflicts = new Set<string>([
  `${Alignment.LawfulGood}:${Alignment.ChaoticEvil}`,
  `${Alignment.ChaoticEvil}:${Alignment.LawfulGood}`,
  `${Alignment.LawfulEvil}:${Alignment.ChaoticGood}`,
  `${Alignment.ChaoticGood}:${Alignment.LawfulEvil}`,
]);

const conflictExists = (a: Alignment, b: Alignment): boolean =>
  extremeConflicts.has(`${a}:${b}`);

const checkAgainstCharacter = (
  candidate: Alignment,
  character: CharacterSheet
): boolean => {
  if (conflictExists(candidate, character.alignment)) return false;
  for (const follower of character.followers) {
    if (!checkAgainstCharacter(candidate, follower)) return false;
  }
  return true;
};

export const isAlignmentCompatible = (
  candidate: Alignment,
  party: CharacterSheet[]
): boolean => {
  for (const member of party) {
    if (!checkAgainstCharacter(candidate, member)) return false;
  }
  return true;
};

export const areAlignmentsCompatible = (
  alignmentA: Alignment,
  alignmentB: Alignment
): boolean => !conflictExists(alignmentA, alignmentB);

import type { CharacterSheet } from '../../models/character/characterSheet';
import type { CharacterClass } from '../../models/characterClass';
import { allowedAlignmentsByClass } from '../../models/allowedAlignmentsByClass';

function classesOf(character: CharacterSheet): CharacterClass[] {
  return character.professions.map((p) => p.characterClass);
}

function isCandidateAllowedByMember(candidate: CharacterSheet, member: CharacterSheet): boolean {
  // Every class of the member must allow the candidate's alignment in its "others" set
  for (const cls of classesOf(member)) {
    const others = allowedAlignmentsByClass[cls]?.others ?? [];
    if (!others.includes(candidate.alignment)) return false;
  }
  // Recurse through followers
  for (const follower of member.followers) {
    if (!isCandidateAllowedByMember(candidate, follower)) return false;
  }
  return true;
}

function isMemberAllowedByCandidate(member: CharacterSheet, candidate: CharacterSheet): boolean {
  // Every class of the candidate must allow the member's alignment in its "others" set
  for (const cls of classesOf(candidate)) {
    const others = allowedAlignmentsByClass[cls]?.others ?? [];
    if (!others.includes(member.alignment)) return false;
  }
  // Check followers of the member as well
  for (const follower of member.followers) {
    if (!isMemberAllowedByCandidate(follower, candidate)) return false;
  }
  return true;
}

/**
 * Enforce class-specific party alignment rules: each class has an "others" list
 * describing which alignments it can adventure with. This checks both directions:
 * - the party must allow the candidate's alignment
 * - the candidate's class(es) must allow each party member's alignment
 */
export function isOthersAlignmentCompatible(
  candidate: CharacterSheet,
  party: CharacterSheet[]
): boolean {
  for (const member of party) {
    if (!isCandidateAllowedByMember(candidate, member)) return false;
    if (!isMemberAllowedByCandidate(member, candidate)) return false;
  }
  return true;
}

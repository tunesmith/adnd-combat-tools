import type { CharacterSheet } from '../../../models/character/characterSheet';
import { CharacterClass } from '../../../models/characterClass';

function getRestrictedFollowerClassesForProfession(
  profession: CharacterSheet['professions'][number]
): ReadonlySet<CharacterClass> | undefined {
  switch (profession.characterClass) {
    case CharacterClass.Monk:
      if (profession.level < 6) {
        return new Set<CharacterClass>();
      }
      return new Set<CharacterClass>([
        CharacterClass.Fighter,
        CharacterClass.Thief,
        CharacterClass.Assassin,
      ]);

    case CharacterClass.Assassin:
      if (profession.level < 4) {
        return new Set<CharacterClass>();
      }
      if (profession.level < 8) {
        return new Set<CharacterClass>([CharacterClass.Assassin]);
      }
      if (profession.level < 12) {
        return new Set<CharacterClass>([
          CharacterClass.Assassin,
          CharacterClass.Thief,
        ]);
      }
      return undefined;

    default:
      return undefined;
  }
}

function getRestrictedFollowerClassesForMember(
  member: CharacterSheet
): ReadonlySet<CharacterClass> | undefined {
  let restrictedClasses: Set<CharacterClass> | undefined;

  for (const profession of member.professions) {
    const professionRestriction =
      getRestrictedFollowerClassesForProfession(profession);
    if (!professionRestriction) {
      continue;
    }

    if (!restrictedClasses) {
      restrictedClasses = new Set(professionRestriction);
      continue;
    }

    restrictedClasses = new Set(
      Array.from(restrictedClasses).filter((characterClass) =>
        professionRestriction.has(characterClass)
      )
    );
  }

  return restrictedClasses;
}

export function isCompatibleFollowerForMember(
  member: CharacterSheet,
  candidate: CharacterSheet
): boolean {
  const restrictedClasses = getRestrictedFollowerClassesForMember(member);
  if (!restrictedClasses) {
    return true;
  }

  if (candidate.professions.length === 0) {
    return false;
  }

  return candidate.professions.every((profession) =>
    restrictedClasses.has(profession.characterClass)
  );
}

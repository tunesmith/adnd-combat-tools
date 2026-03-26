import { rollDice } from '../../helpers/dungeonLookup';
import { characterMax } from '../../models/characterMax';
import { getCharacterLevel } from '../../helpers/character/level/getCharacterLevel';
import { getHenchmanLevel } from '../../helpers/character/level/getHenchmanLevel';
import type {
  CharacterSheet,
  PartyResult,
} from '../../models/character/characterSheet';
import { isCompatibleRace } from '../../helpers/party/isCompatibleRace';
import { isCompatibleClass } from '../../helpers/party/isCompatibleClass';
import { getNumberOfClasses } from '../../helpers/character/class/getNumberOfClasses';
import { getCharacterRace } from '../../helpers/character/getCharacterRace';
import {
  getSingleClassCharacterForRace,
  LimitedClassFallbackError,
} from '../../helpers/character/getSingleClassCharacterForRace';
import { getMultiClassCharacterForRace } from '../../helpers/character/getMultiClassCharacterForRace';
import { CharacterClass } from '../../models/characterClass';
import { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import { canPartyHireHenchmen } from '../../helpers/party/canPartyHireHenchmen';
import { getMaxHenchmenForMember } from '../../helpers/character/henchmen/getMaxHenchmenForMember';
import { isCompatibleFollowerForMember } from '../../helpers/character/henchmen/isCompatibleFollowerForMember';
import {
  isAlignmentCompatible,
  areAlignmentsCompatible,
} from '../../helpers/party/isAlignmentCompatible';
import { createMenAtArms } from '../../helpers/character/createMenAtArms';
import { assignMagicItemsToParty } from '../../helpers/party/assignMagicItems';
import { isOthersAlignmentCompatible } from '../../helpers/party/isOthersAlignmentCompatible';

/**
 * There are some tricky intricacies here having to do with whether a generated
 * NPC can truly join the party in question.
 *
 * We solve this by moving in stages, from the most general to the most specific.
 *
 * What seems to make sense is to pick the race first, and then try again if we
 * have generated an incompatible race.
 *
 * What's next is to generate how many classes that race has, knowing that elves
 * and half-elves can sometimes have three classes.
 *
 * @param charactersCount
 * @param characterLevel
 * @param existingParty
 */
export const createCharacters = (
  charactersCount: number,
  characterLevel: number,
  existingParty: CharacterSheet[] = []
): CharacterSheet[] => {
  const counts: Record<CharacterClass, number> = Object.fromEntries(
    Object.values(CharacterClass).map((c) => [c, 0])
  ) as Record<CharacterClass, number>;
  // Avoid runaway attempts when stubs or extreme filters make generation impossible.
  const maxAttempts = Math.max(charactersCount * 200, 1000);
  let attempts = 0;

  // Initialize counts with counts from existing party
  existingParty.forEach((characterSheet) => {
    characterSheet.professions.forEach((profession) => {
      counts[profession.characterClass]++;
    });
    characterSheet.followers.forEach((follower) => {
      follower.professions.forEach((profession) => {
        counts[profession.characterClass]++;
      });
    });
  });

  // party is the number to generate in this invocation
  const newMembers: CharacterSheet[] = [];

  while (newMembers.length < charactersCount) {
    attempts++;
    if (attempts > maxAttempts) {
      break;
    }

    const characterRace = getCharacterRace();
    if (!isCompatibleRace(characterRace, [...newMembers, ...existingParty])) {
      continue; // skip if race is incompatible with who is already in the party
    }

    // humans are always 1 class, non-humans are sometimes 2 or even 3
    const numClasses = getNumberOfClasses(characterRace);

    // Generate the character sheet
    let characterSheet: CharacterSheet;
    try {
      characterSheet =
        numClasses === 1
          ? getSingleClassCharacterForRace(characterRace, characterLevel)
          : getMultiClassCharacterForRace(
              characterRace,
              numClasses,
              characterLevel
            );
    } catch (error) {
      if (error instanceof LimitedClassFallbackError) {
        const fallbackCounts: number[] = [2];
        if (
          characterRace === CharacterRace.Elf ||
          characterRace === CharacterRace.HalfElf
        ) {
          fallbackCounts.push(3);
        }

        let generatedFallback: CharacterSheet | undefined;
        for (const fallbackCount of fallbackCounts) {
          try {
            generatedFallback = getMultiClassCharacterForRace(
              characterRace,
              fallbackCount,
              characterLevel,
              [error.characterClass]
            );
            break;
          } catch {
            generatedFallback = undefined;
          }
        }

        if (!generatedFallback) {
          continue;
        }
        characterSheet = generatedFallback;
      } else {
        continue;
      }
    }

    // Check compatibility and limits
    const exceedsLimits = characterSheet.professions.some(
      (profession) =>
        !isCompatibleClass(profession.characterClass, [
          ...newMembers,
          ...existingParty,
        ]) ||
        counts[profession.characterClass] >=
          characterMax[profession.characterClass]
    );

    if (exceedsLimits) {
      continue; // Skip this character sheet entirely if any class is incompatible or exceeds the limit
    }

    const alignmentCompatible = isAlignmentCompatible(
      characterSheet.alignment,
      [...newMembers, ...existingParty]
    );
    if (!alignmentCompatible) {
      continue;
    }

    // Enforce class-specific party alignment constraints ("others" sets)
    if (
      !isOthersAlignmentCompatible(characterSheet, [
        ...newMembers,
        ...existingParty,
      ])
    ) {
      continue;
    }

    // Update counts and add to the party
    characterSheet.professions.forEach((profession) => {
      counts[profession.characterClass]++;
    });

    newMembers.push(characterSheet);
  }

  return newMembers;
};

/**
 * At this point, it is first necessary to check whether the main party is able to
 * hire a sufficient level of henchmen. This is based off of the level of the members,
 * their classes, and their charisma. If it is not viable, we will have to call
 * createMainParty again.
 *
 * @param charactersCount
 * @param characterLevel
 * @param othersCount
 * @param henchmenRequired
 */
export const createViableMainParty = (
  charactersCount: number,
  characterLevel: number,
  othersCount: number,
  henchmenRequired: boolean
): CharacterSheet[] => {
  let mainParty: CharacterSheet[];
  do {
    mainParty = createCharacters(charactersCount, characterLevel);
  } while (!canPartyHireHenchmen(mainParty, othersCount) && henchmenRequired);

  return mainParty;
};

export const generateFollowers = (
  mainParty: CharacterSheet[],
  numFollowers: number,
  followerLevel: number
): void => {
  let remainingFollowers = numFollowers;
  const isMenAtArms = followerLevel <= 0;
  while (remainingFollowers > 0) {
    let generatedFollowersThisPass = 0;
    for (const member of mainParty) {
      if (
        isMenAtArms &&
        member.professions.some(
          (profession) =>
            (profession.characterClass === CharacterClass.Ranger &&
              profession.level < 8) ||
            (profession.characterClass === CharacterClass.Assassin &&
              profession.level < 4)
        )
      ) {
        continue;
      }
      if (!isMenAtArms) {
        // Henchmen limits (class restrictions and CHA caps) do not apply to men-at-arms.
        const maxFollowersForMember = getMaxHenchmenForMember(
          member,
          mainParty
        );
        if (member.followers.length >= maxFollowersForMember) continue;
      }

      let follower: CharacterSheet | undefined;

      if (isMenAtArms) {
        const candidate = createMenAtArms(member);
        follower = candidate;
      } else {
        const henchmen = createCharacters(1, followerLevel, mainParty);
        if (henchmen.length === 0) continue;
        const candidate = henchmen[0];
        if (!candidate) continue;
        if (!isCompatibleFollowerForMember(member, candidate)) {
          continue;
        }
        if (!areAlignmentsCompatible(member.alignment, candidate.alignment)) {
          continue;
        }
        // Also require class-specific party alignment compatibility against the full party
        if (!isOthersAlignmentCompatible(candidate, mainParty)) {
          continue;
        }
        follower = candidate;
      }

      const assignedFollower = follower;
      if (!assignedFollower) continue;

      const followerCharacter: CharacterSheet = assignedFollower;
      const followerAlignment = followerCharacter.alignment;
      if (!areAlignmentsCompatible(member.alignment, followerAlignment)) {
        continue;
      }

      member.followers.push(followerCharacter);
      remainingFollowers--;
      generatedFollowersThisPass++;
      if (remainingFollowers <= 0) break;
    }
    // If no henchmen were generated in this pass, break to avoid infinite loop
    if (generatedFollowersThisPass === 0) {
      console.warn('No more eligible characters to generate henchmen.');
      break;
    }
  }
};

/**
 * DMG p11: rolling methods for characters and henchmen
 * DMG p100: stats adjustments and traits for NPCs
 * DMG p176: character party instructions
 *
 * @param monsterLevel
 * @param dungeonLevel
 */
export const characterResult = (
  monsterLevel: number,
  dungeonLevel: number
): PartyResult => {
  const charactersCount = rollDice(4) + 1;
  const othersCount = 9 - charactersCount;
  const henchmenRequired = dungeonLevel > 3;
  // levels are "base levels", which might change due to multi-classing
  const characterLevel = getCharacterLevel(monsterLevel, dungeonLevel);
  const otherLevel = henchmenRequired ? getHenchmanLevel(characterLevel) : 0;

  const mainParty = createViableMainParty(
    charactersCount,
    characterLevel,
    othersCount,
    henchmenRequired
  );

  generateFollowers(mainParty, othersCount, otherLevel);
  assignMagicItemsToParty(mainParty);
  // At this point, the main party is populated, and it's time to roll men-at-arms
  // or henchmen.
  //
  // const mainParty = createParty([], charactersCount).map(
  //   (ch): PartyMember => ({
  //     level: characterLevel,
  //     characterClass: ch,
  //     characterRole: CharacterRole.Main,
  //   })
  // );

  // // Use the main party as the starting compatibility pool
  // const otherPartyMembers = createParty(
  //   mainParty.map((member) => member.characterClass),
  //   othersCount
  // ).map(
  //   (ch): PartyMember => ({
  //     level: otherLevel,
  //     characterClass: ch,
  //     characterRole: henchmen
  //       ? CharacterRole.Henchman
  //       : CharacterRole.ManAtArms,
  //   })
  // );

  return {
    mainCharacters: mainParty,
    otherCharacters: [],
    henchmen: henchmenRequired,
  };
};

// Man-at-arms: 4-7 hit points each (DMG p30). I think this makes more sense
// than 1-6 hit points. On the other hand DMB p100 says "minimum of 4 hit points",
// and offers a constitution bonus. Hmm. I suppose that could lead to as many
// as eight hit points if taken literally. What's the point of a hit point
// bonus if 4-7 hp is prescribed? I think 4-7 hit points is for men-at-arms
// a party may encounter in the wild, but a rolled man-at-arms should be
// 1-6 with hit point bonuses applied (if any), minimum 4hp.

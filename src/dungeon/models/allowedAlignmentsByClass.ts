import { CharacterClass } from './characterClass';

export enum Alignment {
  LawfulGood,
  LawfulNeutral,
  LawfulEvil,
  NeutralGood,
  TrueNeutral,
  NeutralEvil,
  ChaoticGood,
  ChaoticNeutral,
  ChaoticEvil,
}

interface AlignmentRestrictions {
  self: Alignment[];
  others: Alignment[];
}

const allAlignments: Alignment[] = [
  Alignment.LawfulGood,
  Alignment.LawfulNeutral,
  Alignment.LawfulEvil,
  Alignment.NeutralGood,
  Alignment.TrueNeutral,
  Alignment.NeutralEvil,
  Alignment.ChaoticGood,
  Alignment.ChaoticNeutral,
  Alignment.ChaoticEvil,
];

/**
 * Like in {@link incompatibleClasses}, there is something of a judgment call
 * when considering Good and Evil.
 *
 * The PHB explicitly mentions Paladins (Lawful Good) cannot permanently travel
 * with non-good characters. But it doesn't mention Rangers (Good only) cannot.
 *
 * On the other hand, I think it's a reasonable inference that Rangers would
 * simply not get along with evil characters over time. For PC parties, a DM
 * may have the desire to negotiate that for a time before resolving it in
 * some fashion. But for NPC parties, I'd prefer to look at these kinds of
 * "role playing" challenges being avoided, since there are no actual players
 * involved to play them.
 *
 * So for NPC parties, we'll go ahead and consider Rangers as being incompatible
 * with Evil alignments in others.
 */
export const allowedAlignmentsByClass: Record<
  CharacterClass,
  AlignmentRestrictions
> = {
  [CharacterClass.Cleric]: {
    self: [
      // not true neutral
      Alignment.LawfulGood,
      Alignment.LawfulNeutral,
      Alignment.LawfulEvil,
      Alignment.NeutralGood,
      Alignment.NeutralEvil,
      Alignment.ChaoticGood,
      Alignment.ChaoticNeutral,
      Alignment.ChaoticEvil,
    ],
    others: allAlignments,
  },
  [CharacterClass.Druid]: {
    self: [Alignment.TrueNeutral],
    others: allAlignments,
  },
  [CharacterClass.Fighter]: {
    self: allAlignments,
    others: allAlignments,
  },
  [CharacterClass.Paladin]: {
    self: [Alignment.LawfulGood],
    others: [
      // can only be in a character party with Good members
      Alignment.LawfulGood,
      Alignment.NeutralGood,
      Alignment.ChaoticGood,
    ],
  },
  [CharacterClass.Ranger]: {
    self: [
      // Rangers must be Good
      Alignment.LawfulGood,
      Alignment.NeutralGood,
      Alignment.ChaoticGood,
    ],
    others: [
      // Rangers cannot be in a character party with Evil members
      Alignment.LawfulGood,
      Alignment.LawfulNeutral,
      Alignment.NeutralGood,
      Alignment.TrueNeutral,
      Alignment.ChaoticGood,
      Alignment.ChaoticNeutral,
    ],
  },
  [CharacterClass.MagicUser]: {
    self: allAlignments,
    others: allAlignments,
  },
  [CharacterClass.Illusionist]: {
    self: allAlignments,
    others: allAlignments,
  },
  [CharacterClass.Thief]: {
    self: [
      Alignment.LawfulNeutral,
      Alignment.LawfulEvil,
      Alignment.NeutralGood,
      Alignment.TrueNeutral,
      Alignment.NeutralEvil,
      Alignment.ChaoticNeutral,
      Alignment.ChaoticEvil,
    ],
    others: allAlignments,
  },
  [CharacterClass.Assassin]: {
    self: [Alignment.LawfulEvil, Alignment.NeutralEvil, Alignment.ChaoticEvil],
    others: allAlignments,
  },
  [CharacterClass.Monk]: {
    self: [
      Alignment.LawfulGood, // 50%
      Alignment.LawfulNeutral, // 35%
      Alignment.LawfulEvil, // 15%
    ],
    others: allAlignments,
  },
  [CharacterClass.Bard]: {
    self: [
      Alignment.LawfulNeutral,
      Alignment.NeutralGood,
      Alignment.TrueNeutral,
      Alignment.NeutralEvil,
      Alignment.ChaoticNeutral,
    ],
    others: allAlignments,
  },
  [CharacterClass.ManAtArms]: {
    self: allAlignments,
    others: allAlignments,
  },
};

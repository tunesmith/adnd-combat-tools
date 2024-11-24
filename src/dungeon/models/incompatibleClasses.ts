import { CharacterClass } from "./characterClass";

/**
 * Paladins clearly cannot be a member of a party with non-good characters,
 * and that includes Druids.
 *
 * I'm inferring Ranges and Assassins are not compatible either, due to
 * alignment conflict between good and evil.
 *
 * We check both ways, even though the standards don't go both ways. It's
 * Paladins and Rangers that have the moral standards; Druids and Assassins
 * probably don't care so much.
 */
export const incompatibleClasses: Record<CharacterClass, CharacterClass[]> = {
  [CharacterClass.Paladin]: [CharacterClass.Assassin, CharacterClass.Druid],
  [CharacterClass.Assassin]: [],
  [CharacterClass.Ranger]: [CharacterClass.Assassin],
  [CharacterClass.Cleric]: [],
  [CharacterClass.Druid]: [],
  [CharacterClass.Fighter]: [],
  [CharacterClass.MagicUser]: [],
  [CharacterClass.Illusionist]: [],
  [CharacterClass.Thief]: [],
  [CharacterClass.Monk]: [],
  [CharacterClass.Bard]: [],
  [CharacterClass.ManAtArms]: [],
};

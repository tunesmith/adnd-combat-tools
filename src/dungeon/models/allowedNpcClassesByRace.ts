import { CharacterRace } from "../../tables/dungeon/monster/character/characterRace";
import { CharacterClass } from "../../tables/dungeon/monster/character/characterClass";

/**
 * This is specifically for npc classes, so it's slightly more permissive
 * than those for player characters.
 *
 * There are some varied rules for halfling fighters with different
 * sub-races, but for purposes of NPC generation I'm sticking with the
 * more common Hairfeet.
 */
export const allowedNpcClassesByRace: Record<CharacterRace, CharacterClass[]> =
  {
    [CharacterRace.Human]: [
      CharacterClass.Cleric,
      CharacterClass.Druid,
      CharacterClass.Fighter,
      CharacterClass.Paladin,
      CharacterClass.Ranger,
      CharacterClass.MagicUser,
      CharacterClass.Illusionist,
      CharacterClass.Thief,
      CharacterClass.Assassin,
      CharacterClass.MonkBard,
    ],
    [CharacterRace.Dwarf]: [
      CharacterClass.Cleric, // 8, NPC only
      CharacterClass.Fighter, // STR <17 7; STR 17 8; STR 18 9
      CharacterClass.Thief, // U
      CharacterClass.Assassin, // 9
    ],
    [CharacterRace.Elf]: [
      CharacterClass.Cleric, // 7, NPC only
      CharacterClass.Fighter, // STR <17 5; STR 17 6; STR 18 7
      CharacterClass.MagicUser, // INT <17 9; INT 17 10; INT 18 11
      CharacterClass.Thief, // U
      CharacterClass.Assassin, // 10
    ],
    [CharacterRace.Gnome]: [
      CharacterClass.Cleric, // 7, NPC only
      CharacterClass.Fighter, // STR <18 5, STR 18 6
      CharacterClass.Illusionist, // INT|DEX <17 5; INT&DEX 17 6; INT|DEX 18 7
      CharacterClass.Thief, // U
      CharacterClass.Assassin, // 8
    ],
    [CharacterRace.HalfElf]: [
      CharacterClass.Cleric, // 5
      CharacterClass.Druid, // U
      CharacterClass.Fighter, // STR <17 6; STR 17 7; STR 18 8
      CharacterClass.Ranger, // STR <17 6; STR 17 7; STR 18 8
      CharacterClass.MagicUser, // INT <17 6; INT 17 7; INT 18 8
      CharacterClass.Thief, // U
      CharacterClass.Assassin, // 11
    ],
    [CharacterRace.Halfling]: [
      CharacterClass.Druid, // 6
      CharacterClass.Fighter, // Hairfeet 4; STR <17 4; Tallfellows STR 17 or Stouts STR 18 5; Tallfellows STR 18 6
      CharacterClass.Thief, // U
    ],
    [CharacterRace.HalfOrc]: [
      CharacterClass.Cleric, // 4
      CharacterClass.Fighter, // 10
      CharacterClass.Thief, // Dex <17 6; Dex 17 7, Dex 18 8
      CharacterClass.Assassin, // U
    ],
  };

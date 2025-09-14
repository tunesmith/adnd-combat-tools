import type { CharacterRace } from "../../../tables/dungeon/monster/character/characterRace";
import type { Attributes } from "../attributes";
import type { Gender } from "./gender";
import type { CharacterClass } from "../characterClass";

enum CharacterRole {
  Main,
  Henchman,
  ManAtArms,
}

interface PartyMember {
  level: number; // Character level (0 for men-at-arms)
  characterClass: CharacterClass; // Enum for character class
  characterRole: CharacterRole; // Role in the party
}

export interface CharacterProfession {
  level: number;
  characterClass: CharacterClass;
}

export interface BardLevels {
  [CharacterClass.Fighter]: number;
  [CharacterClass.Thief]: number;
  [CharacterClass.Bard]: number;
}
export interface CharacterSheet {
  professions: CharacterProfession[];
  characterRace: CharacterRace;
  attributes: Attributes;
  gender: Gender;
  hitPoints: number;
  isBard: boolean;
  bardLevels: BardLevels;
  followers: CharacterSheet[];
}

export interface PartyResult {
  mainCharacters: CharacterSheet[]; // The main party members
  otherCharacters: PartyMember[]; // Includes henchmen or men-at-arms
  henchmen: boolean; // Indicates if henchmen are present
}

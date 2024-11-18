export enum Attribute {
  Strength = "STR",
  Intelligence = "INT",
  Wisdom = "WIS",
  Dexterity = "DEX",
  Constitution = "CON",
  Charisma = "CHA",
}

export interface Attributes extends Record<Attribute, number> {}

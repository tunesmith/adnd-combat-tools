export enum Attribute {
  Strength = 'STR',
  Intelligence = 'INT',
  Wisdom = 'WIS',
  Dexterity = 'DEX',
  Constitution = 'CON',
  Charisma = 'CHA',
}

export type Attributes = Record<Attribute, number>;

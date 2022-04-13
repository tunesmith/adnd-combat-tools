/**
 * The creature data structure is a two-dimensional array.
 * Rows and Columns, like a basic spreadsheet matrix.
 * Each "Cell" can contain either a creature or an empty object.
 * The empty object *has* to be empty, so we define it as such here.
 */
export type EmptyObject = Record<any, never>;

/**
 * The initial version of the Creature was inefficient. We were
 * storing the actual string version of the armor type number,
 * which was unclear since AT 7 refers to four different types
 * of armor.
 */
export interface CreatureV1 {
  key: number;
  name?: string;
  class: string;
  level: string;
  armorType: string;
  armorClass: number;
  weapon: string;
}
export type StateV1 = (EmptyObject | CreatureV1)[][];

/**
 * For version 2, we transitioned to armor types with actual
 * numerical row ids, but it's still storing the actual string
 * value of the weapon name.
 */
export interface CreatureV2 {
  key: number;
  name?: string;
  class: string;
  level: string;
  armorType: number;
  armorClass: number;
  weapon: string;
}
export type StateV2 = (EmptyObject | CreatureV2)[][];

/**
 * For version 3, we transitioned to a numerical row id for
 * each weapon.
 */
export type CreatureV3 = {
  key: number;
  name?: string;
  class: string;
  level: string;
  armorType: number;
  armorClass: number;
  weapon: number;
};
export type StateV3 = (EmptyObject | CreatureV3)[][];

export type Creature = CreatureV3;
export type State = StateV3;

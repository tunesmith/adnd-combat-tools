// AD&D 1e DMG, printed p. 79, Saving Throw Matrix I and its class footnotes.
// Rows are minimum actual experience levels, followed by the five base targets.
export type SaveTargets = [number, number, number, number, number];
type Band = [number, ...SaveTargets];
export type SaveBasis = 'cleric' | 'fighter' | 'magic-user' | 'thief';
const saveMatrices: Record<SaveBasis, Band[]> = {
  cleric: [
    [1, 10, 13, 14, 16, 15],
    [4, 9, 12, 13, 15, 14],
    [7, 7, 10, 11, 13, 12],
    [10, 6, 9, 10, 12, 11],
    [13, 5, 8, 9, 11, 10],
    [16, 4, 7, 8, 10, 9],
    [19, 2, 5, 6, 8, 7],
  ],
  fighter: [
    [0, 16, 17, 18, 20, 19],
    [1, 14, 15, 16, 17, 17],
    [3, 13, 14, 15, 16, 16],
    [5, 11, 12, 13, 13, 14],
    [7, 10, 11, 12, 12, 13],
    [9, 8, 9, 10, 9, 11],
    [11, 7, 8, 9, 8, 10],
    [13, 5, 6, 7, 5, 8],
    [15, 4, 5, 6, 4, 7],
    [17, 3, 4, 5, 4, 6],
  ],
  'magic-user': [
    [1, 14, 13, 11, 15, 12],
    [6, 13, 11, 9, 13, 10],
    [11, 11, 9, 7, 11, 8],
    [16, 10, 7, 5, 9, 6],
    [21, 8, 5, 3, 7, 4],
  ],
  thief: [
    [1, 13, 12, 14, 16, 15],
    [5, 12, 11, 12, 15, 13],
    [9, 11, 10, 10, 14, 11],
    [13, 10, 9, 8, 13, 9],
    [17, 9, 8, 6, 12, 7],
    [21, 8, 7, 4, 11, 5],
  ],
};
export function baseSavingThrows(
  basis: SaveBasis,
  level: number
): SaveTargets | null {
  if (!Number.isInteger(level)) return null;
  const band = saveMatrices[basis].reduce<Band | undefined>(
    (previous, row) => (row[0] <= level ? row : previous),
    undefined
  );
  if (!band) return null;
  const [, poison, petrify, rods, breath, spell] = band;
  return [poison, petrify, rods, breath, spell];
}
export const saveCategories = [
  ['Poison', 'Paralyzation, poison or death magic'],
  ['Petrify', 'Petrification or polymorph, except polymorph wands'],
  ['Rods etc.', 'Rod, staff or wand'],
  ['Breath', 'Breath weapon, except petrification or polymorph'],
  ['Spell', 'Spell, where a different category is not specified'],
] as const;

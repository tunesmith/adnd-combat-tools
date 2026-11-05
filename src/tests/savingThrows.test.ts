import { baseSavingThrows } from '../tables/savingThrows';
import type { SaveBasis, SaveTargets } from '../tables/savingThrows';

// Independent endpoint fixtures from the rendered DMG p. 79 matrix.
const rows: [SaveBasis, number, number, SaveTargets][] = [
  ['cleric', 1, 3, [10, 13, 14, 16, 15]],
  ['cleric', 4, 6, [9, 12, 13, 15, 14]],
  ['cleric', 7, 9, [7, 10, 11, 13, 12]],
  ['cleric', 10, 12, [6, 9, 10, 12, 11]],
  ['cleric', 13, 15, [5, 8, 9, 11, 10]],
  ['cleric', 16, 18, [4, 7, 8, 10, 9]],
  ['cleric', 19, 100, [2, 5, 6, 8, 7]],
  ['fighter', 0, 0, [16, 17, 18, 20, 19]],
  ['fighter', 1, 2, [14, 15, 16, 17, 17]],
  ['fighter', 3, 4, [13, 14, 15, 16, 16]],
  ['fighter', 5, 6, [11, 12, 13, 13, 14]],
  ['fighter', 7, 8, [10, 11, 12, 12, 13]],
  ['fighter', 9, 10, [8, 9, 10, 9, 11]],
  ['fighter', 11, 12, [7, 8, 9, 8, 10]],
  ['fighter', 13, 14, [5, 6, 7, 5, 8]],
  ['fighter', 15, 16, [4, 5, 6, 4, 7]],
  ['fighter', 17, 100, [3, 4, 5, 4, 6]],
  ['magic-user', 1, 5, [14, 13, 11, 15, 12]],
  ['magic-user', 6, 10, [13, 11, 9, 13, 10]],
  ['magic-user', 11, 15, [11, 9, 7, 11, 8]],
  ['magic-user', 16, 20, [10, 7, 5, 9, 6]],
  ['magic-user', 21, 100, [8, 5, 3, 7, 4]],
  ['thief', 1, 4, [13, 12, 14, 16, 15]],
  ['thief', 5, 8, [12, 11, 12, 15, 13]],
  ['thief', 9, 12, [11, 10, 10, 14, 11]],
  ['thief', 13, 16, [10, 9, 8, 13, 9]],
  ['thief', 17, 20, [9, 8, 6, 12, 7]],
  ['thief', 21, 100, [8, 7, 4, 11, 5]],
];
test.each(rows)(
  '%s band %d–%d matches both printed boundaries',
  (basis, low, high, targets) => {
    expect(baseSavingThrows(basis, low)).toEqual(targets);
    expect(baseSavingThrows(basis, high)).toEqual(targets);
  }
);

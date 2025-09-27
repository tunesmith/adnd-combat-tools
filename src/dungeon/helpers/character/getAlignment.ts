import {
  allowedAlignmentsByClass,
  Alignment,
} from '../../models/allowedAlignmentsByClass';
import type { CharacterClass } from '../../models/characterClass';

const intersection = (arrays: Alignment[][]): Alignment[] => {
  if (arrays.length === 0) return [];
  return arrays.reduce((acc, current) =>
    acc.filter((value) => current.includes(value))
  );
};

const pickRandom = (options: Alignment[]): Alignment => {
  if (options.length === 0) {
    return Alignment.TrueNeutral;
  }
  const index = Math.floor(Math.random() * options.length);
  return options[index] ?? Alignment.TrueNeutral;
};

export const getAlignmentForClasses = (
  classes: CharacterClass[]
): Alignment => {
  if (classes.length === 0) {
    return Alignment.TrueNeutral;
  }
  const allowedSets = classes
    .map((cls) => allowedAlignmentsByClass[cls]?.self ?? [])
    .filter((set) => set.length > 0);

  if (allowedSets.length === 0) {
    throw new Error('No allowed alignments for provided class combination');
  }

  const possible = intersection(allowedSets);
  if (possible.length > 0) {
    return pickRandom(possible);
  }
  throw new Error('No compatible alignment intersection for class combination');
};

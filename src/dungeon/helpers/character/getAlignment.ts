import {
  allowedAlignmentsByClass,
  Alignment,
} from '../../models/allowedAlignmentsByClass';
import { CharacterClass } from '../../models/characterClass';
import { nextDungeonRandomInt } from '../dungeonRandom';

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
  const index = nextDungeonRandomInt(options.length) - 1;
  return options[index] ?? Alignment.TrueNeutral;
};

const pickMonkAlignment = (): Alignment => {
  const roll = nextDungeonRandomInt(100);
  if (roll <= 50) {
    return Alignment.LawfulGood;
  }
  if (roll <= 85) {
    return Alignment.LawfulNeutral;
  }
  return Alignment.LawfulEvil;
};

export const getAlignmentForClasses = (
  classes: CharacterClass[]
): Alignment => {
  if (classes.length === 0) {
    return Alignment.TrueNeutral;
  }
  if (classes.length === 1 && classes[0] === CharacterClass.Monk) {
    return pickMonkAlignment();
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

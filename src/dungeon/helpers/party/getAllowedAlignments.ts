// Function to compute intersection of multiple arrays
import type { CharacterClass } from '../../models/characterClass';
import { allowedAlignmentsByClass } from '../../models/allowedAlignmentsByClass';
import type { Alignment } from '../../models/allowedAlignmentsByClass';

const findIntersection = (arrays: Alignment[][]): Alignment[] => {
  return arrays.reduce((intersection, array) =>
    intersection.filter((item) => array.includes(item))
  );
};

// Function to compute allowed alignments for a given party
const getAllowedAlignments = (
  characterClasses: CharacterClass[]
): Alignment[] => {
  if (characterClasses.length === 0) {
    return []; // No character classes, no allowed alignments
  }

  // Extract `others` arrays for each class
  const othersArrays = characterClasses.map(
    (characterClass) => allowedAlignmentsByClass[characterClass].others
  );

  // Compute the intersection of all `others` arrays
  return findIntersection(othersArrays);
};

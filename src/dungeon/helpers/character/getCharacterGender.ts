import { Gender } from '../../models/character/gender';
import { rollDice } from '../dungeonLookup';

/**
 * I really just externalized this to mock it in unit tests.
 */
export const getCharacterGender = (): Gender =>
  rollDice(2) === 1 ? Gender.Male : Gender.Female;

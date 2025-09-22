import { rollAttribute } from '../../../../../../dungeon/helpers/character/attributes/rollAttribute';
import { Attribute } from '../../../../../../dungeon/models/attributes';
import { CharacterRace } from '../../../../../../tables/dungeon/monster/character/characterRace';
import { Gender } from '../../../../../../dungeon/models/character/gender';
import * as DiceUtils from '../../../../../../dungeon/helpers/character/attributes/rollAttributeDice';
import { CharacterClass } from '../../../../../../dungeon/models/characterClass';

jest.mock(
  '../../../../../../dungeon/helpers/character/attributes/rollAttributeDice',
  () => ({
    rollAttributeDice: jest.fn(),
  })
);

describe('rollAttribute', () => {
  const mockRollAttributeDice = DiceUtils.rollAttributeDice as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a valid attribute score for a single-class human fighter', () => {
    // Mock the dice roll to guarantee the same raw score
    mockRollAttributeDice.mockReturnValue(15);

    // rollAttributeDice()
    const result = rollAttribute(
      Attribute.Strength,
      [CharacterClass.Fighter],
      CharacterRace.Human,
      Gender.Male
    );

    expect(mockRollAttributeDice).toHaveBeenCalledWith(4); // Fighters roll 4 dice for strength
    expect(result).toBe(17);
  });

  it('should handle multi-class half-elf clerics with wisdom adjustment rule', () => {
    mockRollAttributeDice.mockReturnValue(10);

    const result = rollAttribute(
      Attribute.Wisdom,
      [CharacterClass.Cleric, CharacterClass.MagicUser],
      CharacterRace.HalfElf,
      Gender.Female
    );

    expect(mockRollAttributeDice).toHaveBeenCalledWith(4); // Clerics roll 4 dice for wisdom
    expect(result).toBe(15);
  });

  it('should apply racial bonuses and penalties correctly', () => {
    mockRollAttributeDice.mockReturnValue(14);

    const result = rollAttribute(
      Attribute.Constitution,
      [CharacterClass.Thief],
      CharacterRace.Dwarf,
      Gender.Male
    );

    expect(mockRollAttributeDice).toHaveBeenCalledWith(3); // Thieves roll 3 dice for constitution
    expect(result).toBe(16);
  });

  it('should cap scores at racial maximums', () => {
    mockRollAttributeDice.mockReturnValue(20); // Simulate a raw roll above the max

    const result = rollAttribute(
      Attribute.Charisma,
      [CharacterClass.Assassin],
      CharacterRace.HalfOrc,
      Gender.Male
    );

    expect(mockRollAttributeDice).toHaveBeenCalledWith(3); // Assassins roll 3 dice for charisma
    expect(result).toBe(12); // Half-Orcs have a charisma racial maximum of 12
  });

  it('should handle fighter exceptional strength correctly', () => {
    mockRollAttributeDice.mockReturnValue(18);

    const result = rollAttribute(
      Attribute.Strength,
      [CharacterClass.Fighter],
      CharacterRace.Human,
      Gender.Male
    );

    expect(mockRollAttributeDice).toHaveBeenCalledWith(4); // Fighters roll 4 dice for strength
    expect(result).toBeGreaterThanOrEqual(18); // Strength starts at 18
    // Exceptional strength logic should apply (mock or test the exceptional strength function separately)
  });

  it('should cap constitution for a F Elf F/MU', () => {
    mockRollAttributeDice.mockReturnValue(23);
    const result = rollAttribute(
      Attribute.Constitution,
      [CharacterClass.MagicUser, CharacterClass.Fighter],
      CharacterRace.Elf,
      Gender.Female
    );
    expect(mockRollAttributeDice).toHaveBeenCalledWith(4); // Fighters roll 4 dice for Constitution
    expect(result).toBe(18);
  });
});

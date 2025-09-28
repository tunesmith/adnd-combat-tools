import { rollDice } from '../dungeonLookup';
import type { CharacterSheet } from '../../models/character/characterSheet';
import { CharacterClass } from '../../models/characterClass';

export type MagicItemTableId = 'I' | 'II' | 'III' | 'IV';

type MagicItemInstruction = {
  table: MagicItemTableId;
  count: number;
  chance?: number; // percent chance (1-100). Undefined means deterministic.
};

const MAGIC_ITEM_PROGRESSIONS: Record<number, MagicItemInstruction[]> = {
  1: [{ chance: 10, table: 'I', count: 1 }],
  2: [{ chance: 20, table: 'I', count: 2 }],
  3: [
    { chance: 30, table: 'I', count: 2 },
    { chance: 10, table: 'II', count: 1 },
  ],
  4: [
    { chance: 40, table: 'I', count: 2 },
    { chance: 20, table: 'II', count: 1 },
  ],
  5: [
    { chance: 50, table: 'I', count: 2 },
    { chance: 30, table: 'II', count: 1 },
  ],
  6: [
    { chance: 60, table: 'I', count: 3 },
    { chance: 40, table: 'II', count: 2 },
    { chance: 10, table: 'III', count: 1 },
  ],
  7: [
    { chance: 70, table: 'I', count: 3 },
    { chance: 50, table: 'II', count: 2 },
    { chance: 10, table: 'III', count: 1 },
  ],
  8: [
    { chance: 80, table: 'I', count: 3 },
    { chance: 60, table: 'II', count: 2 },
    { chance: 20, table: 'III', count: 1 },
  ],
  9: [
    { chance: 90, table: 'I', count: 3 },
    { chance: 70, table: 'II', count: 2 },
    { chance: 30, table: 'III', count: 1 },
  ],
  10: [
    { table: 'I', count: 3 },
    { chance: 80, table: 'II', count: 2 },
    { chance: 40, table: 'III', count: 1 },
  ],
  11: [
    { table: 'I', count: 3 },
    { chance: 90, table: 'II', count: 2 },
    { chance: 50, table: 'III', count: 1 },
    { chance: 10, table: 'IV', count: 1 },
  ],
  12: [
    { table: 'I', count: 3 },
    { table: 'II', count: 2 },
    { chance: 60, table: 'III', count: 1 },
    { chance: 20, table: 'IV', count: 1 },
  ],
  13: [
    { table: 'I', count: 3 },
    { table: 'II', count: 2 },
    { table: 'III', count: 1 },
    { chance: 60, table: 'IV', count: 1 },
  ],
};

const MAGIC_TABLE_ORDER: MagicItemTableId[] = ['I', 'II', 'III', 'IV'];

function highestCharacterLevel(character: CharacterSheet): number {
  if (character.isManAtArms) {
    return 0;
  }
  let maxLevel = 0;
  for (const profession of character.professions) {
    if (profession.level > maxLevel) {
      maxLevel = profession.level;
    }
  }
  if (character.isBard) {
    const bardLevels = character.bardLevels;
    const bardMax = Math.max(
      bardLevels[CharacterClass.Fighter],
      bardLevels[CharacterClass.Thief],
      bardLevels[CharacterClass.Bard]
    );
    if (bardMax > maxLevel) {
      maxLevel = bardMax;
    }
  }
  return maxLevel;
}

export function assignMagicItemsToCharacter(character: CharacterSheet): void {
  const level = highestCharacterLevel(character);
  if (level <= 0) {
    character.magicItems = [];
    return;
  }
  const instructions =
    MAGIC_ITEM_PROGRESSIONS[level] ?? MAGIC_ITEM_PROGRESSIONS[13] ?? [];
  const aggregate = new Map<MagicItemTableId, number>();

  for (const instruction of instructions) {
    if (instruction.chance !== undefined) {
      const roll = rollDice(100);
      if (roll > instruction.chance) {
        continue;
      }
    }
    aggregate.set(
      instruction.table,
      (aggregate.get(instruction.table) ?? 0) + instruction.count
    );
  }

  character.magicItems = MAGIC_TABLE_ORDER.flatMap((table) => {
    const count = aggregate.get(table);
    return count && count > 0 ? [{ table, count }] : [];
  });
}

export function assignMagicItemsToParty(party: CharacterSheet[]): void {
  party.forEach((member) => {
    assignMagicItemsToCharacter(member);
    member.followers.forEach((follower) =>
      assignMagicItemsToCharacter(follower)
    );
  });
}

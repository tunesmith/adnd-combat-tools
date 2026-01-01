import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  treasureRings,
  TreasureRing,
  treasureRingContrariness,
  treasureRingElementalCommand,
  treasureRingProtection,
  treasureRingRegeneration,
  treasureRingTelekinesis,
  treasureRingThreeWishes,
  treasureRingWizardry,
} from './ringTables';
import { buildTreasureEvent } from '../shared';

type SpellStoringCaster = 'magic-user' | 'illusionist' | 'cleric' | 'druid';

function rollCasterType(): SpellStoringCaster {
  const clericRoll = rollDice(100);
  if (clericRoll >= 71) {
    const druidRoll = rollDice(100);
    return druidRoll <= 25 ? 'druid' : 'cleric';
  }
  const illusionistRoll = rollDice(100);
  return illusionistRoll <= 10 ? 'illusionist' : 'magic-user';
}

function rollSpellStoringLevels(
  count: number,
  caster: SpellStoringCaster
): number[] {
  const levels: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (caster === 'cleric' || caster === 'druid') {
      const baseRoll = rollDice(6);
      levels.push(baseRoll === 6 ? rollDice(4) : baseRoll);
    } else {
      const baseRoll = rollDice(8);
      levels.push(baseRoll === 8 ? rollDice(6) : baseRoll);
    }
  }
  return levels;
}

export function resolveTreasureRing(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRings.sides);
  const command = getTableEntry(usedRoll, treasureRings);
  const children: DungeonOutcomeNode[] = [];
  let spellStoring:
    | {
        caster: SpellStoringCaster;
        spellLevels: number[];
      }
    | undefined;
  if (command === TreasureRing.Contrariness) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingContrariness',
    });
  } else if (command === TreasureRing.ElementalCommand) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingElementalCommand',
    });
  } else if (command === TreasureRing.Protection) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingProtection',
    });
  } else if (command === TreasureRing.SpellStoring) {
    const spellCount = rollDice(4) + 1;
    const caster = rollCasterType();
    const spellLevels = rollSpellStoringLevels(spellCount, caster);
    spellStoring = { caster, spellLevels };
  } else if (command === TreasureRing.Regeneration) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingRegeneration',
    });
  } else if (command === TreasureRing.Telekinesis) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingTelekinesis',
    });
  } else if (command === TreasureRing.ThreeWishes) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingThreeWishes',
    });
  } else if (command === TreasureRing.Wizardry) {
    children.push({
      type: 'pending-roll',
      table: 'treasureRingWizardry',
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      ...buildTreasureEvent('treasureRing', command, usedRoll, options),
      spellStoring,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureRingContrariness(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingContrariness.sides);
  const command = getTableEntry(usedRoll, treasureRingContrariness);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingContrariness',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingElementalCommand(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureRingElementalCommand.sides);
  const command = getTableEntry(usedRoll, treasureRingElementalCommand);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingElementalCommand',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingProtection(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingProtection.sides);
  const command = getTableEntry(usedRoll, treasureRingProtection);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingProtection',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingRegeneration(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingRegeneration.sides);
  const command = getTableEntry(usedRoll, treasureRingRegeneration);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingRegeneration',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingTelekinesis(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingTelekinesis.sides);
  const command = getTableEntry(usedRoll, treasureRingTelekinesis);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingTelekinesis',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingThreeWishes(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingThreeWishes.sides);
  const command = getTableEntry(usedRoll, treasureRingThreeWishes);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingThreeWishes',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureRingWizardry(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureRingWizardry.sides);
  const command = getTableEntry(usedRoll, treasureRingWizardry);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureRingWizardry',
      result: command,
    } as OutcomeEvent,
  };
}

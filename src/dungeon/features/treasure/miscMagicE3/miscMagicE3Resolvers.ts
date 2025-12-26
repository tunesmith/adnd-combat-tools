import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  TreasureIounStoneStatus,
  TreasureIounStonesResult,
} from '../../../domain/outcome';
import { treasureMiscMagicE3, TreasureMiscMagicE3 } from './miscMagicE3Table';
import {
  IOUN_STONE_DEFINITIONS,
  treasureFigurineMarbleElephant,
  treasureFigurineOfWondrousPower,
  treasureGirdleOfGiantStrength,
  treasureHornOfValhallaAlignment,
  treasureHornOfValhallaAttunement,
  treasureHornOfValhallaType,
  treasureInstrumentOfTheBards,
  treasureIounStones,
  treasureIronFlask,
  TreasureFigurineOfWondrousPower,
  TreasureHornOfValhallaAttunement,
  TreasureIounStoneType,
  type TreasureFigurineMarbleElephant,
} from './miscMagicE3Subtables';
import type {
  TreasureGirdleOfGiantStrength,
  TreasureHornOfValhallaAlignment,
  TreasureHornOfValhallaType,
  TreasureInstrumentOfTheBards,
  TreasureIronFlaskContent,
} from './miscMagicE3Subtables';

export type TreasureMiscMagicE3ResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function resolveTreasureMiscMagicE3(
  options?: TreasureMiscMagicE3ResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE3.sides);
  const command: TreasureMiscMagicE3 = getTableEntry(
    usedRoll,
    treasureMiscMagicE3
  );
  const rollIndex = options?.rollIndex;
  const children: DungeonOutcomeNode[] = [];
  const level = options?.level ?? 1;
  const treasureRoll = options?.treasureRoll ?? usedRoll;
  const context = {
    kind: 'treasureMagic' as const,
    level,
    treasureRoll,
    rollIndex,
  };

  if (command === TreasureMiscMagicE3.FigurineOfWondrousPower) {
    children.push({
      type: 'pending-roll',
      table: 'treasureFigurineOfWondrousPower',
      id: rollIndex
        ? `treasureFigurineOfWondrousPower:${rollIndex}`
        : undefined,
      context,
    });
  } else if (command === TreasureMiscMagicE3.GirdleOfGiantStrength) {
    children.push({
      type: 'pending-roll',
      table: 'treasureGirdleOfGiantStrength',
      id: rollIndex ? `treasureGirdleOfGiantStrength:${rollIndex}` : undefined,
      context,
    });
  } else if (command === TreasureMiscMagicE3.IounStones) {
    children.push(resolveTreasureIounStones());
  } else if (command === TreasureMiscMagicE3.InstrumentOfTheBards) {
    children.push({
      type: 'pending-roll',
      table: 'treasureInstrumentOfTheBards',
      id: rollIndex ? `treasureInstrumentOfTheBards:${rollIndex}` : undefined,
      context,
    });
  } else if (command === TreasureMiscMagicE3.IronFlask) {
    children.push({
      type: 'pending-roll',
      table: 'treasureIronFlask',
      id: rollIndex ? `treasureIronFlask:${rollIndex}` : undefined,
      context,
    });
  } else if (command === TreasureMiscMagicE3.HornOfValhalla) {
    children.push({
      type: 'pending-roll',
      table: 'treasureHornOfValhallaType',
      id: rollIndex ? `treasureHornOfValhallaType:${rollIndex}` : undefined,
      context,
    });
  }

  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureMiscMagicE3',
      result: command,
      level: options?.level,
      treasureRoll: options?.treasureRoll,
      rollIndex,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureFigurineOfWondrousPower(
  options?: TreasureMiscMagicE3ResolverOptions
): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureFigurineOfWondrousPower.sides);
  const command: TreasureFigurineOfWondrousPower = getTableEntry(
    usedRoll,
    treasureFigurineOfWondrousPower
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureFigurineOfWondrousPower.MarbleElephant) {
    const rollIndex = options?.rollIndex;
    children.push({
      type: 'pending-roll',
      table: 'treasureFigurineMarbleElephant',
      id: rollIndex ? `treasureFigurineMarbleElephant:${rollIndex}` : undefined,
      context: {
        kind: 'treasureMagic',
        level: options?.level ?? 1,
        treasureRoll: options?.treasureRoll ?? usedRoll,
        rollIndex,
      },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureFigurineOfWondrousPower',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureFigurineMarbleElephant(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureFigurineMarbleElephant.sides);
  const command: TreasureFigurineMarbleElephant = getTableEntry(
    usedRoll,
    treasureFigurineMarbleElephant
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureFigurineMarbleElephant',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureGirdleOfGiantStrength(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureGirdleOfGiantStrength.sides);
  const command: TreasureGirdleOfGiantStrength = getTableEntry(
    usedRoll,
    treasureGirdleOfGiantStrength
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureGirdleOfGiantStrength',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureInstrumentOfTheBards(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureInstrumentOfTheBards.sides);
  const command: TreasureInstrumentOfTheBards = getTableEntry(
    usedRoll,
    treasureInstrumentOfTheBards
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureInstrumentOfTheBards',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureIronFlask(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureIronFlask.sides);
  const command: TreasureIronFlaskContent = getTableEntry(
    usedRoll,
    treasureIronFlask
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureIronFlask',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureIounStones(options?: {
  roll?: number;
  stoneRolls?: number[];
}): DungeonOutcomeNode {
  const countRoll = options?.roll ?? rollDice(10);
  const count = Math.max(1, Math.min(10, countRoll));
  const rolls = options?.stoneRolls ?? [];
  const stones: TreasureIounStonesResult['stones'] = [];
  const seen = new Map<TreasureIounStoneType, number>();

  for (let index = 0; index < count; index += 1) {
    const preset = rolls[index];
    const usedRoll =
      preset !== undefined ? preset : rollDice(treasureIounStones.sides);
    const type: TreasureIounStoneType = getTableEntry(
      usedRoll,
      treasureIounStones
    );
    const definition = IOUN_STONE_DEFINITIONS[type];
    const firstIndex = seen.get(type);
    const status: TreasureIounStoneStatus =
      type === TreasureIounStoneType.DullGray
        ? 'dead'
        : firstIndex !== undefined
        ? 'duplicate'
        : 'active';
    if (firstIndex === undefined) {
      seen.set(type, index);
    }
    stones.push({
      index: index + 1,
      roll: usedRoll,
      type,
      color: definition.color,
      shape: definition.shape,
      effect: definition.effect,
      status,
      duplicateOf: firstIndex !== undefined ? firstIndex + 1 : undefined,
    });
  }

  const result: TreasureIounStonesResult = {
    countRoll,
    stones,
  };

  return {
    type: 'event',
    roll: countRoll,
    event: {
      kind: 'treasureIounStones',
      result,
    } as OutcomeEvent,
  };
}

export function resolveTreasureHornOfValhallaType(
  options?: TreasureMiscMagicE3ResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureHornOfValhallaType.sides);
  const command: TreasureHornOfValhallaType = getTableEntry(
    usedRoll,
    treasureHornOfValhallaType
  );
  const rollIndex = options?.rollIndex;
  const children: DungeonOutcomeNode[] = [
    {
      type: 'pending-roll',
      table: 'treasureHornOfValhallaAttunement',
      id: rollIndex
        ? `treasureHornOfValhallaAttunement:${rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: options?.level ?? 1,
        treasureRoll: options?.treasureRoll ?? usedRoll,
        rollIndex,
      },
    },
  ];
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureHornOfValhallaType',
      result: command,
    } as OutcomeEvent,
    children,
  };
}

export function resolveTreasureHornOfValhallaAttunement(
  options?: TreasureMiscMagicE3ResolverOptions
): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureHornOfValhallaAttunement.sides);
  const command: TreasureHornOfValhallaAttunement = getTableEntry(
    usedRoll,
    treasureHornOfValhallaAttunement
  );
  const children: DungeonOutcomeNode[] = [];
  if (command === TreasureHornOfValhallaAttunement.Aligned) {
    const rollIndex = options?.rollIndex;
    children.push({
      type: 'pending-roll',
      table: 'treasureHornOfValhallaAlignment',
      id: rollIndex
        ? `treasureHornOfValhallaAlignment:${rollIndex}`
        : undefined,
      context: {
        kind: 'treasureMagic',
        level: options?.level ?? 1,
        treasureRoll: options?.treasureRoll ?? usedRoll,
        rollIndex,
      },
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureHornOfValhallaAttunement',
      result: command,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureHornOfValhallaAlignment(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureHornOfValhallaAlignment.sides);
  const command: TreasureHornOfValhallaAlignment = getTableEntry(
    usedRoll,
    treasureHornOfValhallaAlignment
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureHornOfValhallaAlignment',
      result: command,
    } as OutcomeEvent,
  };
}

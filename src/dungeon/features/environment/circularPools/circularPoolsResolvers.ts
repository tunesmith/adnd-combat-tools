import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  circularContents,
  CircularContents,
  magicPool,
  MagicPool,
  pool,
  Pool,
  poolAlignment,
  transporterLocation,
  transmuteType,
} from './circularPoolsTable';

export function resolveCircularContents(options?: {
  roll?: number;
  level?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(circularContents.sides);
  const command = getTableEntry(usedRoll, circularContents);
  const children: DungeonOutcomeNode[] = [];
  if (command === CircularContents.Pool) {
    children.push({
      type: 'pending-roll',
      table: 'circularPool',
      context:
        options?.level !== undefined
          ? { kind: 'wandering', level: options.level }
          : undefined,
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'circularContents', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveCircularPool(options?: {
  roll?: number;
  level?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(pool.sides);
  const command = getTableEntry(usedRoll, pool);
  const children: DungeonOutcomeNode[] = [];
  const level = options?.level ?? 1;
  if (command === Pool.PoolMonster || command === Pool.PoolMonsterTreasure) {
    children.push({
      type: 'pending-roll',
      table: `monsterLevel:${level}`,
      context: { kind: 'wandering', level },
    });
  }
  if (command === Pool.PoolMonsterTreasure) {
    for (let index = 1; index <= 2; index += 1) {
      children.push({
        type: 'pending-roll',
        table: 'treasure',
        id: `treasure:${index}`,
        context: {
          kind: 'treasure',
          level,
          withMonster: true,
          rollIndex: index,
          totalRolls: 2,
        },
      });
    }
  }
  if (command === Pool.MagicPool) {
    children.push({ type: 'pending-roll', table: 'circularMagicPool' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'circularPool', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveCircularMagicPool(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(magicPool.sides);
  const command = getTableEntry(usedRoll, magicPool);
  const children: DungeonOutcomeNode[] = [];
  if (command === MagicPool.TransmuteGold) {
    children.push({ type: 'pending-roll', table: 'transmuteType' });
  } else if (command === MagicPool.WishOrDamage) {
    children.push({ type: 'pending-roll', table: 'poolAlignment' });
  } else if (command === MagicPool.Transporter) {
    children.push({ type: 'pending-roll', table: 'transporterLocation' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'circularMagicPool', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveTransmuteType(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(transmuteType.sides);
  const command = getTableEntry(usedRoll, transmuteType);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'transmuteType', result: command } as OutcomeEvent,
  };
}

export function resolvePoolAlignment(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(poolAlignment.sides);
  const command = getTableEntry(usedRoll, poolAlignment);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'poolAlignment', result: command } as OutcomeEvent,
  };
}

export function resolveTransporterLocation(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(transporterLocation.sides);
  const command = getTableEntry(usedRoll, transporterLocation);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'transporterLocation', result: command } as OutcomeEvent,
  };
}

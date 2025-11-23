import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { chute, egressOne, egressThree, egressTwo, Stairs, stairs } from './stairsTable';

export function resolveStairs(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(stairs.sides);
  const command = getTableEntry(usedRoll, stairs);
  const event: OutcomeEvent = {
    kind: 'stairs',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === Stairs.DownOne) {
    children.push({ type: 'pending-roll', table: 'egress:one' });
  } else if (command === Stairs.DownTwo) {
    children.push({ type: 'pending-roll', table: 'egress:two' });
  } else if (command === Stairs.DownThree) {
    children.push({ type: 'pending-roll', table: 'egress:three' });
  } else if (command === Stairs.UpDead || command === Stairs.DownDead) {
    children.push({ type: 'pending-roll', table: 'chute' });
  } else if (command === Stairs.UpOneDownTwo) {
    children.push({ type: 'pending-roll', table: 'chamberDimensions' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveEgress(options: {
  roll?: number;
  which: 'one' | 'two' | 'three';
}): DungeonOutcomeNode {
  const table =
    options.which === 'one'
      ? egressOne
      : options.which === 'two'
      ? egressTwo
      : egressThree;
  const usedRoll = options.roll ?? rollDice(table.sides);
  const command = getTableEntry(usedRoll, table);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'egress',
      result: command,
      which: options.which,
    } as OutcomeEvent,
  };
}

export function resolveChute(options?: { roll?: number }): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(chute.sides);
  const command = getTableEntry(usedRoll, chute);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'chute', result: command } as OutcomeEvent,
  };
}

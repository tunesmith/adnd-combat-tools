import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { trickTrap, TrickTrap } from './trickTrapTable';

export function resolveTrickTrap(options?: {
  roll?: number;
  level?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(trickTrap.sides);
  const command = getTableEntry(usedRoll, trickTrap);
  const children: DungeonOutcomeNode[] = [];
  if (command === TrickTrap.IllusionaryWall) {
    children.push(
      createPendingRoll({
        kind: 'illusionaryWallNature',
        args:
          options?.level === undefined
            ? undefined
            : { kind: 'wandering', level: options.level },
      })
    );
  } else if (command === TrickTrap.GasCorridor) {
    children.push(createPendingRoll({ kind: 'gasTrapEffect' }));
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'trickTrap', result: command },
    children: children.length ? children : undefined,
  };
}

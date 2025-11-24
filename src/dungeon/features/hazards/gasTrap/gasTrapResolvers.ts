import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { gasTrapEffect } from './gasTrapTable';

export function resolveGasTrapEffect(options?: {
  roll?: number;
  takeOverride?: (tableId: string) => number | undefined;
}): DungeonOutcomeNode {
  const overridden = options?.takeOverride?.('gasTrapEffect');
  const usedRoll = overridden ?? options?.roll ?? rollDice(gasTrapEffect.sides);
  const command = getTableEntry(usedRoll, gasTrapEffect);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'gasTrapEffect', result: command },
  };
}

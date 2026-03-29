import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { resolveSubtable } from '../../../domain/resolveSubtable';
import { treasureArmorShields } from './armorShieldsTable';
import { buildTreasureEvent } from '../shared';

type TreasureArmorShieldsResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function resolveTreasureArmorShields(
  options?: TreasureArmorShieldsResolverOptions
): DungeonOutcomeNode {
  return resolveSubtable({
    table: treasureArmorShields,
    roll: options?.roll,
    buildEvent: (command, usedRoll) =>
      buildTreasureEvent('treasureArmorShields', command, usedRoll, options),
  });
}

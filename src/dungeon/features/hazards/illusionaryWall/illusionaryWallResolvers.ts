import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { ChamberRoomContents } from '../../environment/roomsChambers/roomsChambersTable';
import {
  illusionaryWallNature,
  IllusionaryWallNature,
} from './illusionaryWallTable';

export function resolveIllusionaryWallNature(options?: {
  roll?: number;
  level?: number;
  takeOverride?: (tableId: string) => number | undefined;
}): DungeonOutcomeNode {
  const overridden = options?.takeOverride?.('illusionaryWallNature');
  const usedRoll =
    overridden ?? options?.roll ?? rollDice(illusionaryWallNature.sides);
  const command = getTableEntry(usedRoll, illusionaryWallNature);
  const children: DungeonOutcomeNode[] = [];
  if (command === IllusionaryWallNature.Chamber) {
    children.push(
      createPendingRoll({
        kind: 'chamberDimensions',
        args: {
          kind: 'chamberDimensions',
          forcedContents: ChamberRoomContents.MonsterAndTreasure,
          level: options?.level,
        },
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'illusionaryWallNature', result: command },
    children: children.length ? children : undefined,
  };
}

import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode } from '../../../domain/outcome';
import type { TreasureMiscWeaponResult } from '../../../domain/treasureValueTypes';
import { buildTreasureEvent } from '../shared';
import { treasureMiscWeapons, TreasureMiscWeapon } from './miscWeaponsTable';

type TreasureMiscWeaponsResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function resolveTreasureMiscWeapons(
  options?: TreasureMiscWeaponsResolverOptions
): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscWeapons.sides);
  const item = getTableEntry(usedRoll, treasureMiscWeapons);
  let quantity: number | undefined;
  switch (item) {
    case TreasureMiscWeapon.ArrowPlus1:
      quantity = rollDice(12, 2);
      break;
    case TreasureMiscWeapon.ArrowPlus2:
      quantity = rollDice(8, 2);
      break;
    case TreasureMiscWeapon.ArrowPlus3:
      quantity = rollDice(6, 2);
      break;
    case TreasureMiscWeapon.BoltPlus2:
      quantity = rollDice(10, 2);
      break;
    default:
      quantity = undefined;
      break;
  }
  const result: TreasureMiscWeaponResult = { item, quantity };
  const event = buildTreasureEvent(
    'treasureMiscWeapons',
    result,
    usedRoll,
    options
  );
  return {
    type: 'event',
    roll: usedRoll,
    event,
  };
}

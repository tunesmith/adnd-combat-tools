import type { DungeonTablePreview, TableContext } from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { MonsterDescription } from './shared';
import { describeMonsterLevel, buildMonsterLevelPreview } from './level';
import {
  describeStandardMonster,
  describeDragonMonster,
  buildStandardMonsterPreview,
  buildDragonPreview,
  isStandardTableId,
  isDragonTableId,
} from './standard';
import { describeHumanMonster, buildHumanPreview } from './human';

export type { MonsterDescription } from './shared';

export function describeMonsterOutcome(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  return (
    describeMonsterLevel(node) ??
    describeStandardMonster(node) ??
    describeDragonMonster(node) ??
    describeHumanMonster(node)
  );
}

export function buildMonsterPreview(
  tableId: string,
  context?: TableContext
): DungeonTablePreview | undefined {
  const base = tableId.split(':')[0] || tableId;
  if (base === 'monsterLevel') {
    return buildMonsterLevelPreview(tableId, context);
  }
  if (isStandardTableId(base)) {
    return buildStandardMonsterPreview(base, context);
  }
  if (isDragonTableId(base)) {
    return buildDragonPreview(base, context);
  }
  if (base === 'human') {
    return buildHumanPreview(tableId, context);
  }
  return undefined;
}

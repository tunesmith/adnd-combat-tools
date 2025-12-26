import type {
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { getMonsterLevelTable, MonsterLevel } from './monsterLevelTable';
import { buildPreview } from '../../../adapters/render/shared';
import { hasPendingChildren, type MonsterDescription } from '../render/shared';

export function describeMonsterLevel(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  if (node.event.kind !== 'monsterLevel') return undefined;
  const detailParagraphs: MonsterDescription['detailParagraphs'] = [];
  return {
    heading: 'Monster Level',
    label: MonsterLevel[node.event.result] ?? String(node.event.result),
    detailParagraphs,
    compactText: '',
    appendPending: hasPendingChildren(node),
  };
}

export function buildMonsterLevelPreview(
  tableId: string,
  context?: TableContext
): DungeonTablePreview {
  const parts = tableId.split(':');
  const lvl = Number(parts[1] ?? 1) || 1;
  const table = getMonsterLevelTable(lvl);
  return buildPreview(tableId, {
    title: 'Monster Level',
    sides: table.sides,
    entries: table.entries.map((entry) => ({
      range: entry.range,
      label: MonsterLevel[entry.command] ?? String(entry.command),
    })),
    context,
  });
}

import type {
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { MonsterLevel } from '../../../../tables/dungeon/monster/monsterLevel';
import { getMonsterTable } from '../../../services/wanderingMonsterResult';
import { buildPreview } from '../shared';
import { hasPendingChildren, type MonsterDescription } from './shared';

export function describeMonsterLevel(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  if (node.event.kind !== 'monsterLevel') return undefined;
  const detailParagraphs: MonsterDescription['detailParagraphs'] = [];
  let compactText = '';
  if (node.event.result > MonsterLevel.Nine) {
    const placeholder = `(TODO: Monster Level ${
      MonsterLevel[node.event.result]
    } preview)`;
    detailParagraphs.push({ kind: 'paragraph', text: placeholder });
    compactText = placeholder;
  }
  return {
    heading: 'Monster Level',
    label: MonsterLevel[node.event.result] ?? String(node.event.result),
    detailParagraphs,
    compactText,
    appendPending: hasPendingChildren(node),
  };
}

export function buildMonsterLevelPreview(
  tableId: string,
  context?: TableContext
): DungeonTablePreview {
  const parts = tableId.split(':');
  const lvl = Number(parts[1] ?? 1) || 1;
  const table = getMonsterTable(lvl);
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

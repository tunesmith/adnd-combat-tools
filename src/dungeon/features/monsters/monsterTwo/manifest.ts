import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import { buildPreview } from '../../../adapters/render/shared';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
import { resolveMonsterTwo } from './monsterTwoResolvers';
import { monsterTwo, MonsterTwo } from './monsterTwoTable';

const { resolvePending, registry } = createMonsterDungeonLevelContextHandlers(
  resolveMonsterTwo,
  1
);

export const monsterTwoTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterTwo',
    heading: 'Monster (Level 2)',
    resolver: wrapResolver(resolveMonsterTwo),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Monster (Level 2)',
        sides: monsterTwo.sides,
        entries: monsterTwo.entries.map((entry) => ({
          range: entry.range,
          label: MonsterTwo[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending,
    registry,
  },
];

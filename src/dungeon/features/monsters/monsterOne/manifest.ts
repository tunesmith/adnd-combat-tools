import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import {
  renderMonsterCompactNodes,
  renderMonsterDetailNodes,
} from '../render';
import { buildPreview } from '../../../adapters/render/shared';
import { monsterOne, MonsterOne } from './monsterOneTables';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
import { resolveMonsterOne } from './monsterOneResolvers';

const { resolvePending, registry } = createMonsterDungeonLevelContextHandlers(
  resolveMonsterOne,
  1
);

export const monsterOneTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterOne',
    heading: 'Monster (Level 1)',
    resolver: wrapResolver(resolveMonsterOne),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Monster (Level 1)',
        sides: monsterOne.sides,
        entries: monsterOne.entries.map((entry) => ({
          range: entry.range,
          label: MonsterOne[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending,
    registry,
  },
];

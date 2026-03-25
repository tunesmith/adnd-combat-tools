import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import {
  buildPreview,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import { monsterOne, MonsterOne } from './monsterOneTables';
import {
  createMonsterDungeonLevelContextHandlers,
  createMonsterEventPreviewBuilder,
} from '../shared';
import { resolveMonsterOne } from './monsterOneResolvers';

const { resolvePending, registry } = createMonsterDungeonLevelContextHandlers(
  resolveMonsterOne,
  1
);

const buildMonsterOnePreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Monster (Level 1)',
    sides: monsterOne.sides,
    entries: monsterOne.entries.map((entry) => ({
      range: entry.range,
      label: MonsterOne[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const monsterOneTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterOne',
    heading: 'Monster (Level 1)',
    resolver: wrapResolver(resolveMonsterOne),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildMonsterOnePreview,
    buildEventPreview: createMonsterEventPreviewBuilder(buildMonsterOnePreview),
    resolvePending,
    registry,
  },
];

import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import {
  buildPreview,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import {
  createMonsterDungeonLevelContextHandlers,
  createMonsterEventPreviewBuilder,
} from '../shared';
import {
  DragonThree,
  dragonThree,
  MonsterThree,
  monsterThree,
} from './monsterThreeTables';
import {
  resolveDragonThree,
  resolveMonsterThree,
} from './monsterThreeResolvers';

const {
  resolvePending: resolveMonsterThreePending,
  registry: monsterThreeRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveMonsterThree, 1);

const {
  resolvePending: resolveDragonThreePending,
  registry: dragonThreeRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonThree, 3);

const buildMonsterThreePreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Monster (Level 3)',
    sides: monsterThree.sides,
    entries: monsterThree.entries.map((entry) => ({
      range: entry.range,
      label: MonsterThree[entry.command] ?? String(entry.command),
    })),
    context,
  });

const buildDragonThreePreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Dragon (Level 3)',
    sides: dragonThree.sides,
    entries: dragonThree.entries.map((entry) => ({
      range: entry.range,
      label: DragonThree[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const monsterThreeTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterThree',
    heading: 'Monster (Level 3)',
    resolver: wrapResolver(resolveMonsterThree),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildMonsterThreePreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildMonsterThreePreview
    ),
    resolvePending: resolveMonsterThreePending,
    registry: monsterThreeRegistry,
  },
  {
    id: 'dragonThree',
    heading: 'Dragon (Level 3)',
    resolver: wrapResolver(resolveDragonThree),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildDragonThreePreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildDragonThreePreview
    ),
    resolvePending: resolveDragonThreePending,
    registry: dragonThreeRegistry,
  },
];

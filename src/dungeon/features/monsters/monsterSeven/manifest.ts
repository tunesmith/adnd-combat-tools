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
  DragonSeven,
  dragonSeven,
  MonsterSeven,
  monsterSeven,
} from './monsterSevenTables';
import {
  resolveDragonSeven,
  resolveMonsterSeven,
} from './monsterSevenResolvers';

const {
  resolvePending: resolveMonsterSevenPending,
  registry: monsterSevenRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveMonsterSeven, 1);

const {
  resolvePending: resolveDragonSevenPending,
  registry: dragonSevenRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonSeven, 7);

const buildMonsterSevenPreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Monster (Level 7)',
    sides: monsterSeven.sides,
    entries: monsterSeven.entries.map((entry) => ({
      range: entry.range,
      label: MonsterSeven[entry.command] ?? String(entry.command),
    })),
    context,
  });

const buildDragonSevenPreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Dragon (Level 7)',
    sides: dragonSeven.sides,
    entries: dragonSeven.entries.map((entry) => ({
      range: entry.range,
      label: DragonSeven[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const monsterSevenTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterSeven',
    heading: 'Monster (Level 7)',
    resolver: wrapResolver(resolveMonsterSeven),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildMonsterSevenPreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildMonsterSevenPreview
    ),
    resolvePending: resolveMonsterSevenPending,
    registry: monsterSevenRegistry,
  },
  {
    id: 'dragonSeven',
    heading: 'Dragon (Level 7)',
    resolver: wrapResolver(resolveDragonSeven),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildDragonSevenPreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildDragonSevenPreview
    ),
    resolvePending: resolveDragonSevenPending,
    registry: dragonSevenRegistry,
  },
];

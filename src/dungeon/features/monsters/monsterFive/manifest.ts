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
  DragonFiveOlder,
  DragonFiveYounger,
  dragonFiveOlder,
  dragonFiveYounger,
  MonsterFive,
  monsterFive,
} from './monsterFiveTables';
import {
  resolveDragonFiveOlder,
  resolveDragonFiveYounger,
  resolveMonsterFive,
} from './monsterFiveResolvers';

const {
  resolvePending: resolveMonsterFivePending,
  registry: monsterFiveRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveMonsterFive, 1);

const {
  resolvePending: resolveDragonFiveYoungerPending,
  registry: dragonFiveYoungerRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonFiveYounger, 5);

const {
  resolvePending: resolveDragonFiveOlderPending,
  registry: dragonFiveOlderRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonFiveOlder, 5);

const buildMonsterFivePreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Monster (Level 5)',
    sides: monsterFive.sides,
    entries: monsterFive.entries.map((entry) => ({
      range: entry.range,
      label: MonsterFive[entry.command] ?? String(entry.command),
    })),
    context,
  });

const buildDragonFiveYoungerPreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Dragon (Level 5 Younger)',
    sides: dragonFiveYounger.sides,
    entries: dragonFiveYounger.entries.map((entry) => ({
      range: entry.range,
      label: DragonFiveYounger[entry.command] ?? String(entry.command),
    })),
    context,
  });

const buildDragonFiveOlderPreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Dragon (Level 5 Older)',
    sides: dragonFiveOlder.sides,
    entries: dragonFiveOlder.entries.map((entry) => ({
      range: entry.range,
      label: DragonFiveOlder[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const monsterFiveTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterFive',
    heading: 'Monster (Level 5)',
    resolver: wrapResolver(resolveMonsterFive),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildMonsterFivePreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildMonsterFivePreview
    ),
    resolvePending: resolveMonsterFivePending,
    registry: monsterFiveRegistry,
  },
  {
    id: 'dragonFiveYounger',
    heading: 'Dragon (Level 5 Younger)',
    resolver: wrapResolver(resolveDragonFiveYounger),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildDragonFiveYoungerPreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildDragonFiveYoungerPreview
    ),
    resolvePending: resolveDragonFiveYoungerPending,
    registry: dragonFiveYoungerRegistry,
  },
  {
    id: 'dragonFiveOlder',
    heading: 'Dragon (Level 5 Older)',
    resolver: wrapResolver(resolveDragonFiveOlder),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildDragonFiveOlderPreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildDragonFiveOlderPreview
    ),
    resolvePending: resolveDragonFiveOlderPending,
    registry: dragonFiveOlderRegistry,
  },
];

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
  DragonFourOlder,
  DragonFourYounger,
  dragonFourOlder,
  dragonFourYounger,
  MonsterFour,
  monsterFour,
} from './monsterFourTables';
import {
  resolveDragonFourOlder,
  resolveDragonFourYounger,
  resolveMonsterFour,
} from './monsterFourResolvers';

const {
  resolvePending: resolveMonsterFourPending,
  registry: monsterFourRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveMonsterFour, 1);

const {
  resolvePending: resolveDragonFourYoungerPending,
  registry: dragonFourYoungerRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonFourYounger, 4);

const {
  resolvePending: resolveDragonFourOlderPending,
  registry: dragonFourOlderRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonFourOlder, 4);

const buildMonsterFourPreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Monster (Level 4)',
    sides: monsterFour.sides,
    entries: monsterFour.entries.map((entry) => ({
      range: entry.range,
      label: MonsterFour[entry.command] ?? String(entry.command),
    })),
    context,
  });

const buildDragonFourYoungerPreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Dragon (Level 4 Younger)',
    sides: dragonFourYounger.sides,
    entries: dragonFourYounger.entries.map((entry) => ({
      range: entry.range,
      label: DragonFourYounger[entry.command] ?? String(entry.command),
    })),
    context,
  });

const buildDragonFourOlderPreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Dragon (Level 4 Older)',
    sides: dragonFourOlder.sides,
    entries: dragonFourOlder.entries.map((entry) => ({
      range: entry.range,
      label: DragonFourOlder[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const monsterFourTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterFour',
    heading: 'Monster (Level 4)',
    resolver: wrapResolver(resolveMonsterFour),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildMonsterFourPreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildMonsterFourPreview
    ),
    resolvePending: resolveMonsterFourPending,
    registry: monsterFourRegistry,
  },
  {
    id: 'dragonFourYounger',
    heading: 'Dragon (Level 4 Younger)',
    resolver: wrapResolver(resolveDragonFourYounger),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildDragonFourYoungerPreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildDragonFourYoungerPreview
    ),
    resolvePending: resolveDragonFourYoungerPending,
    registry: dragonFourYoungerRegistry,
  },
  {
    id: 'dragonFourOlder',
    heading: 'Dragon (Level 4 Older)',
    resolver: wrapResolver(resolveDragonFourOlder),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildDragonFourOlderPreview,
    buildEventPreview: createMonsterEventPreviewBuilder(
      buildDragonFourOlderPreview
    ),
    resolvePending: resolveDragonFourOlderPending,
    registry: dragonFourOlderRegistry,
  },
];

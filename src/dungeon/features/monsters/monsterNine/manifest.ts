import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import { buildPreview } from '../../../adapters/render/shared';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
import {
  DragonNine,
  dragonNine,
  MonsterNine,
  monsterNine,
} from './monsterNineTables';
import { resolveDragonNine, resolveMonsterNine } from './monsterNineResolvers';

const {
  resolvePending: resolveMonsterNinePending,
  registry: monsterNineRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveMonsterNine, 1);

const {
  resolvePending: resolveDragonNinePending,
  registry: dragonNineRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonNine, 9);

export const monsterNineTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterNine',
    heading: 'Monster (Level 9)',
    resolver: wrapResolver(resolveMonsterNine),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Monster (Level 9)',
        sides: monsterNine.sides,
        entries: monsterNine.entries.map((entry) => ({
          range: entry.range,
          label: MonsterNine[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveMonsterNinePending,
    registry: monsterNineRegistry,
  },
  {
    id: 'dragonNine',
    heading: 'Dragon (Level 9)',
    resolver: wrapResolver(resolveDragonNine),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Dragon (Level 9)',
        sides: dragonNine.sides,
        entries: dragonNine.entries.map((entry) => ({
          range: entry.range,
          label: DragonNine[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveDragonNinePending,
    registry: dragonNineRegistry,
  },
];

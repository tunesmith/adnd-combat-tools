import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import { buildPreview } from '../../../adapters/render/shared';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
import {
  DragonEight,
  dragonEight,
  MonsterEight,
  monsterEight,
} from './monsterEightTables';
import {
  resolveDragonEight,
  resolveMonsterEight,
} from './monsterEightResolvers';

const {
  resolvePending: resolveMonsterEightPending,
  registry: monsterEightRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveMonsterEight, 1);

const {
  resolvePending: resolveDragonEightPending,
  registry: dragonEightRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonEight, 8);

export const monsterEightTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterEight',
    heading: 'Monster (Level 8)',
    resolver: wrapResolver(resolveMonsterEight),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Monster (Level 8)',
        sides: monsterEight.sides,
        entries: monsterEight.entries.map((entry) => ({
          range: entry.range,
          label: MonsterEight[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveMonsterEightPending,
    registry: monsterEightRegistry,
  },
  {
    id: 'dragonEight',
    heading: 'Dragon (Level 8)',
    resolver: wrapResolver(resolveDragonEight),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Dragon (Level 8)',
        sides: dragonEight.sides,
        entries: dragonEight.entries.map((entry) => ({
          range: entry.range,
          label: DragonEight[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveDragonEightPending,
    registry: dragonEightRegistry,
  },
];

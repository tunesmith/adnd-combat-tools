import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import {
  renderMonsterCompactNodes,
  renderMonsterDetailNodes,
} from '../render';
import { buildPreview } from '../../../adapters/render/shared';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
import {
  DragonTen,
  dragonTen,
  MonsterTen,
  monsterTen,
} from './monsterTenTables';
import { resolveDragonTen, resolveMonsterTen } from './monsterTenResolvers';

const {
  resolvePending: resolveMonsterTenPending,
  registry: monsterTenRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveMonsterTen, 1);

const {
  resolvePending: resolveDragonTenPending,
  registry: dragonTenRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveDragonTen, 10);

export const monsterTenTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterTen',
    heading: 'Monster (Level 10)',
    resolver: wrapResolver(resolveMonsterTen),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Monster (Level 10)',
        sides: monsterTen.sides,
        entries: monsterTen.entries.map((entry) => ({
          range: entry.range,
          label: MonsterTen[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveMonsterTenPending,
    registry: monsterTenRegistry,
  },
  {
    id: 'dragonTen',
    heading: 'Dragon (Level 10)',
    resolver: wrapResolver(resolveDragonTen),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Dragon (Level 10)',
        sides: dragonTen.sides,
        entries: dragonTen.entries.map((entry) => ({
          range: entry.range,
          label: DragonTen[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveDragonTenPending,
    registry: dragonTenRegistry,
  },
];

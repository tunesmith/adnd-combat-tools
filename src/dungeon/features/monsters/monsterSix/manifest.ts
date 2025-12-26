import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import { buildPreview } from '../../../adapters/render/shared';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
import {
  DragonSix,
  dragonSix,
  MonsterSix,
  monsterSix,
} from './monsterSixTables';
import { resolveDragonSix, resolveMonsterSix } from './monsterSixResolvers';

const {
  resolvePending: resolveMonsterSixPending,
  registry: monsterSixRegistry,
} = createMonsterDungeonLevelContextHandlers(resolveMonsterSix, 1);

const { resolvePending: resolveDragonSixPending, registry: dragonSixRegistry } =
  createMonsterDungeonLevelContextHandlers(resolveDragonSix, 6);

export const monsterSixTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterSix',
    heading: 'Monster (Level 6)',
    resolver: wrapResolver(resolveMonsterSix),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Monster (Level 6)',
        sides: monsterSix.sides,
        entries: monsterSix.entries.map((entry) => ({
          range: entry.range,
          label: MonsterSix[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveMonsterSixPending,
    registry: monsterSixRegistry,
  },
  {
    id: 'dragonSix',
    heading: 'Dragon (Level 6)',
    resolver: wrapResolver(resolveDragonSix),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Dragon (Level 6)',
        sides: dragonSix.sides,
        entries: dragonSix.entries.map((entry) => ({
          range: entry.range,
          label: DragonSix[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveDragonSixPending,
    registry: dragonSixRegistry,
  },
];

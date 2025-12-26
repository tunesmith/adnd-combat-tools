import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import { buildPreview } from '../../../adapters/render/shared';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
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

export const monsterSevenTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterSeven',
    heading: 'Monster (Level 7)',
    resolver: wrapResolver(resolveMonsterSeven),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Monster (Level 7)',
        sides: monsterSeven.sides,
        entries: monsterSeven.entries.map((entry) => ({
          range: entry.range,
          label: MonsterSeven[entry.command] ?? String(entry.command),
        })),
        context,
      }),
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
    buildPreview: (tableId, context) =>
      buildPreview(tableId, {
        title: 'Dragon (Level 7)',
        sides: dragonSeven.sides,
        entries: dragonSeven.entries.map((entry) => ({
          range: entry.range,
          label: DragonSeven[entry.command] ?? String(entry.command),
        })),
        context,
      }),
    resolvePending: resolveDragonSevenPending,
    registry: dragonSevenRegistry,
  },
];

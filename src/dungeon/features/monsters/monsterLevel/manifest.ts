import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import { buildMonsterLevelPreview } from './monsterLevelRender';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
import { resolveMonsterLevel } from './monsterLevelResolvers';

const { resolvePending, registry } = createMonsterDungeonLevelContextHandlers(
  resolveMonsterLevel,
  1
);

export const monsterLevelTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'monsterLevel',
    heading: 'Monster Level',
    resolver: wrapResolver(resolveMonsterLevel),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildMonsterLevelPreview,
    resolvePending,
    registry,
  },
];

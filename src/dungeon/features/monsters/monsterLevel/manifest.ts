import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import {
  renderMonsterCompactNodes,
  renderMonsterDetailNodes,
} from '../../../adapters/render/monsters';
import { buildMonsterLevelPreview } from '../../../adapters/render/monsters/level';
import { createWanderingMonsterContextHandlers } from '../shared';
import { resolveMonsterLevel } from './monsterLevelResolvers';

const { resolvePending, registry } = createWanderingMonsterContextHandlers(
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

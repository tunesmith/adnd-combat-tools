import type { DungeonTableDefinition } from '../../types';
import { wrapResolver } from '../../shared';
import { renderMonsterCompactNodes, renderMonsterDetailNodes } from '../render';
import { createMonsterDungeonLevelContextHandlers } from '../shared';
import { buildHumanPreview } from './humanRender';
import { resolveHuman } from './humanResolvers';

const { resolvePending, registry } = createMonsterDungeonLevelContextHandlers(
  resolveHuman,
  1
);

export const humanTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'human',
    heading: 'Human Subtable',
    resolver: wrapResolver(resolveHuman),
    renderers: {
      renderDetail: renderMonsterDetailNodes,
      renderCompact: renderMonsterCompactNodes,
    },
    buildPreview: buildHumanPreview,
    resolvePending,
    registry,
  },
];

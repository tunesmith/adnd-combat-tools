import type { DungeonTableDefinition } from '../../types';
import { createMonsterTableDefinition } from '../shared';
import { buildMonsterLevelPreview } from './monsterLevelRender';
import { resolveMonsterLevel } from './monsterLevelResolvers';

export const monsterLevelTables: ReadonlyArray<DungeonTableDefinition> = [
  createMonsterTableDefinition({
    id: 'monsterLevel',
    heading: 'Monster Level',
    resolver: resolveMonsterLevel,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterLevelPreview,
    levelScopedEventPreview: true,
  }),
];

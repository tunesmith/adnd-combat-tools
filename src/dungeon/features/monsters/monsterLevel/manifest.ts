import type { DungeonTableDefinition } from '../../types';
import { defineMonsterTable } from '../shared';
import { buildMonsterLevelPreview } from './monsterLevelRender';
import { resolveMonsterLevel } from './monsterLevelResolvers';

export const monsterLevelTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterLevel',
    heading: 'Monster Level',
    resolve: resolveMonsterLevel,
    fallbackDungeonLevel: 1,
    preview: buildMonsterLevelPreview,
    levelScopedEventPreview: true,
  }),
];

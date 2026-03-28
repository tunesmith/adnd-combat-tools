import type { DungeonTableDefinition } from '../../types';
import { defineMonsterTable } from '../shared';
import { buildMonsterLevelPreview } from './monsterLevelRender';
import { resolveMonsterLevel } from './monsterLevelResolvers';

export const monsterLevelTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterLevel',
    heading: 'Monster Level',
    resolver: resolveMonsterLevel,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterLevelPreview,
    levelScopedEventPreview: true,
  }),
];

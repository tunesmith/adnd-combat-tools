import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
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

const buildMonsterEightPreview = createMonsterPreviewFactory({
  title: 'Monster (Level 8)',
  table: monsterEight,
  labelFor: (command) => MonsterEight[command] ?? String(command),
});

const buildDragonEightPreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 8)',
  table: dragonEight,
  labelFor: (command) => DragonEight[command] ?? String(command),
});

export const monsterEightTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterEight',
    heading: 'Monster (Level 8)',
    resolve: resolveMonsterEight,
    fallbackDungeonLevel: 1,
    preview: buildMonsterEightPreview,
  }),
  defineMonsterTable({
    id: 'dragonEight',
    heading: 'Dragon (Level 8)',
    resolve: resolveDragonEight,
    fallbackDungeonLevel: 8,
    preview: buildDragonEightPreview,
  }),
];

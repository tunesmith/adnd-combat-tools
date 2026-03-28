import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
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

const buildMonsterSevenPreview = createMonsterPreviewFactory({
  title: 'Monster (Level 7)',
  table: monsterSeven,
  labelFor: (command) => MonsterSeven[command] ?? String(command),
});

const buildDragonSevenPreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 7)',
  table: dragonSeven,
  labelFor: (command) => DragonSeven[command] ?? String(command),
});

export const monsterSevenTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterSeven',
    heading: 'Monster (Level 7)',
    resolve: resolveMonsterSeven,
    fallbackDungeonLevel: 1,
    preview: buildMonsterSevenPreview,
  }),
  defineMonsterTable({
    id: 'dragonSeven',
    heading: 'Dragon (Level 7)',
    resolve: resolveDragonSeven,
    fallbackDungeonLevel: 7,
    preview: buildDragonSevenPreview,
  }),
];

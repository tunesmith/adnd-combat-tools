import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
import {
  DragonTen,
  dragonTen,
  MonsterTen,
  monsterTen,
} from './monsterTenTables';
import { resolveDragonTen, resolveMonsterTen } from './monsterTenResolvers';

const buildMonsterTenPreview = createMonsterPreviewFactory({
  title: 'Monster (Level 10)',
  table: monsterTen,
  labelFor: (command) => MonsterTen[command] ?? String(command),
});

const buildDragonTenPreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 10)',
  table: dragonTen,
  labelFor: (command) => DragonTen[command] ?? String(command),
});

export const monsterTenTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterTen',
    heading: 'Monster (Level 10)',
    resolver: resolveMonsterTen,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterTenPreview,
  }),
  defineMonsterTable({
    id: 'dragonTen',
    heading: 'Dragon (Level 10)',
    resolver: resolveDragonTen,
    fallbackDungeonLevel: 10,
    buildPreview: buildDragonTenPreview,
  }),
];

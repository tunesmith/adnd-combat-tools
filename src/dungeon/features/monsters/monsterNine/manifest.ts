import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
import {
  DragonNine,
  dragonNine,
  MonsterNine,
  monsterNine,
} from './monsterNineTables';
import { resolveDragonNine, resolveMonsterNine } from './monsterNineResolvers';

const buildMonsterNinePreview = createMonsterPreviewFactory({
  title: 'Monster (Level 9)',
  table: monsterNine,
  labelFor: (command) => MonsterNine[command] ?? String(command),
});

const buildDragonNinePreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 9)',
  table: dragonNine,
  labelFor: (command) => DragonNine[command] ?? String(command),
});

export const monsterNineTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterNine',
    heading: 'Monster (Level 9)',
    resolver: resolveMonsterNine,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterNinePreview,
  }),
  defineMonsterTable({
    id: 'dragonNine',
    heading: 'Dragon (Level 9)',
    resolver: resolveDragonNine,
    fallbackDungeonLevel: 9,
    buildPreview: buildDragonNinePreview,
  }),
];

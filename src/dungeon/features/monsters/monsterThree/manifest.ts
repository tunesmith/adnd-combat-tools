import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
import {
  DragonThree,
  dragonThree,
  MonsterThree,
  monsterThree,
} from './monsterThreeTables';
import {
  resolveDragonThree,
  resolveMonsterThree,
} from './monsterThreeResolvers';

const buildMonsterThreePreview = createMonsterPreviewFactory({
  title: 'Monster (Level 3)',
  table: monsterThree,
  labelFor: (command) => MonsterThree[command] ?? String(command),
});

const buildDragonThreePreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 3)',
  table: dragonThree,
  labelFor: (command) => DragonThree[command] ?? String(command),
});

export const monsterThreeTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterThree',
    heading: 'Monster (Level 3)',
    resolver: resolveMonsterThree,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterThreePreview,
  }),
  defineMonsterTable({
    id: 'dragonThree',
    heading: 'Dragon (Level 3)',
    resolver: resolveDragonThree,
    fallbackDungeonLevel: 3,
    buildPreview: buildDragonThreePreview,
  }),
];

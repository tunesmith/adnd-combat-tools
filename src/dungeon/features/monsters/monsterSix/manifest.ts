import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
import {
  DragonSix,
  dragonSix,
  MonsterSix,
  monsterSix,
} from './monsterSixTables';
import { resolveDragonSix, resolveMonsterSix } from './monsterSixResolvers';

const buildMonsterSixPreview = createMonsterPreviewFactory({
  title: 'Monster (Level 6)',
  table: monsterSix,
  labelFor: (command) => MonsterSix[command] ?? String(command),
});

const buildDragonSixPreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 6)',
  table: dragonSix,
  labelFor: (command) => DragonSix[command] ?? String(command),
});

export const monsterSixTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterSix',
    heading: 'Monster (Level 6)',
    resolve: resolveMonsterSix,
    fallbackDungeonLevel: 1,
    preview: buildMonsterSixPreview,
  }),
  defineMonsterTable({
    id: 'dragonSix',
    heading: 'Dragon (Level 6)',
    resolve: resolveDragonSix,
    fallbackDungeonLevel: 6,
    preview: buildDragonSixPreview,
  }),
];

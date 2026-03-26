import type { DungeonTableDefinition } from '../../types';
import {
  createMonsterPreviewFactory,
  createMonsterTableDefinition,
} from '../shared';
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
  createMonsterTableDefinition({
    id: 'monsterSix',
    heading: 'Monster (Level 6)',
    resolver: resolveMonsterSix,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterSixPreview,
  }),
  createMonsterTableDefinition({
    id: 'dragonSix',
    heading: 'Dragon (Level 6)',
    resolver: resolveDragonSix,
    fallbackDungeonLevel: 6,
    buildPreview: buildDragonSixPreview,
  }),
];

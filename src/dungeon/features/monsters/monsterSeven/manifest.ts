import type { DungeonTableDefinition } from '../../types';
import {
  createMonsterPreviewFactory,
  createMonsterTableDefinition,
} from '../shared';
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
  createMonsterTableDefinition({
    id: 'monsterSeven',
    heading: 'Monster (Level 7)',
    resolver: resolveMonsterSeven,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterSevenPreview,
  }),
  createMonsterTableDefinition({
    id: 'dragonSeven',
    heading: 'Dragon (Level 7)',
    resolver: resolveDragonSeven,
    fallbackDungeonLevel: 7,
    buildPreview: buildDragonSevenPreview,
  }),
];

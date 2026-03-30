import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
import {
  DragonFiveOlder,
  DragonFiveYounger,
  dragonFiveOlder,
  dragonFiveYounger,
  MonsterFive,
  monsterFive,
} from './monsterFiveTables';
import {
  resolveDragonFiveOlder,
  resolveDragonFiveYounger,
  resolveMonsterFive,
} from './monsterFiveResolvers';

const buildMonsterFivePreview = createMonsterPreviewFactory({
  title: 'Monster (Level 5)',
  table: monsterFive,
  labelFor: (command) => MonsterFive[command] ?? String(command),
});

const buildDragonFiveYoungerPreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 5 Younger)',
  table: dragonFiveYounger,
  labelFor: (command) => DragonFiveYounger[command] ?? String(command),
});

const buildDragonFiveOlderPreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 5 Older)',
  table: dragonFiveOlder,
  labelFor: (command) => DragonFiveOlder[command] ?? String(command),
});

export const monsterFiveTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterFive',
    heading: 'Monster (Level 5)',
    resolve: resolveMonsterFive,
    fallbackDungeonLevel: 1,
    preview: buildMonsterFivePreview,
  }),
  defineMonsterTable({
    id: 'dragonFiveYounger',
    heading: 'Dragon (Level 5 Younger)',
    resolve: resolveDragonFiveYounger,
    fallbackDungeonLevel: 5,
    preview: buildDragonFiveYoungerPreview,
  }),
  defineMonsterTable({
    id: 'dragonFiveOlder',
    heading: 'Dragon (Level 5 Older)',
    resolve: resolveDragonFiveOlder,
    fallbackDungeonLevel: 5,
    preview: buildDragonFiveOlderPreview,
  }),
];

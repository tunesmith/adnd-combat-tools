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
    resolver: resolveMonsterFive,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterFivePreview,
  }),
  defineMonsterTable({
    id: 'dragonFiveYounger',
    heading: 'Dragon (Level 5 Younger)',
    resolver: resolveDragonFiveYounger,
    fallbackDungeonLevel: 5,
    buildPreview: buildDragonFiveYoungerPreview,
  }),
  defineMonsterTable({
    id: 'dragonFiveOlder',
    heading: 'Dragon (Level 5 Older)',
    resolver: resolveDragonFiveOlder,
    fallbackDungeonLevel: 5,
    buildPreview: buildDragonFiveOlderPreview,
  }),
];

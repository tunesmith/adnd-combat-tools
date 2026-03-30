import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
import {
  DragonFourOlder,
  DragonFourYounger,
  dragonFourOlder,
  dragonFourYounger,
  MonsterFour,
  monsterFour,
} from './monsterFourTables';
import {
  resolveDragonFourOlder,
  resolveDragonFourYounger,
  resolveMonsterFour,
} from './monsterFourResolvers';

const buildMonsterFourPreview = createMonsterPreviewFactory({
  title: 'Monster (Level 4)',
  table: monsterFour,
  labelFor: (command) => MonsterFour[command] ?? String(command),
});

const buildDragonFourYoungerPreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 4 Younger)',
  table: dragonFourYounger,
  labelFor: (command) => DragonFourYounger[command] ?? String(command),
});

const buildDragonFourOlderPreview = createMonsterPreviewFactory({
  title: 'Dragon (Level 4 Older)',
  table: dragonFourOlder,
  labelFor: (command) => DragonFourOlder[command] ?? String(command),
});

export const monsterFourTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterFour',
    heading: 'Monster (Level 4)',
    resolve: resolveMonsterFour,
    fallbackDungeonLevel: 1,
    preview: buildMonsterFourPreview,
  }),
  defineMonsterTable({
    id: 'dragonFourYounger',
    heading: 'Dragon (Level 4 Younger)',
    resolve: resolveDragonFourYounger,
    fallbackDungeonLevel: 4,
    preview: buildDragonFourYoungerPreview,
  }),
  defineMonsterTable({
    id: 'dragonFourOlder',
    heading: 'Dragon (Level 4 Older)',
    resolve: resolveDragonFourOlder,
    fallbackDungeonLevel: 4,
    preview: buildDragonFourOlderPreview,
  }),
];

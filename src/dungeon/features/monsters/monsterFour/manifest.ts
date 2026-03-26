import type { DungeonTableDefinition } from '../../types';
import {
  createMonsterPreviewFactory,
  createMonsterTableDefinition,
} from '../shared';
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
  createMonsterTableDefinition({
    id: 'monsterFour',
    heading: 'Monster (Level 4)',
    resolver: resolveMonsterFour,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterFourPreview,
  }),
  createMonsterTableDefinition({
    id: 'dragonFourYounger',
    heading: 'Dragon (Level 4 Younger)',
    resolver: resolveDragonFourYounger,
    fallbackDungeonLevel: 4,
    buildPreview: buildDragonFourYoungerPreview,
  }),
  createMonsterTableDefinition({
    id: 'dragonFourOlder',
    heading: 'Dragon (Level 4 Older)',
    resolver: resolveDragonFourOlder,
    fallbackDungeonLevel: 4,
    buildPreview: buildDragonFourOlderPreview,
  }),
];

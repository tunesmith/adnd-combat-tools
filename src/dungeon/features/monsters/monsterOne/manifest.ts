import type { DungeonTableDefinition } from '../../types';
import { monsterOne, MonsterOne } from './monsterOneTables';
import {
  createMonsterPreviewFactory,
  createMonsterTableDefinition,
} from '../shared';
import { resolveMonsterOne } from './monsterOneResolvers';

const buildMonsterOnePreview = createMonsterPreviewFactory({
  title: 'Monster (Level 1)',
  table: monsterOne,
  labelFor: (command) => MonsterOne[command] ?? String(command),
});

export const monsterOneTables: ReadonlyArray<DungeonTableDefinition> = [
  createMonsterTableDefinition({
    id: 'monsterOne',
    heading: 'Monster (Level 1)',
    resolver: resolveMonsterOne,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterOnePreview,
  }),
];

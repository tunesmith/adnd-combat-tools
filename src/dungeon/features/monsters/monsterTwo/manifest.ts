import type { DungeonTableDefinition } from '../../types';
import { createMonsterPreviewFactory, defineMonsterTable } from '../shared';
import { resolveMonsterTwo } from './monsterTwoResolvers';
import { monsterTwo, MonsterTwo } from './monsterTwoTable';

const buildMonsterTwoPreview = createMonsterPreviewFactory({
  title: 'Monster (Level 2)',
  table: monsterTwo,
  labelFor: (command) => MonsterTwo[command] ?? String(command),
});

export const monsterTwoTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'monsterTwo',
    heading: 'Monster (Level 2)',
    resolver: resolveMonsterTwo,
    fallbackDungeonLevel: 1,
    buildPreview: buildMonsterTwoPreview,
  }),
];

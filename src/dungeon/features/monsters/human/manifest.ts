import type { DungeonTableDefinition } from '../../types';
import { defineMonsterTable } from '../shared';
import { buildHumanPreview } from './humanRender';
import { resolveHuman } from './humanResolvers';

export const humanTables: ReadonlyArray<DungeonTableDefinition> = [
  defineMonsterTable({
    id: 'human',
    heading: 'Human Subtable',
    resolver: resolveHuman,
    fallbackDungeonLevel: 1,
    buildPreview: buildHumanPreview,
  }),
];

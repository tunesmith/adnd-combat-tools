import type { DungeonTableDefinition } from '../../types';
import { createMonsterTableDefinition } from '../shared';
import { buildHumanPreview } from './humanRender';
import { resolveHuman } from './humanResolvers';

export const humanTables: ReadonlyArray<DungeonTableDefinition> = [
  createMonsterTableDefinition({
    id: 'human',
    heading: 'Human Subtable',
    resolver: resolveHuman,
    fallbackDungeonLevel: 1,
    buildPreview: buildHumanPreview,
  }),
];

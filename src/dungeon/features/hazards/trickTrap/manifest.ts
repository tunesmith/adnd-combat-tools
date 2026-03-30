import type { DungeonTableDefinition } from '../../types';
import { defineHazardLevelTable } from '../shared';
import {
  buildTrickTrapPreview,
  renderTrickTrapDetail,
  renderTrickTrapCompactNodes,
} from './trickTrapRender';
import { resolveTrickTrap } from './trickTrapResolvers';

export const trickTrapTables: ReadonlyArray<DungeonTableDefinition> = [
  defineHazardLevelTable({
    id: 'trickTrap',
    heading: 'Trick / Trap',
    event: 'trickTrap',
    resolve: resolveTrickTrap,
    render: {
      detail: renderTrickTrapDetail,
      compact: renderTrickTrapCompactNodes,
    },
    preview: buildTrickTrapPreview,
  }),
];

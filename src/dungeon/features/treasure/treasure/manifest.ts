import type { DungeonTableDefinition } from '../../types';
import {
  markContextualResolution,
  withoutAppend,
  wrapResolver,
} from '../../shared';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { readTableContextOfKind } from '../../../helpers/tableContext';
import { createTreasureEventPreviewBuilder } from '../shared';
import { resolveTreasure } from './treasureResolvers';
import {
  buildTreasurePreview,
  renderTreasureCompactNodes,
  renderTreasureDetail,
} from './treasureRender';

function deriveDungeonLevelFromAncestors(
  ancestors: OutcomeEventNode[]
): number | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (ancestor.event.kind === 'periodicCheck') {
      return ancestor.event.level;
    }
    if (ancestor.event.kind === 'doorBeyond') {
      const doorLevel = ancestor.event.level;
      if (typeof doorLevel === 'number') {
        return doorLevel;
      }
    }
  }
  return undefined;
}

export const treasureTables: ReadonlyArray<DungeonTableDefinition> = [
  markContextualResolution({
    id: 'treasure',
    heading: 'Treasure',
    resolver: wrapResolver(resolveTreasure),
    renderers: {
      renderDetail: renderTreasureDetail,
      renderCompact: withoutAppend(renderTreasureCompactNodes),
    },
    buildPreview: buildTreasurePreview,
    buildEventPreview: createTreasureEventPreviewBuilder(buildTreasurePreview),
    registry: ({ roll, context }) => {
      const ctx = readTableContextOfKind(context, 'treasure');
      return resolveTreasure({
        roll,
        level: ctx?.level ?? 1,
        withMonster: ctx?.withMonster ?? false,
        rollIndex: ctx?.rollIndex,
        totalRolls: ctx?.totalRolls,
      });
    },
    resolvePending: (pending, ancestors) => {
      const ctx = readTableContextOfKind(pending.context, 'treasure');
      const level =
        ctx?.level ?? deriveDungeonLevelFromAncestors(ancestors) ?? 1;
      const withMonster = ctx?.withMonster ?? false;
      const rollIndex = ctx?.rollIndex;
      const totalRolls = ctx?.totalRolls;
      return resolveTreasure({ level, withMonster, rollIndex, totalRolls });
    },
  }),
];

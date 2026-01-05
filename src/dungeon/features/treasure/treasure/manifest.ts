import type { DungeonTableDefinition, DetailRenderer } from '../../types';
import { wrapResolver } from '../../shared';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { resolveTreasure } from './treasureResolvers';
import {
  buildTreasurePreview,
  renderTreasureCompactNodes,
  renderTreasureDetail,
} from './treasureRender';

const withoutAppend =
  (
    renderer: (
      node: Parameters<DetailRenderer>[0]
    ) => ReturnType<DetailRenderer>
  ) =>
  (
    node: Parameters<DetailRenderer>[0],
    _append: Parameters<DetailRenderer>[1]
  ) =>
    renderer(node);

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
  {
    id: 'treasure',
    heading: 'Treasure',
    resolver: wrapResolver(resolveTreasure),
    renderers: {
      renderDetail: renderTreasureDetail,
      renderCompact: withoutAppend(renderTreasureCompactNodes),
    },
    buildPreview: buildTreasurePreview,
    registry: ({ roll, context }) => {
      const ctx = context && context.kind === 'treasure' ? context : undefined;
      return resolveTreasure({
        roll,
        level: ctx?.level ?? 1,
        withMonster: ctx?.withMonster ?? false,
        rollIndex: ctx?.rollIndex,
        totalRolls: ctx?.totalRolls,
      });
    },
    resolvePending: (pending, ancestors) => {
      const raw = pending.context;
      const ctx =
        raw &&
        typeof raw === 'object' &&
        (raw as { kind?: unknown }).kind === 'treasure'
          ? (raw as {
              level?: unknown;
              withMonster?: unknown;
              rollIndex?: unknown;
              totalRolls?: unknown;
            })
          : undefined;
      const level =
        (ctx && typeof ctx.level === 'number' ? ctx.level : undefined) ??
        deriveDungeonLevelFromAncestors(ancestors) ??
        1;
      const withMonster =
        ctx && typeof ctx.withMonster === 'boolean' ? ctx.withMonster : false;
      const rollIndex =
        ctx && typeof ctx.rollIndex === 'number' ? ctx.rollIndex : undefined;
      const totalRolls =
        ctx && typeof ctx.totalRolls === 'number' ? ctx.totalRolls : undefined;
      return resolveTreasure({ level, withMonster, rollIndex, totalRolls });
    },
  },
];

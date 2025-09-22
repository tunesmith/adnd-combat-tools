import { Stairs, stairs } from '../../../../../tables/dungeon/stairs';
import { resolveStairs } from '../../../../../dungeon/domain/resolvers';
import { normalizeOutcomeTree } from '../../../../../dungeon/helpers/outcomeTree';
import { renderDetailTree } from '../../../../../dungeon/adapters/render';
import type { DungeonTablePreview } from '../../../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../../../dungeon/domain/outcome';

function pickRollForStairs(cmd: Stairs): number {
  const entry = stairs.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function detailNodesFor(node: DungeonOutcomeNode) {
  const normalized = normalizeOutcomeTree(node);
  const event = normalized.type === 'event' ? normalized : undefined;
  if (!event) throw new Error('Expected event outcome');
  return renderDetailTree(event as OutcomeEventNode);
}

describe('Stairs detail previews', () => {
  test('DownOne -> Egress (1 level) preview', () => {
    const roll = pickRollForStairs(Stairs.DownOne);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:one')).toBe(true);
  });

  test('DownTwo -> Egress (2 levels) preview', () => {
    const roll = pickRollForStairs(Stairs.DownTwo);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:two')).toBe(true);
  });

  test('DownThree -> Egress (3 levels) preview', () => {
    const roll = pickRollForStairs(Stairs.DownThree);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'egress:three')).toBe(true);
  });

  test('UpDead -> Chute preview', () => {
    const roll = pickRollForStairs(Stairs.UpDead);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chute')).toBe(true);
  });

  test('DownDead -> Chute preview', () => {
    const roll = pickRollForStairs(Stairs.DownDead);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chute')).toBe(true);
  });

  test('UpOneDownTwo -> Chamber Dimensions preview', () => {
    const roll = pickRollForStairs(Stairs.UpOneDownTwo);
    const detailNodes = detailNodesFor(resolveStairs({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'chamberDimensions')).toBe(true);
  });
});

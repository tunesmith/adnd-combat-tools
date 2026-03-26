import {
  SpecialPassage,
  specialPassage,
} from '../../../../../dungeon/features/navigation/specialPassage/specialPassageTable';
import { resolveSpecialPassage } from '../../../../../dungeon/features/navigation/specialPassage/specialPassageResolvers';
import { normalizeOutcomeTree } from '../../../../../dungeon/helpers/outcomeTree';
import { renderDetailTree } from '../../../../../dungeon/adapters/render';
import type { AnyDungeonTablePreview } from '../../../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../../../dungeon/domain/outcome';

function pickRollForSpecialPassage(cmd: SpecialPassage): number {
  const entry = specialPassage.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function detailNodesFor(node: DungeonOutcomeNode) {
  const normalized = normalizeOutcomeTree(node);
  const event = normalized.type === 'event' ? normalized : undefined;
  if (!event) throw new Error('Expected event outcome');
  return renderDetailTree(event as OutcomeEventNode);
}

describe('Special passage detail previews', () => {
  test('FiftyFeetGalleries -> Gallery Stair Location preview', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.FiftyFeetGalleries);
    const detailNodes = detailNodesFor(resolveSpecialPassage({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as AnyDungeonTablePreview[];
    expect(previews.some((p) => p.id === 'galleryStairLocation')).toBe(true);
  });

  test('TenFootStream -> Stream Construction preview', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TenFootStream);
    const detailNodes = detailNodesFor(resolveSpecialPassage({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as AnyDungeonTablePreview[];
    expect(previews.some((p) => p.id === 'streamConstruction')).toBe(true);
  });

  test('Twenty/Forty/Sixty Foot River -> River Construction preview', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TwentyFootRiver);
    const detailNodes = detailNodesFor(resolveSpecialPassage({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as AnyDungeonTablePreview[];
    expect(previews.some((p) => p.id === 'riverConstruction')).toBe(true);
  });

  test('TwentyFootChasm -> Depth and Construction previews', () => {
    const roll = pickRollForSpecialPassage(SpecialPassage.TwentyFootChasm);
    const detailNodes = detailNodesFor(resolveSpecialPassage({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as AnyDungeonTablePreview[];
    const ids = previews.map((p) => p.id);
    expect(ids.includes('chasmDepth')).toBe(true);
    expect(ids.includes('chasmConstruction')).toBe(true);
  });
});

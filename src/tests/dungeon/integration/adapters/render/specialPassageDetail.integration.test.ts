import {
  renderDetailTree,
  toCompactRender,
} from '../../../../../dungeon/adapters/render';
import { resolvePeriodicCheck } from '../../../../../dungeon/features/navigation/entry/entryResolvers';
import { resolvePassageWidth } from '../../../../../dungeon/features/navigation/passageWidth/passageWidthResolvers';
import { resolvePassageTurns } from '../../../../../dungeon/features/navigation/passageTurn/passageTurnResolvers';
import {
  applyToPending,
  isParagraphNode,
  resolveSequenceWithRolls,
} from '../../../../support/dungeon/detail-utils';
import { collectPreviews } from '../../../../support/dungeon/previewUtils';

describe('detail rendering with special passage', () => {
  it('allows inspecting the detail nodes for a special passage sequence', () => {
    const periodic = resolvePeriodicCheck({ roll: 12, level: 1 });
    const withTurns = applyToPending(
      periodic,
      'passageTurns',
      resolvePassageTurns({ roll: 1 })
    );
    const withWidth = applyToPending(
      withTurns,
      'passageWidth',
      resolvePassageWidth({ roll: 19 })
    );
    const detailNodes = renderDetailTree(withWidth);
    expect(
      collectPreviews(detailNodes).filter(
        (node) => node.id === 'specialPassage'
      )
    ).toHaveLength(1);
  });

  it('captures special passage preview via staged dungeon steps', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      collectPreviews(detailNodes).filter(
        (node) => node.id === 'specialPassage'
      )
    ).toHaveLength(1);
  });

  it('verifies that specialPassage only shows up once in detail mode', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19, 20], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    const specialPassagePreviews = collectPreviews(detailNodes).filter(
      (node) => node.id === 'specialPassage'
    );
    expect(specialPassagePreviews).toHaveLength(1);
  });

  it('verifies that proper output shows in deep chasms', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19, 20, 6, 1], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    const chasmDepthPreviews = collectPreviews(detailNodes).filter(
      (node) => node.id === 'chasmDepth'
    );
    expect(chasmDepthPreviews).toHaveLength(1);
    const chasmConstructionPreviews = collectPreviews(detailNodes).filter(
      (node) => node.id === 'chasmConstruction'
    );
    expect(chasmConstructionPreviews).toHaveLength(1);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim() === "The chasm is 200' deep."
      )
    ).toBe(true);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim() === 'A bridge crosses the chasm.'
      )
    ).toBe(true);
  });

  it('renders compact output for deep chasm sequences', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19, 20, 6, 1], 1);
    const compactNodes = toCompactRender(resolvedTree);
    const paragraph = compactNodes.find(isParagraphNode);
    expect(paragraph?.text.trim()).toBe(
      "The passage turns left 90 degrees - check again in 30'. A chasm, 20' wide, bisects the passage. The chasm is 200' deep. A bridge crosses the chasm."
    );
  });

  it('keeps gallery stair occurrence preview pending when passage end is rolled', () => {
    const resolvedTree = resolveSequenceWithRolls([12, 1, 19, 11, 5], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    const previewIds = collectPreviews(detailNodes).map((node) => node.id);
    const locationPreviewIndex = previewIds.indexOf('galleryStairLocation');
    const occurrencePreviewIndex = previewIds.indexOf('galleryStairOccurrence');
    expect(locationPreviewIndex).toBeGreaterThan(-1);
    expect(occurrencePreviewIndex).toBeGreaterThan(locationPreviewIndex);
  });
});

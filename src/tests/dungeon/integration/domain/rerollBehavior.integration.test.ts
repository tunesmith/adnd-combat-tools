import { renderDetailTree } from '../../../../dungeon/adapters/render';
import { resolveDoorLocation } from '../../../../dungeon/features/navigation/doorChain/doorChainResolvers';
import { resolvePassageWidth } from '../../../../dungeon/features/navigation/passageWidth/passageWidthResolvers';
import { resolveSpecialPassage } from '../../../../dungeon/features/navigation/specialPassage/specialPassageResolvers';
import {
  applyResolvedOutcome,
  countPendingNodes,
  normalizeOutcomeTree,
} from '../../../../dungeon/helpers/outcomeTree';
import {
  findEventByKind,
  resolveSequenceWithRolls,
} from '../../../support/dungeon/detail-utils';

describe('reroll updates', () => {
  it('replaces passage width text when rerolled', () => {
    const initialTree = resolveSequenceWithRolls([12, 1, 5], 1);
    const widthEvent = findEventByKind(initialTree, 'passageWidth');
    expect(widthEvent?.id).toBeDefined();
    const normalizedResolution = normalizeOutcomeTree(
      resolvePassageWidth({ roll: 17 }),
      widthEvent?.id ?? 'passageWidth'
    );
    const rerolledTree = normalizeOutcomeTree(
      applyResolvedOutcome(
        initialTree,
        widthEvent?.id ?? 'passageWidth',
        normalizedResolution
      )
    );
    const detailNodes = renderDetailTree(rerolledTree);
    expect(
      detailNodes.filter(
        (node) => node.kind === 'paragraph' && node.text.includes("10' wide")
      )
    ).toHaveLength(0);
    expect(
      detailNodes.filter(
        (node) => node.kind === 'paragraph' && node.text.includes("30' wide")
      )
    ).toHaveLength(1);
    const widthPreviews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'passageWidth'
    );
    expect(widthPreviews).toHaveLength(1);
    expect(countPendingNodes(rerolledTree)).toBe(0);
  });

  it('replaces door location narrative on reroll', () => {
    const initialTree = resolveSequenceWithRolls([3, 13], 1);
    const doorEvent = findEventByKind(initialTree, 'doorLocation');
    expect(doorEvent?.id).toBeDefined();

    const rerollOutcome = normalizeOutcomeTree(
      resolveDoorLocation({
        roll: 2,
        existing: doorEvent?.event.doorChain?.existing ?? [],
        sequence: doorEvent?.event.sequence ?? 0,
      }),
      doorEvent?.id
    );

    const rerolledTree = normalizeOutcomeTree(
      applyResolvedOutcome(
        initialTree,
        doorEvent?.id ?? 'doorLocation',
        rerollOutcome
      )
    );

    const detailNodes = renderDetailTree(rerolledTree);
    expect(
      detailNodes.filter(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.includes('A door is to the Left')
      )
    ).toHaveLength(1);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' && node.text.includes('A door is Ahead')
      )
    ).toBe(false);
  });

  it('updates special passage outcome without duplicating previews', () => {
    const initialTree = resolveSequenceWithRolls([12, 1, 19, 4], 1);
    const specialPassageEvent = findEventByKind(initialTree, 'specialPassage');
    expect(specialPassageEvent?.id).toBeDefined();

    const rerollOutcome = normalizeOutcomeTree(
      resolveSpecialPassage({ roll: 13 }),
      specialPassageEvent?.id
    );

    const rerolledTree = normalizeOutcomeTree(
      applyResolvedOutcome(
        initialTree,
        specialPassageEvent?.id ?? 'specialPassage',
        rerollOutcome
      )
    );

    const detailNodes = renderDetailTree(rerolledTree);
    expect(
      detailNodes.filter(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.includes("A stream, 10' wide, bisects the passage.")
      )
    ).toHaveLength(1);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.includes('columns down the center')
      )
    ).toBe(false);
    const previews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'specialPassage'
    );
    expect(previews).toHaveLength(1);
    expect(countPendingNodes(rerolledTree)).toBeGreaterThan(0);
  });
});

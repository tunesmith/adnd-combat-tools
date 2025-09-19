import { renderDetailTree } from '../../dungeon/adapters/render';
import { resolveSequenceWithRolls } from './detail-utils';

describe('detail rendering for chamber unusual size rerolls', () => {
  it('keeps unusual size pending when a reroll is indicated', () => {
    const resolvedTree = resolveSequenceWithRolls([14, 18, 5, 15], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    const unusualSizePreviews = detailNodes.filter(
      (node) => node.kind === 'table-preview' && node.id === 'unusualSize'
    );
    expect(unusualSizePreviews).toHaveLength(1);
  });

  it('surfaces circular chamber follow-up tables', () => {
    const resolvedTree = resolveSequenceWithRolls([14, 18, 1], 1);
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'table-preview' && node.id === 'circularContents'
      )
    ).toBe(true);
  });

  it('accumulates unusual size rerolls before finalizing the size', () => {
    const resolvedTree = resolveSequenceWithRolls(
      [14, 18, 5, 15, 16, 15, 1],
      1
    );
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.filter(
        (node) => node.kind === 'table-preview' && node.id === 'unusualSize'
      )
    ).toHaveLength(1);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim() === 'It is about 4,500 sq. ft.'
      )
    ).toBe(true);
  });

  it('resolves circular pool chains including transporter details', () => {
    const resolvedTree = resolveSequenceWithRolls(
      [14, 18, 1, 1, 19, 20, 1, 6],
      1
    );
    const detailNodes = renderDetailTree(resolvedTree);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim().startsWith('It is a transporter.')
      )
    ).toBe(true);
    expect(
      detailNodes.some(
        (node) =>
          node.kind === 'paragraph' &&
          node.text.trim() === 'It transports characters back to the surface.'
      )
    ).toBe(true);
  });
});

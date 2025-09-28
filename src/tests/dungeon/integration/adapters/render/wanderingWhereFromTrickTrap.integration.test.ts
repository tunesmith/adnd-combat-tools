import { PeriodicCheck } from '../../../../../tables/dungeon/periodicCheck';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import {
  renderWanderingWhereFromDetail,
  renderWanderingWhereFromCompactNodes,
} from '../../../../../dungeon/adapters/render/periodicOutcome';
import { resolveTrickTrap } from '../../../../../dungeon/domain/resolvers';
import type { AppendPreviewFn } from '../../../../../dungeon/adapters/render/shared';

const noopAppend: AppendPreviewFn = () => undefined;

const GAS_CORRIDOR_TEXT =
  "Gas; party has detected it, but must breathe it to continue along corridor, as it covers 60' ahead. Mark map accordingly regardless of turning back or not. (See TABLE VII. A.) ";

describe('renderWanderingWhereFrom with trick trap', () => {
  test('includes trick/trap details in both modes', () => {
    const trickTrapNode = resolveTrickTrap({ roll: 17 }); // Gas Corridor
    if (trickTrapNode.type !== 'event') {
      throw new Error('Expected trick trap event node');
    }

    const whereFromNode: OutcomeEventNode = {
      type: 'event',
      roll: 19,
      event: {
        kind: 'wanderingWhereFrom',
        result: PeriodicCheck.TrickTrap,
      },
      children: [trickTrapNode],
    };

    const detailNodes = renderWanderingWhereFromDetail(
      whereFromNode,
      noopAppend
    );
    const detailParagraph = detailNodes.find(
      (node): node is { kind: 'paragraph'; text: string } =>
        node.kind === 'paragraph'
    );
    expect(detailParagraph).toBeDefined();
    expect(detailParagraph?.text).toContain(GAS_CORRIDOR_TEXT);

    const compactNodes = renderWanderingWhereFromCompactNodes(whereFromNode);
    const compactParagraph = compactNodes.find(
      (node): node is { kind: 'paragraph'; text: string } =>
        node.kind === 'paragraph'
    );
    expect(compactParagraph).toBeDefined();
    expect(compactParagraph?.text).toContain(GAS_CORRIDOR_TEXT);
  });
});

import { TreasureWithoutMonster } from '../../../../../dungeon/features/treasure/treasure/treasureTable';
import type {
  OutcomeEvent,
  OutcomeEventNode,
} from '../../../../../dungeon/domain/outcome';
import {
  createFeedSnapshot,
  resolvePendingPreview,
} from '../../../../support/dungeon/uiPreviewHarness';

function findOutcomeEvents(
  node: OutcomeEventNode | undefined,
  kind: OutcomeEvent['kind']
): OutcomeEventNode[] {
  if (!node || node.type !== 'event') return [];
  const results: OutcomeEventNode[] = [];
  const visit = (current: OutcomeEventNode | undefined): void => {
    if (!current || current.type !== 'event') return;
    if (current.event.kind === kind) {
      results.push(current);
    }
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };
  visit(node);
  return results;
}

describe('door treasure scaling', () => {
  test('coins scale with dungeon level', () => {
    let feed = createFeedSnapshot({
      action: 'door',
      roll: 19,
      dungeonLevel: 2,
    });
    feed = resolvePendingPreview(feed, 'chamberDimensions', 1);
    feed = resolvePendingPreview(feed, 'numberOfExits', 1);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 1);

    const treasureNodes = findOutcomeEvents(feed.outcome, 'treasure');
    expect(treasureNodes).toHaveLength(1);
    const treasureNode = treasureNodes[0];
    if (!treasureNode) {
      throw new Error('Missing treasure event in outcome.');
    }
    const treasureEvent = treasureNode.event as Extract<
      OutcomeEvent,
      { kind: 'treasure' }
    >;
    expect(treasureEvent.level).toBe(2);
    const [entry] = treasureEvent.entries;
    expect(entry?.command).toBe(TreasureWithoutMonster.CopperPerLevel);
    expect(entry?.quantity).toBe(2000);
    expect(entry?.display).toContain('2,000');
  });
});

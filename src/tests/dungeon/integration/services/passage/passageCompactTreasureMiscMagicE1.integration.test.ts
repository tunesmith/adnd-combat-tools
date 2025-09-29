import {
  simulateCompactRunWithSequence,
  DirectiveMode,
} from '../../../../support/dungeon/dungeonRollHarness';
import type { DungeonOutcomeNode } from '../../../../../dungeon/domain/outcome';
import { TreasureMiscMagicE1 } from '../../../../../tables/dungeon/treasureMiscMagicE1';

describe('passage compact treasure misc magic E1 handling', () => {
  it('resolves the bag of beans result in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 18 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (miscEvent && miscEvent.event.kind === 'treasureMiscMagicE1') {
      expect(miscEvent.event.result).toBe(TreasureMiscMagicE1.BagOfBeans);
    } else {
      throw new Error('treasureMiscMagicE1 event not found');
    }

    const compactParagraphs = result
      .compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a bag of beans.');
  });
});

type EventNode = Extract<DungeonOutcomeNode, { type: 'event' }>;
function findEvent(
  node: DungeonOutcomeNode | undefined,
  kind: EventNode['event']['kind']
): EventNode | undefined {
  if (!node) return undefined;
  if (node.type === 'event') {
    if (node.event.kind === kind) return node;
    if (!node.children) return undefined;
    for (const child of node.children) {
      if (child.type === 'event') {
        const found = findEvent(child, kind);
        if (found) return found;
      }
    }
  }
  return undefined;
}

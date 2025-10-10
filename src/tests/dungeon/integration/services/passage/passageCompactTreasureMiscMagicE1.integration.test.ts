import {
  simulateCompactRunWithSequence,
  DirectiveMode,
} from '../../../../support/dungeon/dungeonRollHarness';
import type { DungeonOutcomeNode } from '../../../../../dungeon/domain/outcome';
import { TreasureMiscMagicE1 } from '../../../../../tables/dungeon/treasureMiscMagicE1';
import { TreasureBagOfHolding } from '../../../../../tables/dungeon/treasureBagOfHolding';
import { TreasureBagOfTricks } from '../../../../../tables/dungeon/treasureBagOfTricks';
import { TreasureBracersOfDefense } from '../../../../../tables/dungeon/treasureBracersOfDefense';
import { TreasureBucknardsEverfullPurse } from '../../../../../tables/dungeon/treasureBucknardsEverfullPurse';

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

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a bag of beans.');
  });

  it('resolves bag of holding capacity in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 24 },
        { tableId: 'treasureBagOfHolding', roll: 95 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const bagEvent = findEvent(result.outcome, 'treasureBagOfHolding');
    expect(bagEvent).toBeDefined();
    if (bagEvent && bagEvent.event.kind === 'treasureBagOfHolding') {
      expect(bagEvent.event.result).toBe(TreasureBagOfHolding.TypeIV);
    } else {
      throw new Error('treasureBagOfHolding event not found');
    }

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a bag of holding (250 cu. ft., 1,500 lb capacity; bag weight 60 lb).'
    );
  });

  it('resolves bag of tricks type in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 28 },
        { tableId: 'treasureBagOfTricks', roll: 9 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (miscEvent && miscEvent.event.kind === 'treasureMiscMagicE1') {
      expect(miscEvent.event.result).toBe(TreasureMiscMagicE1.BagOfTricks);
    } else {
      throw new Error('treasureMiscMagicE1 event not found');
    }

    const bagOfTricksEvent = findEvent(result.outcome, 'treasureBagOfTricks');
    expect(bagOfTricksEvent).toBeDefined();
    if (
      bagOfTricksEvent &&
      bagOfTricksEvent.event.kind === 'treasureBagOfTricks'
    ) {
      expect(bagOfTricksEvent.event.result).toBe(TreasureBagOfTricks.Jackal);
    } else {
      throw new Error('treasureBagOfTricks event not found');
    }

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a bag of tricks, "jackal".');
  });

  it('resolves bracers of defense armor class in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 60 },
        { tableId: 'treasureBracersOfDefense', roll: 60 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE1') {
      throw new Error('treasureMiscMagicE1 event not found');
    }
    expect(miscEvent.event.result).toBe(TreasureMiscMagicE1.BracersOfDefense);

    const bracersEvent = findEvent(result.outcome, 'treasureBracersOfDefense');
    expect(bracersEvent).toBeDefined();
    if (
      !bracersEvent ||
      bracersEvent.event.kind !== 'treasureBracersOfDefense'
    ) {
      throw new Error('treasureBracersOfDefense event not found');
    }
    expect(bracersEvent.event.result).toBe(TreasureBracersOfDefense.AC4);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a pair of bracers of defense ac4.'
    );
  });

  it("resolves Bucknard's everfull purse contents in compact mode", () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 99 },
        { tableId: 'treasureBucknardsEverfullPurse', roll: 55 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE1') {
      throw new Error('treasureMiscMagicE1 event not found');
    }
    expect(miscEvent.event.result).toBe(
      TreasureMiscMagicE1.BucknardsEverfullPurse
    );

    const purseEvent = findEvent(
      result.outcome,
      'treasureBucknardsEverfullPurse'
    );
    expect(purseEvent).toBeDefined();
    if (
      !purseEvent ||
      purseEvent.event.kind !== 'treasureBucknardsEverfullPurse'
    ) {
      throw new Error('treasureBucknardsEverfullPurse event not found');
    }
    expect(purseEvent.event.result).toBe(
      TreasureBucknardsEverfullPurse.Platinum
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      "bucknard's everfull purse of platinum is here."
    );
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

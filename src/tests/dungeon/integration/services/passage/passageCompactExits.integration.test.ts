import { toDetailRender, toCompactRender } from '../../../../../dungeon/adapters/render';
import {
  resolveRoomDimensions,
  resolveChamberDimensions,
  resolveNumberOfExits,
} from '../../../../../dungeon/domain/resolvers';
import {
  normalizeOutcomeTree,
  resolveOutcomeNode,
} from '../../../../../dungeon/helpers/outcomeTree';
import type { DungeonMessage } from '../../../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../../../dungeon/domain/outcome';
import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';

function isParagraph(
  node: DungeonMessage
): node is Extract<DungeonMessage, { kind: 'paragraph'; text: string }> {
  return node.kind === 'paragraph';
}

function findParagraph(
  messages: DungeonMessage[]
): Extract<DungeonMessage, { kind: 'paragraph'; text: string }> | undefined {
  return messages.find(isParagraph);
}

function assertEvent(node: DungeonOutcomeNode): OutcomeEventNode {
  if (node.type !== 'event') {
    throw new Error('Expected event outcome');
  }
  return node;
}

function compactNodesFor(node: DungeonOutcomeNode): DungeonMessage[] {
  const normalized = normalizeOutcomeTree(node);
  const resolved =
    resolveOutcomeNode(assertEvent(normalized)) ?? assertEvent(normalized);
  return toCompactRender(resolved) as DungeonMessage[];
}

describe('Compact rendering for exits', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('10x10 room with OneTwo600 yields one additional door', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 1);
    const messages = compactNodesFor(resolveRoomDimensions({ roll: 1 }));
    const para = findParagraph(messages);
    expect(para).toBeTruthy();
    expect(para?.text.trim()).toContain('There is 1 additional door');
    expect(para?.text).toContain('Determine its location and direction');
    spy.mockRestore();

    const detail = resolveNumberOfExits({
      roll: 1,
      length: 10,
      width: 10,
      isRoom: true,
    });
    const detailParagraph = findParagraph(
      toDetailRender(detail) as DungeonMessage[]
    );
    expect(detailParagraph?.text.trim()).toContain(
      'There is 1 additional door'
    );
  });

  test('OneToFour result records rolled count', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 17) // selects OneToFour bucket
      .mockImplementationOnce(() => 3); // yields count = 3
    const messages = compactNodesFor(resolveRoomDimensions({ roll: 3 }));
    const para = findParagraph(messages);
    expect(para?.text).toContain('(1d4 result: 3)');
    expect(para?.text).toContain('There are 3 additional doors');
    spy.mockRestore();
  });

  test('Large chamber yields passages instead of doors', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 4); // TwoThree600 -> 3 passages when area > 600
    const messages = compactNodesFor(resolveChamberDimensions({ roll: 14 }));
    const para = findParagraph(messages);
    expect(para?.text).toContain('There are 3 additional passages');
    spy.mockRestore();
  });

  test('DoorChamberOrPassageRoom flips default noun based on context', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 19);
    const messages = compactNodesFor(resolveRoomDimensions({ roll: 2 }));
    const para = findParagraph(messages);
    expect(para?.text).toContain('There is a passage leaving this room');
    spy.mockRestore();
  });
});

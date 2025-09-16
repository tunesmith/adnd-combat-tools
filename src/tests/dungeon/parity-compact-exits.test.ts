import { roomMessages } from '../../dungeon/services/roomResult';
import { chamberMessages } from '../../dungeon/services/chamberResult';
import { toDetailRender } from '../../dungeon/adapters/render';
import { resolveNumberOfExits } from '../../dungeon/domain/resolvers';
import type { DungeonMessage } from '../../types/dungeon';
import * as dungeonLookup from '../../dungeon/helpers/dungeonLookup';

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

describe('Compact rendering for exits', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('10x10 room with OneTwo600 yields one additional door', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 1);
    const { messages } = roomMessages({ roll: 1, detailMode: false });
    const para = findParagraph(messages as DungeonMessage[]);
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
    const { messages } = roomMessages({ roll: 3, detailMode: false });
    const para = findParagraph(messages as DungeonMessage[]);
    expect(para?.text).toContain('(1d4 result: 3)');
    expect(para?.text).toContain('There are 3 additional doors');
    spy.mockRestore();
  });

  test('Large chamber yields passages instead of doors', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 4); // TwoThree600 -> 3 passages when area > 600
    const { messages } = chamberMessages({ roll: 14, detailMode: false });
    const para = findParagraph(messages as DungeonMessage[]);
    expect(para?.text).toContain('There are 3 additional passages');
    spy.mockRestore();
  });

  test('DoorChamberOrPassageRoom flips default noun based on context', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 19);
    const { messages } = roomMessages({ roll: 2, detailMode: false });
    const para = findParagraph(messages as DungeonMessage[]);
    expect(para?.text).toContain('There is a passage leaving this room');
    spy.mockRestore();
  });
});

import {
  toDetailRender,
  toCompactRender,
} from '../../../../../dungeon/adapters/render';
import {
  resolveRoomDimensions,
  resolveChamberDimensions,
} from '../../../../../dungeon/features/environment/roomsChambers/roomsChambersResolvers';
import { resolveNumberOfExits } from '../../../../../dungeon/features/navigation/exit/numberOfExitsResolver';
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

function findExitList(
  messages: DungeonMessage[]
): Extract<DungeonMessage, { kind: 'exit-list' }> | undefined {
  return messages.find(
    (node): node is Extract<DungeonMessage, { kind: 'exit-list' }> =>
      node.kind === 'exit-list'
  );
}

function collectCompactText(messages: DungeonMessage[]): string {
  return messages
    .map((node) => {
      if (node.kind === 'paragraph') {
        return node.text.trim();
      }
      if (node.kind === 'exit-list') {
        return [node.intro, ...node.items, node.footnote]
          .filter((text): text is string => !!text && text.trim().length > 0)
          .join(' ');
      }
      return '';
    })
    .filter((text) => text.length > 0)
    .join(' ');
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
    const exitList = findExitList(messages);
    expect(exitList).toBeTruthy();
    expect(exitList?.intro).toContain('There is 1 additional door');
    expect(exitList?.footnote).toBe(
      'If an exit abuts mapped space, use the option shown in parentheses.'
    );
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
    expect(detailParagraph?.text).toContain(
      'See the exit location rolls below'
    );
  });

  test('OneToFour result records rolled count', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 17) // selects OneToFour bucket
      .mockImplementationOnce(() => 3); // yields count = 3
    const messages = compactNodesFor(resolveRoomDimensions({ roll: 3 }));
    const exitList = findExitList(messages);
    expect(exitList?.intro).toContain('There are 3 additional doors');
    expect(exitList?.intro).not.toContain('1d4 result');
    spy.mockRestore();
  });

  test('Large chamber yields passages instead of doors', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 4); // TwoThree600 -> 3 passages when area > 600
    const messages = compactNodesFor(resolveChamberDimensions({ roll: 14 }));
    const exitList = findExitList(messages);
    expect(exitList?.intro).toContain('There are 3 additional passages');
    spy.mockRestore();
  });

  test('DoorChamberOrPassageRoom flips default noun based on context', () => {
    const spy = jest
      .spyOn(dungeonLookup, 'rollDice')
      .mockImplementationOnce(() => 19);
    const messages = compactNodesFor(resolveRoomDimensions({ roll: 2 }));
    const compactText = collectCompactText(messages);
    expect(compactText).toContain('There is a passage leaving this room');
    expect(compactText).not.toContain(
      'See the exit location and direction rolls below'
    );
    spy.mockRestore();
  });
});

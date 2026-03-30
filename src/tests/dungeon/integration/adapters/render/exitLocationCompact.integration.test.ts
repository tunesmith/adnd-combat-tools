import { toCompactRender } from '../../../../../dungeon/adapters/render';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import type { DungeonMessage } from '../../../../../types/dungeon';
import {
  ExitLocation,
  ExitAlternative,
  ExitDirection,
} from '../../../../../dungeon/features/navigation/exit/exitLocationsTable';
import { NumberOfExits } from '../../../../../dungeon/features/navigation/exit/numberOfExitsTable';

function buildPassageExitTree(): OutcomeEventNode {
  const direction: OutcomeEventNode = {
    type: 'event',
    roll: 17,
    event: {
      kind: 'exitDirection',
      result: ExitDirection.RightLeft45,
      index: 1,
      total: 1,
      origin: 'chamber',
    },
  };

  const passageExit: OutcomeEventNode = {
    type: 'event',
    roll: 12,
    event: {
      kind: 'passageExitLocation',
      result: ExitLocation.LeftWall,
      index: 1,
      total: 1,
      origin: 'chamber',
    },
    children: [
      direction,
      {
        type: 'event',
        roll: 11,
        event: {
          kind: 'exitAlternative',
          result: ExitAlternative.OppositeDirection,
        },
      },
    ],
  };

  return {
    type: 'event',
    roll: 8,
    event: {
      kind: 'numberOfExits',
      result: NumberOfExits.TwoThree600,
      context: { length: 30, width: 40, isRoom: false },
      count: 1,
    },
    children: [passageExit],
  };
}

function buildDoorExitTree(): OutcomeEventNode {
  const doorExit: OutcomeEventNode = {
    type: 'event',
    roll: 19,
    event: {
      kind: 'doorExitLocation',
      result: ExitLocation.SameWall,
      index: 1,
      total: 1,
      origin: 'room',
    },
    children: [
      {
        type: 'event',
        roll: 5,
        event: {
          kind: 'exitAlternative',
          result: ExitAlternative.SecretDoor,
        },
      },
    ],
  };

  return {
    type: 'event',
    roll: 4,
    event: {
      kind: 'numberOfExits',
      result: NumberOfExits.OneTwo600,
      context: { length: 20, width: 20, isRoom: true },
      count: 1,
    },
    children: [doorExit],
  };
}

function collectCompactText(nodes: DungeonMessage[]): string {
  return nodes
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
    .join('\n');
}

describe('exit location compact rendering', () => {
  test('passage exits include location and direction sentences in compact mode', () => {
    const tree = buildPassageExitTree();
    const text = collectCompactText(toCompactRender(tree) as DungeonMessage[]);

    expect(text).toContain('There is 1 additional passage:');
    expect(text).toContain('Left wall.');
    expect(text).toContain(
      'The passage angles 45° to the right (or opposite direction*).'
    );
    expect(text).toContain(
      'If an exit abuts mapped space, use the option shown in parentheses.'
    );
  });

  test('door exits include location sentence without direction', () => {
    const tree = buildDoorExitTree();
    const text = collectCompactText(toCompactRender(tree) as DungeonMessage[]);

    expect(text).toContain('There is 1 additional door:');
    expect(text).toContain('Same wall (or secret passage*).');
    expect(text).toContain(
      'If an exit abuts mapped space, use the option shown in parentheses.'
    );
    expect(text).not.toContain('The passage angles');
  });
});

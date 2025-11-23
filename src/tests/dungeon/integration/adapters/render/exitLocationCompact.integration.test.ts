import { toCompactRender } from '../../../../../dungeon/adapters/render';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
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

describe('exit location compact rendering', () => {
  test('passage exits include location and direction sentences in compact mode', () => {
    const tree = buildPassageExitTree();
    const nodes = toCompactRender(tree);
    const text = nodes
      .filter(
        (
          node
        ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text)
      .join('\n');

    expect(text).toContain('Passage 1:');
    expect(text).toContain(
      'The passage angles 45° to the right (or opposite direction).'
    );
    expect(text).toContain(
      'If an exit abuts mapped space, use the option shown in parentheses.'
    );
  });

  test('door exits include location sentence without direction', () => {
    const tree = buildDoorExitTree();
    const nodes = toCompactRender(tree);
    const text = nodes
      .filter(
        (
          node
        ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text)
      .join('\n');

    expect(text).toContain('Door 1:');
    expect(text).toContain(
      'If an exit abuts mapped space, use the option shown in parentheses.'
    );
    expect(text).not.toContain('The passage angles');
  });
});

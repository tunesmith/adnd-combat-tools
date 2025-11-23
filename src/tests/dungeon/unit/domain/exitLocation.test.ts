import { resolveNumberOfExits } from '../../../../dungeon/features/navigation/exit/numberOfExitsResolver';
import { resolvePassageExitLocation } from '../../../../dungeon/features/navigation/exit/exitLocationResolvers';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
  PendingRoll,
} from '../../../../dungeon/domain/outcome';

function asEvent(node: DungeonOutcomeNode): OutcomeEventNode {
  if (node.type !== 'event') {
    throw new Error('Expected event node');
  }
  return node;
}

describe('exit location resolver chain', () => {
  test('room exits schedule door exit location rolls', () => {
    const exitsNode = resolveNumberOfExits({
      roll: 1,
      length: 10,
      width: 10,
      isRoom: true,
    });
    const exits = asEvent(exitsNode);
    expect(exits.children).toBeDefined();
    const children = exits.children ?? [];
    expect(children).toHaveLength(1);
    const pending = children[0] as PendingRoll;
    expect(pending.type).toBe('pending-roll');
    expect(pending.table).toBe('doorExitLocation');
    expect(pending.context).toMatchObject({
      kind: 'exit',
      exitType: 'door',
      index: 1,
      total: 1,
      origin: 'room',
    });
  });

  test('chamber exits schedule passage exit location rolls', () => {
    const exitsNode = resolveNumberOfExits({
      roll: 5,
      length: 30,
      width: 50,
      isRoom: false,
    });
    const exits = asEvent(exitsNode);
    expect(exits.children).toBeDefined();
    const pending = exits.children?.[0] as PendingRoll | undefined;
    expect(pending?.type).toBe('pending-roll');
    expect(pending?.table).toBe('passageExitLocation');
    expect(pending?.context).toMatchObject({
      kind: 'exit',
      exitType: 'passage',
      origin: 'chamber',
    });
  });

  test('passage exit location schedules exit direction roll', () => {
    const exit = resolvePassageExitLocation({
      roll: 8,
      context: { index: 2, total: 3, origin: 'chamber' },
    });
    const event = asEvent(exit);
    expect(event.children).toBeDefined();
    const pending = event.children?.[0] as PendingRoll | undefined;
    expect(pending?.type).toBe('pending-roll');
    expect(pending?.table).toBe('exitDirection');
    expect(pending?.context).toEqual({
      kind: 'exitDirection',
      index: 2,
      total: 3,
      origin: 'chamber',
    });
    const exitEvent = event.event;
    expect(exitEvent.kind).toBe('passageExitLocation');
    if (exitEvent.kind !== 'passageExitLocation') {
      throw new Error('Expected passage exit location event');
    }
    expect(exitEvent.index).toBe(2);
    expect(exitEvent.total).toBe(3);
  });
});

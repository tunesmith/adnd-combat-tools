import type { OutcomeEventNode } from '../../../../dungeon/domain/outcome';
import { resolveTreasureSwords } from '../../../../dungeon/domain/resolvers';
import {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusual,
} from '../../../../tables/dungeon/treasureSwords';

describe('resolveTreasureSwords', () => {
  it('creates pending rolls for kind and unusual tables by default', () => {
    const node = resolveTreasureSwords({ roll: 10 });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const pendingChildren = node.children || [];
    expect(pendingChildren).toHaveLength(2);

    const kinds = pendingChildren.filter(
      (child) =>
        child.type === 'pending-roll' &&
        (child.id?.startsWith('treasureSwordKind') ||
          child.table.startsWith('treasureSwordKind'))
    );
    const unusual = pendingChildren.filter(
      (child) =>
        child.type === 'pending-roll' &&
        (child.id?.startsWith('treasureSwordUnusual') ||
          child.table.startsWith('treasureSwordUnusual'))
    );

    expect(kinds).toHaveLength(1);
    expect(unusual).toHaveLength(1);
  });

  it('resolves sword result with type and unusual subtables', () => {
    const node = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 42,
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    expect(node.event.result).toBe(
      TreasureSword.SwordPlus1Plus2VsMagicUsers
    );

    const childEvents = (node.children || []).filter(
      (child): child is OutcomeEventNode => child.type === 'event'
    );
    expect(childEvents).toHaveLength(2);

    const kindEvent = childEvents.find(
      (child) => child.event.kind === 'treasureSwordKind'
    );
    const unusualEvent = childEvents.find(
      (child) => child.event.kind === 'treasureSwordUnusual'
    );

    if (!kindEvent || kindEvent.event.kind !== 'treasureSwordKind') {
      throw new Error('Expected treasureSwordKind child event');
    }
    expect(kindEvent.event.result).toBe(TreasureSwordKind.Broadsword);

    if (!unusualEvent || unusualEvent.event.kind !== 'treasureSwordUnusual') {
      throw new Error('Expected treasureSwordUnusual child event');
    }
    expect(unusualEvent.event.result).toBe(TreasureSwordUnusual.Normal);
  });
});

import {
  resolveTreasureScarabOfProtectionCurse,
  resolveTreasureScarabOfProtectionCurseResolution,
} from '../../../../dungeon/domain/resolvers';
import {
  TreasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurseResolution,
} from '../../../../tables/dungeon/treasureScarabOfProtection';
import type { PendingRoll } from '../../../../dungeon/domain/outcome';

describe('Scarab of Protection subtables', () => {
  it('returns a normal scarab with no follow-up tables when the result is protective', () => {
    const node = resolveTreasureScarabOfProtectionCurse({ roll: 7 });
    if (node.type !== 'event' || node.event.kind !== 'treasureScarabOfProtectionCurse') {
      throw new Error('Expected curse event');
    }
    expect(node.event.result).toBe(TreasureScarabOfProtectionCurse.Normal);
    expect(node.children).toBeUndefined();
  });

  it('queues the curse resolution table when the scarab is cursed', () => {
    const node = resolveTreasureScarabOfProtectionCurse({ roll: 1 });
    if (node.type !== 'event' || node.event.kind !== 'treasureScarabOfProtectionCurse') {
      throw new Error('Expected curse event');
    }
    expect(node.event.result).toBe(TreasureScarabOfProtectionCurse.Cursed);
    expect(node.children).toBeDefined();
    const pending = node.children?.find(
      (child): child is PendingRoll => child.type === 'pending-roll'
    );
    expect(pending).toBeDefined();
    expect(pending?.table).toBe(
      'treasureScarabOfProtectionCurseResolution'
    );
  });

  it('resolves the curse resolution table outcome', () => {
    const node = resolveTreasureScarabOfProtectionCurseResolution({ roll: 1 });
    if (
      node.type !== 'event' ||
      node.event.kind !== 'treasureScarabOfProtectionCurseResolution'
    ) {
      throw new Error('Expected curse resolution event');
    }
    expect(node.event.result).toBe(
      TreasureScarabOfProtectionCurseResolution.Removable
    );
  });
});

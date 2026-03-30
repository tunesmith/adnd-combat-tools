import {
  simulateCompactRunWithSequence,
  DirectiveMode,
} from '../../../../support/dungeon/dungeonRollHarness';
import type { DungeonOutcomeNode } from '../../../../../dungeon/domain/outcome';

describe('passage compact trick/trap gas handling', () => {
  it('fully resolves the illusionary wall branch in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        19,
        { tableId: 'trickTrap', roll: 19 },
        { tableId: 'illusionaryWallNature', roll: 11 },
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 1 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const trapEvent = findEvent(result.outcome, 'trickTrap');
    expect(trapEvent).toBeDefined();
    const wallEvent = findEvent(trapEvent, 'illusionaryWallNature');
    expect(wallEvent).toBeDefined();
  });
  it('resolves the gas trap branch in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        19,
        { tableId: 'trickTrap', roll: 17 },
        { tableId: 'gasTrapEffect', roll: 7 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const trapEvent = findEvent(result.outcome, 'trickTrap');
    expect(trapEvent).toBeDefined();
    const gasEvent = findEvent(trapEvent, 'gasTrapEffect');
    expect(gasEvent).toBeDefined();
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

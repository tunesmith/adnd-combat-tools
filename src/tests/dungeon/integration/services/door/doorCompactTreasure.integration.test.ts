import { simulateDetailRun } from '../../../../support/dungeon/dungeonRollHarness';
import {
  DoorBeyond,
  doorBeyond,
} from '../../../../../dungeon/features/navigation/entry/entryTable';

function rollForDoor(cmd: DoorBeyond): number {
  const entry = doorBeyond.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

describe('Door compact structured treasure', () => {
  test('room with one additional door renders compact exit list', () => {
    const result = simulateDetailRun({
      action: 'door',
      rolls: [
        rollForDoor(DoorBeyond.Room),
        { roll: 1, tableId: 'roomDimensions' },
        { roll: 1, tableId: 'numberOfExits' },
        { roll: 13, tableId: 'doorExitLocation' },
        { roll: 6, tableId: 'exitAlternative' },
        { roll: 1, tableId: 'chamberRoomContents' },
      ],
      dungeonLevel: 1,
    });

    const exitList = result.final.compact.nodes.find(
      (node): node is Extract<typeof node, { kind: 'exit-list' }> =>
        node.kind === 'exit-list'
    );
    expect(exitList).toBeDefined();
    expect(exitList?.intro).toContain('There is 1 additional door');
    expect(exitList?.items).toEqual(['Right wall (or one-way door*).']);
    expect(exitList?.footnote).toBe(
      'If an exit abuts mapped space, use the option shown in parentheses.'
    );
  });

  test('necklace of prayer beads appears in compact mode', () => {
    const result = simulateDetailRun({
      action: 'door',
      rolls: [
        rollForDoor(DoorBeyond.Room),
        { roll: 11, tableId: 'roomDimensions' },
        { roll: 15, tableId: 'chamberRoomContents' },
        { roll: 20, tableId: 'treasure' },
        { roll: 98, tableId: 'treasure' },
        { roll: 55, tableId: 'treasureMagicCategory' },
        { roll: 30, tableId: 'treasureMiscMagicE4' },
      ],
      dungeonLevel: 1,
    });

    const prayerNode = result.final.compact.nodes.find(
      (node): node is Extract<typeof node, { kind: 'prayer-beads' }> =>
        node.kind === 'prayer-beads'
    );
    expect(prayerNode).toBeDefined();
  });
});

import { simulateDetailRun } from '../../../../support/dungeon/dungeonRollHarness';
import {
  DoorBeyond,
  doorBeyond,
} from '../../../../../tables/dungeon/doorBeyond';

function rollForDoor(cmd: DoorBeyond): number {
  const entry = doorBeyond.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

describe('Door room monster levels', () => {
  test('room monsters use the current dungeon level', () => {
    const result = simulateDetailRun({
      action: 'door',
      dungeonLevel: 4,
      rolls: [
        rollForDoor(DoorBeyond.Room),
        { roll: 11, tableId: 'roomDimensions' },
        { roll: 15, tableId: 'chamberRoomContents' },
      ],
    });

    const pendingTables = result.final.pending.map((p) => p.table);
    expect(pendingTables).toContain('monsterLevel:4');
    expect(pendingTables).not.toContain('monsterLevel:1');
  });
});

import { doorBeyondMessages } from '../../../../../dungeon/services/doorBeyondMessages';
import {
  doorBeyond,
  DoorBeyond,
} from '../../../../../tables/dungeon/doorBeyond';
import type { DungeonTablePreview } from '../../../../../types/dungeon';

function pickRollForDoorBeyond(cmd: DoorBeyond): number {
  const entry = doorBeyond.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

describe('Door detail previews', () => {
  test('No roll => Door Beyond preview only', () => {
    const { messages } = doorBeyondMessages({ detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.length).toBeGreaterThanOrEqual(1);
    const first = previews[0];
    if (!first) throw new Error('Expected a preview');
    expect(first.id).toBe('doorBeyond');
  });

  test('Room roll => includes Room Dimensions preview', () => {
    const roll = pickRollForDoorBeyond(DoorBeyond.Room);
    const { messages } = doorBeyondMessages({ roll, detailMode: true });
    const previews = messages.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const hasRoom = previews.some((p) => p.id === 'roomDimensions');
    expect(hasRoom).toBe(true);
  });
});

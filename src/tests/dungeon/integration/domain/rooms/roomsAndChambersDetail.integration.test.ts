import {
  RoomDimensions,
  roomDimensions,
  ChamberDimensions,
  chamberDimensions,
} from '../../../../../tables/dungeon/chambersRooms';
import {
  resolveRoomDimensions,
  resolveChamberDimensions,
} from '../../../../../dungeon/domain/resolvers';
import { normalizeOutcomeTree } from '../../../../../dungeon/helpers/outcomeTree';
import { renderDetailTree } from '../../../../../dungeon/adapters/render';
import type { DungeonTablePreview } from '../../../../../types/dungeon';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../../../dungeon/domain/outcome';

function pickRollForRoom(cmd: RoomDimensions): number {
  const entry = roomDimensions.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function pickRollForChamber(cmd: ChamberDimensions): number {
  const entry = chamberDimensions.entries.find((e) => e.command === cmd);
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function detailNodesFor(node: DungeonOutcomeNode) {
  const normalized = normalizeOutcomeTree(node);
  const event = normalized.type === 'event' ? normalized : undefined;
  if (!event) throw new Error('Expected event outcome');
  return renderDetailTree(event as OutcomeEventNode);
}

describe('Room and chamber detail previews', () => {
  test('Room rectangular 20x30 -> Exits preview (room)', () => {
    const roll = pickRollForRoom(RoomDimensions.Rectangular20x30);
    const detailNodes = detailNodesFor(resolveRoomDimensions({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'numberOfExits')).toBe(true);
  });

  test('Chamber rectangular 30x50 -> Exits preview (chamber)', () => {
    const roll = pickRollForChamber(ChamberDimensions.Rectangular30x50);
    const detailNodes = detailNodesFor(resolveChamberDimensions({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    expect(previews.some((p) => p.id === 'numberOfExits')).toBe(true);
  });

  test('Chamber Unusual -> Unusual shape/size previews', () => {
    const roll = pickRollForChamber(ChamberDimensions.Unusual);
    const detailNodes = detailNodesFor(resolveChamberDimensions({ roll }));
    const previews = detailNodes.filter(
      (m) => m.kind === 'table-preview'
    ) as DungeonTablePreview[];
    const ids = previews.map((p) => p.id);
    expect(ids.includes('unusualShape')).toBe(true);
    expect(
      ids.some((id) => id === 'unusualSize' || id.startsWith('unusualSize'))
    ).toBe(true);
  });
});

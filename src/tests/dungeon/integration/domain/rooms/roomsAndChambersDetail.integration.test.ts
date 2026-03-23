import {
  RoomDimensions,
  roomDimensions,
  ChamberDimensions,
  chamberDimensions,
  ChamberRoomContents,
} from '../../../../../dungeon/features/environment/roomsChambers/roomsChambersTable';
import {
  resolveRoomDimensions,
  resolveChamberDimensions,
} from '../../../../../dungeon/features/environment/roomsChambers/roomsChambersResolvers';
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

  test('Illusionary wall chamber auto-resolves contents to monster and treasure', () => {
    const roll = pickRollForChamber(ChamberDimensions.Square20x20);
    const outcome = resolveChamberDimensions({
      roll,
      context: {
        forcedContents: ChamberRoomContents.MonsterAndTreasure,
        level: 4,
      },
    });
    const normalized = normalizeOutcomeTree(outcome);
    if (normalized.type !== 'event') {
      throw new Error('Expected chamber outcome event');
    }
    const pendingContentsCount =
      normalized.children?.filter(
        (child) =>
          child.type === 'pending-roll' && child.table === 'chamberRoomContents'
      ).length ?? 0;
    expect(pendingContentsCount).toBe(0);
    const contentsNode = normalized.children?.find(
      (child) =>
        child.type === 'event' && child.event.kind === 'chamberRoomContents'
    ) as OutcomeEventNode | undefined;
    expect(contentsNode).toBeDefined();
    expect(contentsNode?.event.kind).toBe('chamberRoomContents');
    if (!contentsNode || contentsNode.event.kind !== 'chamberRoomContents') {
      throw new Error('Expected chamber contents event');
    }
    expect(contentsNode.event.result).toBe(
      ChamberRoomContents.MonsterAndTreasure
    );
    const monsterPending = contentsNode?.children?.find(
      (child) =>
        child.type === 'pending-roll' && child.table === 'monsterLevel:4'
    );
    expect(monsterPending).toBeDefined();

    const detailNodes = renderDetailTree(normalized);
    const previews = detailNodes.filter(
      (node): node is DungeonTablePreview => node.kind === 'table-preview'
    );
    const previewIds = previews.map(
      (preview) => preview.targetId ?? preview.id
    );
    expect(previewIds).not.toContain('chamberRoomContents');
  });
});

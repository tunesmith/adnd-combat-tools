import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { magicPool, MagicPool } from '../../../tables/dungeon/magicPool';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderCircularMagicPoolDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularMagicPoolNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildCircularMagicPoolPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Magic Pool Effect',
    sides: magicPool.sides,
    entries: magicPool.entries.map((entry) => ({
      range: entry.range,
      label: MagicPool[entry.command] ?? String(entry.command),
    })),
  });

export function renderCircularMagicPoolCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularMagicPoolNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

function buildCircularMagicPoolNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'circularMagicPool') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Magic Pool Effect',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        MagicPool[outcome.event.result] ?? String(outcome.event.result)
      }`,
    ],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const text = formatCircularMagicPool(outcome.event.result);
  const trimmed = text.trim();
  if (trimmed.length > 0) {
    nodes.push({
      kind: 'paragraph',
      text: trimmed.endsWith(' ') ? trimmed : `${trimmed} `,
    });
  }
  return nodes;
}

export function formatCircularMagicPool(result: MagicPool): string {
  switch (result) {
    case MagicPool.TransmuteGold:
      return 'It transmutes gold. ';
    case MagicPool.AlterCharacteristic:
      return 'It will, on a one-time only basis, add (1–3) or subtract (4–6) 1–3 points from one characteristic of all who stand within it: (d6) 1-STR, 2-INT, 3-WIS, 4-DEX, 5-CON, 6-CHA. Roll chances, amount, and characteristic separately for each character. ';
    case MagicPool.WishOrDamage:
      return 'It is a talking pool, and will grant one wish to characters of its alignment, and damage others for 1–20 points. Wish can be withheld for up to 1 day. ';
    case MagicPool.Transporter:
      return 'It is a transporter. ';
    default:
      return '';
  }
}

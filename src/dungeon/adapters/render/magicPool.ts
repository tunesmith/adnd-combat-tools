import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { magicPool, MagicPool } from '../../../tables/dungeon/magicPool';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { describeTransporterLocation } from './transporterLocation';

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
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildCircularMagicPoolNodes(outcome);
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
  if (outcome.event.result === MagicPool.Transporter) {
    const summary = describeMagicPoolTransporter(outcome);
    if (summary.detailParagraphs.length > 0) {
      nodes.push(...summary.detailParagraphs);
    }
  } else {
    pushParagraph(nodes, formatCircularMagicPool(outcome.event.result));
  }
  return nodes;
}

function pushParagraph(nodes: DungeonRenderNode[], text: string): void {
  const trimmed = text.trim();
  if (trimmed.length === 0) return;
  const normalized = trimmed.endsWith(' ') ? trimmed : `${trimmed} `;
  nodes.push({ kind: 'paragraph', text: normalized });
}

export function formatCircularMagicPool(result: MagicPool): string {
  switch (result) {
    case MagicPool.TransmuteGold:
      return 'It transmutes gold. ';
    case MagicPool.AlterCharacteristic:
      return 'It will, on a one-time only basis, add (1–3) or subtract (4–6) 1–3 points from one characteristic of all who stand within it: (d6) 1-STR, 2-INT, 3-WIS, 4-DEX, 5-CON, 6-CHA. Roll chances, amount, and characteristic separately for each character. ';
    case MagicPool.WishOrDamage:
      return 'It is a talking pool, and will grant one wish to characters of its alignment, and damage others for 1–20 points. Wish can be withheld for up to 1 day. ';
    default:
      return '';
  }
}

export const TRANSPORTER_BASE_SENTENCE = 'It is a transporter.';

function describeMagicPoolTransporter(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  const detailParagraphs: DungeonMessage[] = [
    { kind: 'paragraph', text: `${TRANSPORTER_BASE_SENTENCE} ` },
  ];
  const segments: string[] = [TRANSPORTER_BASE_SENTENCE];
  const location = findChildEvent(node, 'transporterLocation');
  if (location && location.event.kind === 'transporterLocation') {
    const locationSummary = describeTransporterLocation(location);
    if (locationSummary.detailParagraphs.length > 0) {
      detailParagraphs.push(...locationSummary.detailParagraphs);
    }
    if (locationSummary.compactText.length > 0) {
      segments.push(locationSummary.compactText);
    }
  }
  return { detailParagraphs, compactText: segments.join(' ') };
}

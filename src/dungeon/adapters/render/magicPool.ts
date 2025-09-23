import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type {
  OutcomeEvent,
  OutcomeEventNode,
} from '../../domain/outcome';
import {
  magicPool,
  MagicPool,
  transmuteType,
  TransmuteType,
  poolAlignment,
  PoolAlignment,
  transporterLocation,
  TransporterLocation,
} from '../../../tables/dungeon/magicPool';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { formatCircularContents, formatCircularPool } from './circularPools';

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
    const text = formatCircularMagicPoolResult(outcome.event.result);
    if (text.length > 0) nodes.push({ kind: 'paragraph', text });
  }
  return nodes;
}

export function renderCircularMagicPoolDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularMagicPoolNodes(outcome);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCircularMagicPoolCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildCircularMagicPoolNodes(outcome);
}

function buildTransmuteTypeNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'transmuteType') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Transmutation Type',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${TransmuteType[outcome.event.result]}`],
  };
  const text = formatTransmuteType(outcome.event.result);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export function renderTransmuteTypeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildTransmuteTypeNodes(outcome);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTransmuteTypeCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildTransmuteTypeNodes(outcome);
}

function buildPoolAlignmentNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'poolAlignment') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pool Alignment',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${PoolAlignment[outcome.event.result]}`],
  };
  const text = formatPoolAlignment(outcome.event.result);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export function renderPoolAlignmentDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildPoolAlignmentNodes(outcome);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderPoolAlignmentCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildPoolAlignmentNodes(outcome);
}

export function renderTransporterLocationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildTransporterNodes(outcome, true);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTransporterLocationCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildTransporterNodes(outcome, false);
}

export const buildCircularMagicPoolPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Magic Pool Effect',
    sides: magicPool.sides,
    entries: magicPool.entries.map((entry) => ({
      range: entry.range,
      label: MagicPool[entry.command] ?? String(entry.command),
    })),
  });

export const buildTransmuteTypePreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Transmutation Type',
    sides: transmuteType.sides,
    entries: transmuteType.entries.map((entry) => ({
      range: entry.range,
      label: TransmuteType[entry.command] ?? String(entry.command),
    })),
  });

export const buildPoolAlignmentPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Pool Alignment',
    sides: poolAlignment.sides,
    entries: poolAlignment.entries.map((entry) => ({
      range: entry.range,
      label: PoolAlignment[entry.command] ?? String(entry.command),
    })),
  });

export const buildTransporterLocationPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Transporter Location',
    sides: transporterLocation.sides,
    entries: transporterLocation.entries.map((entry) => ({
      range: entry.range,
      label: TransporterLocation[entry.command] ?? String(entry.command),
    })),
  });

export function formatCircularMagicPoolResult(result: MagicPool): string {
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

export function formatTransmuteType(result: TransmuteType): string {
  return result === TransmuteType.GoldToPlatinum
    ? 'It will turn gold to platinum, one time only. '
    : 'It will turn gold to lead, one time only. ';
}

export function formatPoolAlignment(result: PoolAlignment): string {
  switch (result) {
    case PoolAlignment.LawfulGood:
      return 'It is Lawful Good. ';
    case PoolAlignment.LawfulEvil:
      return 'It is Lawful Evil. ';
    case PoolAlignment.ChaoticGood:
      return 'It is Chaotic Good. ';
    case PoolAlignment.ChaoticEvil:
      return 'It is Chaotic Evil. ';
    case PoolAlignment.Neutral:
      return 'It is Neutral. ';
    default:
      return '';
  }
}

export const TRANSPORTER_BASE_SENTENCE = 'It is a transporter.';

export function describeMagicPoolTransporter(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'circularMagicPool') {
    return { detailParagraphs: [], compactText: '' };
  }
  if (node.event.result !== MagicPool.Transporter) {
    return { detailParagraphs: [], compactText: '' };
  }
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

export function describeTransporterLocation(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'transporterLocation') {
    return { detailParagraphs: [], compactText: '' };
  }
  const sentence = formatTransporterLocation(node.event.result).trim();
  if (!sentence) {
    return { detailParagraphs: [], compactText: '' };
  }
  return {
    detailParagraphs: [{ kind: 'paragraph', text: `${sentence} ` }],
    compactText: sentence,
  };
}

function formatTransporterLocation(result: TransporterLocation): string {
  switch (result) {
    case TransporterLocation.Surface:
      return 'It transports characters back to the surface.';
    case TransporterLocation.SameLevelElsewhere:
      return 'It transports characters elsewhere on the same level.';
    case TransporterLocation.OneLevelDown:
      return 'It transports characters one level down.';
    case TransporterLocation.Away100Miles:
      return 'It transports characters 100 miles away for outdoor adventure.';
    default:
      return '';
  }
}

const CIRCULAR_CHAIN_KINDS = new Set<OutcomeEvent['kind']>([
  'circularContents',
  'circularPool',
  'circularMagicPool',
  'transmuteType',
  'poolAlignment',
  'transporterLocation',
]);

export function collectCircularChainSentences(
  node: OutcomeEventNode
): string[] {
  const sentences: string[] = [];
  const visited = new Set<string>();
  const queue: OutcomeEventNode[] = (node.children || []).filter(
    (child): child is OutcomeEventNode =>
      child.type === 'event' && CIRCULAR_CHAIN_KINDS.has(child.event.kind)
  );
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const key = current.id ?? `${current.event.kind}-${sentences.length}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const sentence = circularSentenceForEvent(current);
    if (sentence && sentence.length > 0) {
      sentences.push(sentence);
    }
    for (const child of current.children || []) {
      if (child.type !== 'event') continue;
      if (CIRCULAR_CHAIN_KINDS.has(child.event.kind)) {
        queue.push(child);
      }
    }
  }
  return sentences;
}

function buildTransporterNodes(
  outcome: OutcomeEventNode,
  includeDetailAlignment: boolean
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'transporterLocation') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Transporter Location',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${TransporterLocation[outcome.event.result]}`],
  };
  const summary = describeTransporterLocation(outcome);
  const extras: DungeonRenderNode[] = includeDetailAlignment
    ? summary.detailParagraphs
    : summary.compactText.length > 0
    ? [{ kind: 'paragraph', text: `${summary.compactText} ` }]
    : [];
  return extras.length > 0 ? [heading, bullet, ...extras] : [heading, bullet];
}

function circularSentenceForEvent(
  eventNode: OutcomeEventNode
): string | undefined {
  switch (eventNode.event.kind) {
    case 'circularContents':
      return formatCircularContents(eventNode.event.result).trim();
    case 'circularPool':
      return formatCircularPool(eventNode.event.result).trim();
    case 'circularMagicPool':
      return formatCircularMagicPoolResult(eventNode.event.result).trim();
    case 'transmuteType':
      return formatTransmuteType(eventNode.event.result).trim();
    case 'poolAlignment':
      return formatPoolAlignment(eventNode.event.result).trim();
    case 'transporterLocation': {
      const summary = describeTransporterLocation(eventNode);
      return summary.compactText.trim();
    }
    default:
      return undefined;
  }
}

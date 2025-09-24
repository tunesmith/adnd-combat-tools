import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  transporterLocation,
  TransporterLocation,
} from '../../../tables/dungeon/magicPool';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderTransporterLocationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildTransporterNodes(outcome, true);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTransporterLocationPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Transporter Location',
    sides: transporterLocation.sides,
    entries: transporterLocation.entries.map((entry) => ({
      range: entry.range,
      label: TransporterLocation[entry.command] ?? String(entry.command),
    })),
  });

export function renderTransporterLocationCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildTransporterNodes(outcome, false);
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
    items: [
      `roll: ${outcome.roll} — ${TransporterLocation[outcome.event.result]}`,
    ],
  };
  const summary = describeTransporterLocation(outcome);
  const extras: DungeonRenderNode[] = includeDetailAlignment
    ? summary.detailParagraphs
    : summary.compactText.length > 0
    ? [{ kind: 'paragraph', text: `${summary.compactText} ` }]
    : [];
  return extras.length > 0 ? [heading, bullet, ...extras] : [heading, bullet];
}

export function describeTransporterLocation(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
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

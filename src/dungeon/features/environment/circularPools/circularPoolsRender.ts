import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { InlineText } from '../../../helpers/inlineContent';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import { joinSentenceInlineTexts } from '../../../helpers/inlineContent';
import {
  collectCharacterPartyMessages,
  describeMonsterOutcome,
} from '../../monsters/render';
import { collectTreasureCompactInlineTexts } from '../../treasure/treasure/treasureRender';
import {
  circularContents,
  CircularContents,
  magicPool,
  MagicPool,
  pool,
  Pool,
  poolAlignment,
  PoolAlignment,
  transporterLocation,
  TransporterLocation,
  transmuteType,
  TransmuteType,
} from './circularPoolsTable';

export function renderCircularContentsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularContentsNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCircularContentsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularContentsNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCircularPoolDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularPoolNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCircularPoolCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularPoolNodes(outcome);
  if (nodes.length === 0) return nodes;
  const partyMessages = collectCharacterPartyMessages(outcome, 'compact');
  if (partyMessages.length > 0) {
    nodes.push(...partyMessages);
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCircularMagicPoolDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularMagicPoolNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCircularMagicPoolCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularMagicPoolNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTransmuteTypeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildTransmuteTypeNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTransmuteTypeCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildTransmuteTypeNodes(outcome);
}

export function renderPoolAlignmentDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildPoolAlignmentNodes(outcome);
  if (nodes.length === 0) return nodes;
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
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTransporterLocationCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildTransporterNodes(outcome, false);
}

export const buildCircularContentsPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Circular Contents',
    sides: circularContents.sides,
    entries: circularContents.entries.map((entry) => ({
      range: entry.range,
      label: CircularContents[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildCircularPoolPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Pool',
    sides: pool.sides,
    entries: pool.entries.map((entry) => ({
      range: entry.range,
      label: Pool[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildCircularMagicPoolPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Magic Pool Effect',
    sides: magicPool.sides,
    entries: magicPool.entries.map((entry) => ({
      range: entry.range,
      label: MagicPool[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildTransmuteTypePreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Transmutation Type',
    sides: transmuteType.sides,
    entries: transmuteType.entries.map((entry) => ({
      range: entry.range,
      label: TransmuteType[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildPoolAlignmentPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Pool Alignment',
    sides: poolAlignment.sides,
    entries: poolAlignment.entries.map((entry) => ({
      range: entry.range,
      label: PoolAlignment[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildTransporterLocationPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Transporter Location',
    sides: transporterLocation.sides,
    entries: transporterLocation.entries.map((entry) => ({
      range: entry.range,
      label: TransporterLocation[entry.command] ?? String(entry.command),
    })),
    context,
  });

export function formatCircularContents(result: CircularContents): string {
  switch (result) {
    case CircularContents.Pool:
      return '';
    case CircularContents.Well:
      return 'There is a well. ';
    case CircularContents.Shaft:
      return 'There is a shaft. ';
    default:
      return '';
  }
}

export function describeCircularPoolInline(node: OutcomeEventNode): InlineText {
  if (node.event.kind !== 'circularPool') return { text: '' };
  const { result } = node.event;
  if (result === Pool.NoPool) return { text: '' };

  const segments: Array<string | InlineText> = ['There is a pool.'];

  if (result === Pool.PoolNoMonster) {
    return joinSentenceInlineTexts(segments);
  }

  if (result === Pool.PoolMonster || result === Pool.PoolMonsterTreasure) {
    const monsterSummaries = collectMonsterSummaries(node);
    if (monsterSummaries.length > 0) {
      segments.push(...monsterSummaries);
    } else {
      segments.push('There is a monster in the pool.');
    }
    if (result === Pool.PoolMonsterTreasure) {
      segments.push('Treasure is present.');
      const treasureSummaries = collectTreasureCompactInlineTexts(node);
      if (treasureSummaries.length > 0) {
        segments.push(...treasureSummaries);
      }
    }
    return joinSentenceInlineTexts(segments);
  }

  segments.push(
    'It is a magical pool. (In order to find out what it is, characters must enter the magic pool.)'
  );
  return joinSentenceInlineTexts(segments);
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

function buildCircularContentsNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'circularContents') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Circular Contents',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        CircularContents[outcome.event.result] ?? String(outcome.event.result)
      }`,
    ],
  };
  const extra = formatCircularContents(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (extra.length > 0) {
    nodes.push({ kind: 'paragraph', text: `${extra} ` });
  }
  return nodes;
}

function buildCircularPoolNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'circularPool') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pool',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${Pool[outcome.event.result]}`],
  };
  const text = describeCircularPoolInline(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (text.text.length > 0) nodes.push({ kind: 'paragraph', ...text });
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

function collectMonsterSummaries(node: OutcomeEventNode): InlineText[] {
  const summaries: InlineText[] = [];

  const visit = (current: OutcomeEventNode): void => {
    const description = describeMonsterOutcome(current);
    if (description) {
      const hasPartyMessage = description.compactMessages?.some(
        (message) => message.kind === 'character-party'
      );
      if (!hasPartyMessage) {
        if (
          description.compactMessages &&
          description.compactMessages.length > 0
        ) {
          for (const message of description.compactMessages) {
            if (message.kind === 'paragraph') {
              if (message.text.trim().length > 0) {
                summaries.push({ text: message.text, inline: message.inline });
              }
            }
          }
        }
        const text = description.compactText.trim();
        if (text.length > 0) {
          summaries.push({ text, inline: description.compactInline });
        }
      }
    }
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };

  node.children?.forEach((child) => {
    if (child.type === 'event') visit(child);
  });

  const unique: InlineText[] = [];
  const seen = new Set<string>();
  for (const summary of summaries) {
    if (!seen.has(summary.text)) {
      unique.push(summary);
      seen.add(summary.text);
    }
  }
  return unique;
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

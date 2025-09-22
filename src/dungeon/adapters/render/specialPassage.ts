import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  specialPassage as specialPassageTable,
  galleryStairLocation as galleryStairLocationTable,
  galleryStairOccurrence as galleryStairOccurrenceTable,
  streamConstruction as streamConstructionTable,
  riverConstruction as riverConstructionTable,
  riverBoatBank as riverBoatBankTable,
  SpecialPassage,
  GalleryStairLocation,
  StreamConstruction,
  RiverConstruction,
  RiverBoatBank,
  GalleryStairOccurrence,
} from '../../../tables/dungeon/specialPassage';
import {
  findChildEvent,
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import {
  formatChasmDepth,
  formatChasmConstruction,
  formatJumpingPlaceWidth,
} from './chasm';

export function renderSpecialPassageDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'specialPassage') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Special Passage',
  };
  const label =
    SpecialPassage[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeSpecialPassage(outcome);
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    ...summary.detailParagraphs,
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describeSpecialPassage(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'specialPassage') {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailParagraphs: DungeonMessage[] = [];
  const compactSegments: string[] = [];
  const append = (raw: string | undefined) => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const text = raw.endsWith(' ') ? raw : `${trimmed} `;
    detailParagraphs.push({ kind: 'paragraph', text });
    compactSegments.push(trimmed.endsWith('.') ? trimmed : `${trimmed}.`);
  };

  switch (node.event.result) {
    case SpecialPassage.FortyFeetColumns:
      append("The passage is 40' wide, with columns down the center. ");
      break;
    case SpecialPassage.FortyFeetDoubleColumns:
      append("The passage is 40' wide, with a double row of columns. ");
      break;
    case SpecialPassage.FiftyFeetDoubleColumns:
      append("The passage is 50' wide, with a double row of columns. ");
      break;
    case SpecialPassage.FiftyFeetGalleries:
      append(
        "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. "
      );
      break;
    case SpecialPassage.TenFootStream: {
      append("A stream, 10' wide, bisects the passage. ");
      const construction = findChildEvent(node, 'streamConstruction');
      if (construction)
        append(
          formatStreamConstruction(
            construction.event.result as StreamConstruction
          )
        );
      break;
    }
    case SpecialPassage.TwentyFootRiver:
    case SpecialPassage.FortyFootRiver:
    case SpecialPassage.SixtyFootRiver: {
      const base =
        node.event.result === SpecialPassage.TwentyFootRiver
          ? "A river, 20' wide, bisects the passage. "
          : node.event.result === SpecialPassage.FortyFootRiver
          ? "A river, 40' wide, bisects the passage. "
          : "A river, 60' wide, bisects the passage. ";
      append(base);
      const construction = findChildEvent(node, 'riverConstruction');
      if (construction) {
        const summary = describeRiverConstruction(construction);
        for (const paragraph of summary.detailParagraphs) {
          if (paragraph.kind === 'paragraph') {
            append(paragraph.text);
          }
        }
      }
      break;
    }
    case SpecialPassage.TwentyFootChasm: {
      append("A chasm, 20' wide, bisects the passage. ");
      const depth = findChildEvent(node, 'chasmDepth');
      if (depth) {
        const depthText = formatChasmDepth(depth.event.result).trim();
        if (depthText.length > 0) {
          compactSegments.push(
            depthText.endsWith('.') ? depthText : `${depthText}.`
          );
        }
      }
      const construction = findChildEvent(node, 'chasmConstruction');
      if (construction) {
        const constructionText = formatChasmConstruction(
          construction.event.result
        ).trim();
        if (constructionText.length > 0) {
          compactSegments.push(
            constructionText.endsWith('.')
              ? constructionText
              : `${constructionText}.`
          );
        }
        const jump = findChildEvent(construction, 'jumpingPlaceWidth');
        if (jump) {
          const jumpText = formatJumpingPlaceWidth(jump.event.result).trim();
          if (jumpText.length > 0) {
            compactSegments.push(
              jumpText.endsWith('.') ? jumpText : `${jumpText}.`
            );
          }
        }
      }
      break;
    }
    default:
      break;
  }

  return {
    detailParagraphs,
    compactText: compactSegments.join(' '),
  };
}

export function renderSpecialPassageCompact(node: OutcomeEventNode): string {
  if (node.event.kind !== 'specialPassage') return '';
  const summary = describeSpecialPassage(node);
  return summary.compactText;
}

export function renderGalleryStairLocationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'galleryStairLocation') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Gallery Stair Location',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${GalleryStairLocation[outcome.event.result]}`],
  };
  const description = formatGalleryStairLocation(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (description.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text: description });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderGalleryStairLocationCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'galleryStairLocation') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Gallery Stair Location',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${GalleryStairLocation[outcome.event.result]}`],
  };
  const description = formatGalleryStairLocation(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (description.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text: `${description} ` });
  }
  return nodes;
}

export function renderGalleryStairOccurrenceDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'galleryStairOccurrence') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Gallery Stair Occurrence',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${GalleryStairOccurrence[outcome.event.result]}`],
  };
  const description = formatGalleryStairOccurrence(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (description.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text: description });
  }
  return nodes;
}

export function renderGalleryStairOccurrenceCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'galleryStairOccurrence') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Gallery Stair Occurrence',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${GalleryStairOccurrence[outcome.event.result]}`],
  };
  const description = formatGalleryStairOccurrence(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (description.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text: `${description} ` });
  }
  return nodes;
}

export function renderRiverConstructionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'riverConstruction') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'River Construction',
  };
  const label =
    RiverConstruction[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeRiverConstruction(outcome);
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    ...summary.detailParagraphs,
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderRiverConstructionCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'riverConstruction') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'River Construction',
  };
  const label =
    RiverConstruction[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeRiverConstruction(outcome);
  const paragraphNodes: DungeonMessage[] =
    summary.compactText.length > 0
      ? [{ kind: 'paragraph', text: `${summary.compactText} ` }]
      : [];
  return [heading, bullet, ...paragraphNodes];
}

export const buildSpecialPassagePreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Special Passage',
    sides: specialPassageTable.sides,
    entries: specialPassageTable.entries.map((entry) => ({
      range: entry.range,
      label: SpecialPassage[entry.command] ?? String(entry.command),
    })),
  });

export const buildGalleryStairLocationPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Gallery Stair Location',
    sides: galleryStairLocationTable.sides,
    entries: galleryStairLocationTable.entries.map((entry) => ({
      range: entry.range,
      label: GalleryStairLocation[entry.command] ?? String(entry.command),
    })),
  });

export const buildStreamConstructionPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Stream Construction',
    sides: streamConstructionTable.sides,
    entries: streamConstructionTable.entries.map((entry) => ({
      range: entry.range,
      label: StreamConstruction[entry.command] ?? String(entry.command),
    })),
  });

export const buildGalleryStairOccurrencePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Gallery Stair Occurrence',
    sides: galleryStairOccurrenceTable.sides,
    entries: galleryStairOccurrenceTable.entries.map((entry) => ({
      range: entry.range,
      label: GalleryStairOccurrence[entry.command] ?? String(entry.command),
    })),
  });

export const buildRiverConstructionPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'River Construction',
    sides: riverConstructionTable.sides,
    entries: riverConstructionTable.entries.map((entry) => ({
      range: entry.range,
      label: RiverConstruction[entry.command] ?? String(entry.command),
    })),
  });

export const buildRiverBoatBankPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Boat Bank',
    sides: riverBoatBankTable.sides,
    entries: riverBoatBankTable.entries.map((entry) => ({
      range: entry.range,
      label: RiverBoatBank[entry.command] ?? String(entry.command),
    })),
  });

function formatGalleryStairLocation(result: GalleryStairLocation): string {
  switch (result) {
    case GalleryStairLocation.PassageBeginning:
      return 'Stairs up to the gallery are at the beginning of the passage. ';
    case GalleryStairLocation.PassageEnd:
      return 'Stairs up to the gallery will be at the end of the passage. ';
    default:
      return '';
  }
}

function formatGalleryStairOccurrence(result: GalleryStairOccurrence): string {
  switch (result) {
    case GalleryStairOccurrence.Replace:
      return 'If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. ';
    case GalleryStairOccurrence.Supplement:
      return 'If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ';
    default:
      return '';
  }
}

function formatStreamConstruction(result: StreamConstruction): string {
  return result === StreamConstruction.Bridged
    ? 'A bridge crosses the stream. '
    : '';
}

export function describeRiverConstruction(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'riverConstruction') {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailParagraphs: DungeonMessage[] = [];
  const compactSegments: string[] = [];
  const append = (text: string | undefined) => {
    if (!text) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const normalized = text.endsWith(' ') ? text : `${trimmed} `;
    detailParagraphs.push({ kind: 'paragraph', text: normalized });
    compactSegments.push(trimmed.endsWith('.') ? trimmed : `${trimmed}.`);
  };

  switch (node.event.result) {
    case RiverConstruction.Bridged:
      append('A bridge crosses the river. ');
      break;
    case RiverConstruction.Boat: {
      append('There is a boat. ');
      const boat = findChildEvent(node, 'riverBoatBank');
      if (boat) {
        append(
          boat.event.result === RiverBoatBank.ThisSide
            ? 'The boat is on this bank of the river. '
            : 'The boat is on the opposite bank of the river. '
        );
      }
      break;
    }
    case RiverConstruction.Obstacle:
      break;
    default:
      break;
  }

  return {
    detailParagraphs,
    compactText: compactSegments.join(' '),
  };
}

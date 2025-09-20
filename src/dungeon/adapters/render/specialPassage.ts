import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  SpecialPassage,
  GalleryStairLocation,
  StreamConstruction,
  RiverConstruction,
  RiverBoatBank,
  GalleryStairOccurrence,
} from '../../../tables/dungeon/specialPassage';
import { findChildEvent, type AppendPreviewFn } from './shared';
import { formatChasmDepth, formatChasmConstruction } from './chasm';

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
    case SpecialPassage.FiftyFeetGalleries: {
      append(
        "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. "
      );
      const loc = findChildEvent(node, 'galleryStairLocation');
      if (loc)
        append(
          formatGalleryStairLocation(loc.event.result as GalleryStairLocation)
        );
      const occurrence = findChildEvent(node, 'galleryStairOccurrence');
      if (occurrence)
        append(
          formatGalleryStairOccurrence(
            occurrence.event.result as GalleryStairOccurrence
          )
        );
      break;
    }
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
      if (construction)
        append(
          formatRiverConstruction(
            construction.event.result as RiverConstruction,
            node
          )
        );
      break;
    }
    case SpecialPassage.TwentyFootChasm: {
      append("A chasm, 20' wide, bisects the passage. ");
      const depth = findChildEvent(node, 'chasmDepth');
      if (depth) append(formatChasmDepth(depth.event.result));
      const construction = findChildEvent(node, 'chasmConstruction');
      if (construction)
        append(formatChasmConstruction(construction.event.result, node));
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

export function formatRiverConstruction(
  result: RiverConstruction,
  node: OutcomeEventNode
): string {
  if (result === RiverConstruction.Bridged)
    return 'A bridge crosses the river. ';
  if (result === RiverConstruction.Obstacle) return '';
  const boat = findChildEvent(node, 'riverBoatBank');
  if (boat) {
    return (
      'There is a boat. ' +
      (boat.event.result === RiverBoatBank.ThisSide
        ? 'The boat is on this bank of the river. '
        : 'The boat is on the opposite bank of the river. ')
    );
  }
  return '';
}

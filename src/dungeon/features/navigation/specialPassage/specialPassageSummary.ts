import type { DungeonMessage } from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { findChildEvent } from '../../../adapters/render/shared';
import {
  formatChasmConstruction,
  formatChasmDepth,
  formatJumpingPlaceWidth,
} from '../chasm/chasmRender';
import {
  GalleryStairLocation,
  GalleryStairOccurrence,
  RiverBoatBank,
  RiverConstruction,
  SpecialPassage,
  StreamConstruction,
} from './specialPassageTable';

export function describeSpecialPassage(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'specialPassage') {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailParagraphs: DungeonMessage[] = [];
  const compactSegments: string[] = [];
  const append = (
    raw: string | undefined,
    options?: { detail?: boolean; compact?: boolean }
  ) => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const includeDetail = options?.detail !== false;
    const includeCompact = options?.compact !== false;
    if (includeDetail) {
      const text = raw.endsWith(' ') ? raw : `${trimmed} `;
      detailParagraphs.push({ kind: 'paragraph', text });
    }
    if (includeCompact) {
      compactSegments.push(trimmed.endsWith('.') ? trimmed : `${trimmed}.`);
    }
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
      if (construction && construction.event.kind === 'streamConstruction') {
        append(formatStreamConstruction(construction.event.result), {
          detail: false,
        });
      }
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
      if (construction && construction.event.kind === 'riverConstruction') {
        const summary = describeRiverConstruction(construction);
        if (summary.compactText.length > 0) {
          append(summary.compactText, { detail: false });
        }
      }
      break;
    }
    case SpecialPassage.TwentyFootChasm: {
      append("A chasm, 20' wide, bisects the passage. ");
      const depth = findChildEvent(node, 'chasmDepth');
      if (depth && depth.event.kind === 'chasmDepth') {
        append(formatChasmDepth(depth.event.result), { detail: false });
      }
      const construction = findChildEvent(node, 'chasmConstruction');
      if (construction && construction.event.kind === 'chasmConstruction') {
        append(formatChasmConstruction(construction.event.result), {
          detail: false,
        });
        const jump = findChildEvent(construction, 'jumpingPlaceWidth');
        if (jump && jump.event.kind === 'jumpingPlaceWidth') {
          append(formatJumpingPlaceWidth(jump.event.result), {
            detail: false,
          });
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
  return describeSpecialPassage(node).compactText;
}

export function formatGalleryStairLocation(
  result: GalleryStairLocation
): string {
  switch (result) {
    case GalleryStairLocation.PassageBeginning:
      return 'Stairs up to the gallery are at the beginning of the passage. ';
    case GalleryStairLocation.PassageEnd:
      return 'Stairs up to the gallery will be at the end of the passage. ';
    default:
      return '';
  }
}

export function formatGalleryStairOccurrence(
  result: GalleryStairOccurrence
): string {
  switch (result) {
    case GalleryStairOccurrence.Replace:
      return 'If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. ';
    case GalleryStairOccurrence.Supplement:
      return 'If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ';
    default:
      return '';
  }
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
      if (boat && boat.event.kind === 'riverBoatBank') {
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

export function formatStreamConstruction(result: StreamConstruction): string {
  return result === StreamConstruction.Bridged
    ? 'A bridge crosses the stream. '
    : '';
}

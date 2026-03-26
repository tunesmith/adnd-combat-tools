import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { AppendPreviewFn } from '../../../adapters/render/shared';
import {
  GalleryStairLocation,
  GalleryStairOccurrence,
  RiverConstruction,
} from './specialPassageTable';
import {
  describeRiverConstruction,
  formatGalleryStairLocation,
  formatGalleryStairOccurrence,
} from './specialPassageSummary';

export function renderGalleryStairLocationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildGalleryStairLocationNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderGalleryStairLocationCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildGalleryStairLocationNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderGalleryStairOccurrenceDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildGalleryStairOccurrenceNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderGalleryStairOccurrenceCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildGalleryStairOccurrenceNodes(outcome);
}

export function renderRiverConstructionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildRiverConstructionNodes(outcome, true);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderRiverConstructionCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildRiverConstructionNodes(outcome, false);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

function buildGalleryStairLocationNodes(
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
    items: [
      `roll: ${outcome.roll} — ${GalleryStairLocation[outcome.event.result]}`,
    ],
  };
  const description = formatGalleryStairLocation(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (description.trim().length > 0) {
    const normalized = description.endsWith(' ')
      ? description
      : `${description} `;
    nodes.push({ kind: 'paragraph', text: normalized });
  }
  return nodes;
}

function buildGalleryStairOccurrenceNodes(
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
    items: [
      `roll: ${outcome.roll} — ${GalleryStairOccurrence[outcome.event.result]}`,
    ],
  };
  const description = formatGalleryStairOccurrence(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (description.trim().length > 0) {
    const normalized = description.endsWith(' ')
      ? description
      : `${description} `;
    nodes.push({ kind: 'paragraph', text: normalized });
  }
  return nodes;
}

function buildRiverConstructionNodes(
  outcome: OutcomeEventNode,
  includeDetailSegments: boolean
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
  if (includeDetailSegments) {
    return [heading, bullet, ...summary.detailParagraphs];
  }
  const compactParagraph =
    summary.compactText.length > 0
      ? [
          {
            kind: 'paragraph',
            text: summary.compactText.endsWith(' ')
              ? summary.compactText
              : `${summary.compactText} `,
          } as DungeonMessage,
        ]
      : [];
  return [heading, bullet, ...compactParagraph];
}

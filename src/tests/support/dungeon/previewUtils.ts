import type {
  AnyDungeonTablePreview,
  DungeonRenderNode,
  TargetedDungeonTablePreview,
} from '../../../types/dungeon';
import {
  getDungeonTablePreviewTargetKey,
  isDungeonTablePreview,
  isTargetedDungeonTablePreview,
} from '../../../types/dungeon';

export function collectPreviews(
  nodes: DungeonRenderNode[]
): AnyDungeonTablePreview[] {
  return nodes.filter(isDungeonTablePreview);
}

export function collectTargetedPreviews(
  nodes: DungeonRenderNode[]
): TargetedDungeonTablePreview[] {
  return collectPreviews(nodes).filter(isTargetedDungeonTablePreview);
}

export function collectPreviewIds(nodes: DungeonRenderNode[]): string[] {
  return collectPreviews(nodes).map((preview) => preview.id);
}

export function collectPreviewTargetKeys(nodes: DungeonRenderNode[]): string[] {
  return collectPreviews(nodes).map(getDungeonTablePreviewTargetKey);
}

export function findPreviewById(
  nodes: DungeonRenderNode[],
  id: string
): AnyDungeonTablePreview | undefined {
  return collectPreviews(nodes).find((preview) => preview.id === id);
}

export function findTargetedPreviewByRef(
  nodes: DungeonRenderNode[],
  ref: string
): TargetedDungeonTablePreview | undefined {
  return collectTargetedPreviews(nodes).find(
    (preview) => preview.id === ref || preview.targetId === ref
  );
}

export function hasPreviewId(nodes: DungeonRenderNode[], id: string): boolean {
  return findPreviewById(nodes, id) !== undefined;
}

export function requirePreviewById(
  nodes: DungeonRenderNode[],
  id: string
): AnyDungeonTablePreview {
  const preview = findPreviewById(nodes, id);
  if (!preview) {
    throw new Error(`Expected preview ${id}.`);
  }
  return preview;
}

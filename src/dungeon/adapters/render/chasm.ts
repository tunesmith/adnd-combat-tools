import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  chasmConstruction as chasmConstructionTable,
  ChasmConstruction,
  ChasmDepth,
  chasmDepth as chasmDepthTable,
  JumpingPlaceWidth,
  jumpingPlaceWidth as jumpingPlaceWidthTable,
} from '../../../tables/dungeon/specialPassage';
import {
  type AppendPreviewFn,
  buildPreview,
  type TablePreviewFactory,
} from './shared';

export function renderChasmDepthDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chasmDepth') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Chasm Depth',
  };
  const label =
    ChasmDepth[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const depthText = formatChasmDepth(outcome.event.result).trim();
  if (depthText) {
    nodes.push({ kind: 'paragraph', text: depthText });
  }
  return nodes;
}

export function renderChasmConstructionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chasmConstruction') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Chasm Construction',
  };
  const label =
    ChasmConstruction[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const text = formatChasmConstruction(outcome.event.result).trim();
  if (text.length > 0) {
    nodes.push({ kind: 'paragraph', text });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function formatChasmDepth(result: ChasmDepth): string {
  switch (result) {
    case ChasmDepth.Feet150:
      return "The chasm is 150' deep. ";
    case ChasmDepth.Feet160:
      return "The chasm is 160' deep. ";
    case ChasmDepth.Feet170:
      return "The chasm is 170' deep. ";
    case ChasmDepth.Feet180:
      return "The chasm is 180' deep. ";
    case ChasmDepth.Feet190:
      return "The chasm is 190' deep. ";
    case ChasmDepth.Feet200:
      return "The chasm is 200' deep. ";
    default:
      return '';
  }
}

export function formatChasmConstruction(result: ChasmConstruction): string {
  if (result === ChasmConstruction.Bridged)
    return 'A bridge crosses the chasm. ';
  if (result === ChasmConstruction.Obstacle)
    return 'It has no bridge, and is too wide to jump across. ';
  return 'There is a jumping place. ';
}

export function formatJumpingPlaceWidth(result: JumpingPlaceWidth): string {
  switch (result) {
    case JumpingPlaceWidth.FiveFeet:
      return "It is 5' wide.";
    case JumpingPlaceWidth.SixFeet:
      return "It is 6' wide.";
    case JumpingPlaceWidth.SevenFeet:
      return "It is 7' wide.";
    case JumpingPlaceWidth.EightFeet:
      return "It is 8' wide.";
    case JumpingPlaceWidth.NineFeet:
      return "It is 9' wide.";
    default:
      return "It is 10' wide.";
  }
}

export function renderJumpingPlaceWidthDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'jumpingPlaceWidth') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Jumping Place Width',
  };
  const label =
    JumpingPlaceWidth[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text = formatJumpingPlaceWidth(outcome.event.result);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export const buildChasmDepthPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Chasm Depth',
    sides: chasmDepthTable.sides,
    entries: chasmDepthTable.entries.map((entry) => ({
      range: entry.range,
      label: ChasmDepth[entry.command] ?? String(entry.command),
    })),
  });

export const buildChasmConstructionPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Chasm Construction',
    sides: chasmConstructionTable.sides,
    entries: chasmConstructionTable.entries.map((entry) => ({
      range: entry.range,
      label: ChasmConstruction[entry.command] ?? String(entry.command),
    })),
  });

export const buildJumpingPlaceWidthPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Jumping Place Width',
    sides: jumpingPlaceWidthTable.sides,
    entries: jumpingPlaceWidthTable.entries.map((entry) => ({
      range: entry.range,
      label: JumpingPlaceWidth[entry.command] ?? String(entry.command),
    })),
  });

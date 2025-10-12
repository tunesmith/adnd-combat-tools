import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureIronFlask,
  TreasureIronFlaskContent,
} from '../../../tables/dungeon/treasureIronFlask';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const CONTENT_LABELS: Record<TreasureIronFlaskContent, string> = {
  [TreasureIronFlaskContent.Empty]: 'Empty',
  [TreasureIronFlaskContent.AirElemental]: 'Air Elemental',
  [TreasureIronFlaskContent.DemonTypeIToIII]: 'Demon (type I–III)',
  [TreasureIronFlaskContent.DemonTypeIVToVI]: 'Demon (type IV–VI)',
  [TreasureIronFlaskContent.DevilLesser]: 'Devil (lesser)',
  [TreasureIronFlaskContent.DevilGreater]: 'Devil (greater)',
  [TreasureIronFlaskContent.Djinni]: 'Djinni',
  [TreasureIronFlaskContent.EarthElemental]: 'Earth Elemental',
  [TreasureIronFlaskContent.Efreeti]: 'Efreeti',
  [TreasureIronFlaskContent.FireElemental]: 'Fire Elemental',
  [TreasureIronFlaskContent.InvisibleStalker]: 'Invisible Stalker',
  [TreasureIronFlaskContent.Mezzodaemon]: 'Mezzodaemon',
  [TreasureIronFlaskContent.NightHag]: 'Night Hag',
  [TreasureIronFlaskContent.Nycadaemon]: 'Nycadaemon',
  [TreasureIronFlaskContent.Rakshasa]: 'Rakshasa',
  [TreasureIronFlaskContent.Salamander]: 'Salamander',
  [TreasureIronFlaskContent.WaterElemental]: 'Water Elemental',
  [TreasureIronFlaskContent.WindWalker]: 'Wind Walker',
  [TreasureIronFlaskContent.Xorn]: 'Xorn',
};

export function renderTreasureIronFlaskDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureIronFlask') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Iron Flask',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${labelFor(outcome.event.result)}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: ironFlaskSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureIronFlaskCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureIronFlask') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Iron Flask',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: ironFlaskSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureIronFlaskPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Iron Flask Contents',
    sides: treasureIronFlask.sides,
    entries: treasureIronFlask.entries.map(({ range, command }) => ({
      range,
      label: labelFor(command),
    })),
  });

export function ironFlaskSentence(result: TreasureIronFlaskContent): string {
  if (result === TreasureIronFlaskContent.Empty) {
    return 'There is an Iron Flask (empty).';
  }
  const label = labelFor(result);
  const article = articleFor(label);
  return `There is an Iron Flask. It contains ${article} ${label}.`;
}

function labelFor(result: TreasureIronFlaskContent): string {
  return CONTENT_LABELS[result];
}

function articleFor(label: string): 'a' | 'an' {
  const firstChar = label.trim().charAt(0).toLowerCase();
  if ('aeiou'.includes(firstChar)) return 'an';
  if (label.toLowerCase().startsWith('invisible')) return 'an';
  return 'a';
}

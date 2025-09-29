import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureRings,
  TreasureRing,
} from '../../../tables/dungeon/treasureRings';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

const RING_LABELS: Record<TreasureRing, string> = {
  [TreasureRing.Contrariness]: 'contrariness',
  [TreasureRing.Delusion]: 'delusion',
  [TreasureRing.DjinniSummoning]: 'djinni summoning',
  [TreasureRing.ElementalCommand]: 'elemental command',
  [TreasureRing.FeatherFalling]: 'feather falling',
  [TreasureRing.FireResistance]: 'fire resistance',
  [TreasureRing.FreeAction]: 'free action',
  [TreasureRing.HumanInfluence]: 'human influence',
  [TreasureRing.Invisibility]: 'invisibility',
  [TreasureRing.MammalControl]: 'mammal control',
  [TreasureRing.MultipleWishes]: 'multiple wishes',
  [TreasureRing.Protection]: 'protection',
  [TreasureRing.Regeneration]: 'regeneration',
  [TreasureRing.ShootingStars]: 'shooting stars',
  [TreasureRing.SpellStoring]: 'spell storing',
  [TreasureRing.SpellTurning]: 'spell turning',
  [TreasureRing.Swimming]: 'swimming',
  [TreasureRing.Telekinesis]: 'telekinesis',
  [TreasureRing.ThreeWishes]: 'three wishes',
  [TreasureRing.Warmth]: 'warmth',
  [TreasureRing.WaterWalking]: 'water walking',
  [TreasureRing.Weakness]: 'weakness',
  [TreasureRing.Wizardry]: 'wizardry',
  [TreasureRing.XRayVision]: 'x-ray vision',
};

export function renderTreasureRingDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRing') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Ring',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${TreasureRing[outcome.event.result]}`],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: ringSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRing') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Ring',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: ringSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureRingPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Ring',
    sides: treasureRings.sides,
    entries: treasureRings.entries.map((entry) => ({
      range: entry.range,
      label: TreasureRing[entry.command] ?? String(entry.command),
    })),
  });

export function ringSentence(result: TreasureRing): string {
  const label = RING_LABELS[result];
  return `There is a ring of ${label}.`;
}

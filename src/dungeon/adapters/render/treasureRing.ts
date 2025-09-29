import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureRings,
  TreasureRing,
} from '../../../tables/dungeon/treasureRings';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import {
  treasureRingContrariness,
  TreasureRingContrariness,
} from '../../../tables/dungeon/treasureRingContrariness';

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

const CONTRARIANNESS_PREVIEW: Record<TreasureRingContrariness, string> = {
  [TreasureRingContrariness.Flying]: 'Flying',
  [TreasureRingContrariness.Invisibility]: 'Invisibility',
  [TreasureRingContrariness.Levitation]: 'Levitation',
  [TreasureRingContrariness.ShockingGrasp]: 'Shocking Grasp',
  [TreasureRingContrariness.SpellTurning]: 'Spell Turning',
  [TreasureRingContrariness.Strength]: 'Strength',
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
    text: ringSentence(outcome.event.result, outcome),
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
    text: ringSentence(outcome.event.result, outcome),
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

export const buildTreasureRingContrarinessPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Contrariness Effect',
    sides: treasureRingContrariness.sides,
    entries: treasureRingContrariness.entries.map((entry) => ({
      range: entry.range,
      label: contrarinessPreviewLabel(entry.command),
    })),
  });

export function renderTreasureRingContrarinessDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingContrariness') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Contrariness Effect',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasureRingContrariness[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: contrarinessSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingContrarinessCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingContrariness') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Contrariness Effect',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: contrarinessSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function ringSentence(
  result: TreasureRing,
  node?: OutcomeEventNode
): string {
  const label = RING_LABELS[result];
  if (result === TreasureRing.Contrariness && node) {
    const child = findChildEvent(node, 'treasureRingContrariness');
    if (child && child.event.kind === 'treasureRingContrariness') {
      const effect = contrarinessPreviewLabel(child.event.result);
      return `There is a ring of contrariness (${effect}).`;
    }
  }
  return `There is a ring of ${label}.`;
}

function contrarinessPreviewLabel(result: TreasureRingContrariness): string {
  return CONTRARIANNESS_PREVIEW[result] ?? 'Contrary Effect';
}

function contrarinessSentence(result: TreasureRingContrariness): string {
  return `Contrariness effect: ${contrarinessPreviewLabel(result)}.`;
}

import type { OutcomeEventNode } from '../../domain/outcome';
import type { DungeonRenderNode } from '../../../types/dungeon';
import {
  gasTrapEffect,
  GasTrapEffect,
} from '../../../tables/dungeon/gasTrapEffect';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderGasTrapEffectDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'gasTrapEffect') return [];
  const detail = describeGasTrapEffect(outcome);
  const nodes: DungeonRenderNode[] = [];
  if (detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderGasTrapEffectCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'gasTrapEffect') return [];
  const detail = describeGasTrapEffect(outcome);
  const nodes: DungeonRenderNode[] = [];
  if (detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describeGasTrapEffect(node: OutcomeEventNode): string {
  if (node.event.kind !== 'gasTrapEffect') return '';
  return GAS_EFFECT_DESCRIPTIONS[node.event.result];
}

export const buildGasTrapEffectPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Gas Effect',
    sides: gasTrapEffect.sides,
    entries: gasTrapEffect.entries.map((entry) => ({
      range: entry.range,
      label: GAS_EFFECT_DESCRIPTIONS[entry.command].trim(),
    })),
  });

const GAS_EFFECT_DESCRIPTIONS: Record<GasTrapEffect, string> = {
  [GasTrapEffect.ObscuringGas]:
    'Only effect is to obscure vision when passing through. ',
  [GasTrapEffect.BlindingGas]: 'Blinds for 1–6 turns after passing through. ',
  [GasTrapEffect.FearGas]:
    "Fear: run back 120' feet unless saving throw versus magic is made. ",
  [GasTrapEffect.SleepGas]:
    'Sleep: party sound asleep for 2–12 turns (as sleep spell). ',
  [GasTrapEffect.StrengthGas]:
    'Strength: adds 1–6 points of strength (as strength spell) to all fighters in party for 1 to 10 hours. ',
  [GasTrapEffect.SicknessGas]: 'Sickness: return to surface immediately. ',
  [GasTrapEffect.PoisonGas]:
    'Poison: killed unless saving throw versus poison is made. ',
};

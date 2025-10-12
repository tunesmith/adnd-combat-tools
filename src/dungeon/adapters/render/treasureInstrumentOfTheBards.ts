import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureInstrumentOfTheBards,
  TreasureInstrumentOfTheBards,
} from '../../../tables/dungeon/treasureInstrumentOfTheBards';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const INSTRUMENT_LABELS: Record<TreasureInstrumentOfTheBards, string> = {
  [TreasureInstrumentOfTheBards.FochlucanBandore]: 'Fochlucan Bandore',
  [TreasureInstrumentOfTheBards.MacFuirmidhCittern]: 'Mac-Fuirmidh Cittern',
  [TreasureInstrumentOfTheBards.DossLute]: 'Doss Lute',
  [TreasureInstrumentOfTheBards.CanaithMandolin]: 'Canaith Mandolin',
  [TreasureInstrumentOfTheBards.CliLyre]: 'Cli Lyre',
  [TreasureInstrumentOfTheBards.AnstruthHarp]: 'Anstruth Harp',
  [TreasureInstrumentOfTheBards.OllamhHarp]: 'Ollamh Harp',
};

export function renderTreasureInstrumentOfTheBardsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureInstrumentOfTheBards') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Instrument of the Bards',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${labelFor(outcome.event.result)}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: instrumentOfTheBardsSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureInstrumentOfTheBardsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureInstrumentOfTheBards') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Instrument of the Bards',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: instrumentOfTheBardsSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureInstrumentOfTheBardsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Instrument of the Bards',
    sides: treasureInstrumentOfTheBards.sides,
    entries: treasureInstrumentOfTheBards.entries.map(({ range, command }) => ({
      range,
      label: labelFor(command),
    })),
  });

export function instrumentOfTheBardsSentence(
  result: TreasureInstrumentOfTheBards
): string {
  return `There is an Instrument of the Bards: ${labelFor(result)}.`;
}

function labelFor(result: TreasureInstrumentOfTheBards): string {
  return INSTRUMENT_LABELS[result];
}

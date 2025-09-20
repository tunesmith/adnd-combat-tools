import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEvent, OutcomeEventNode } from '../../domain/outcome';
import { NumberOfExits } from '../../../tables/dungeon/numberOfExits';

export function renderNumberOfExitsDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'numberOfExits') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Exits',
  };
  const label = NumberOfExits[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeNumberOfExits(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (summary.detailParagraphs.length > 0) {
    nodes.push(...summary.detailParagraphs);
  }
  return nodes;
}

export function renderNumberOfExitsCompact(
  node: OutcomeEventNode
): DungeonRenderNode[] {
  if (node.event.kind !== 'numberOfExits') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Exits',
  };
  const label = NumberOfExits[node.event.result] ?? String(node.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${node.roll} — ${label}`],
  };
  const summary = describeNumberOfExits(node);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (summary.compactText.length > 0) {
    nodes.push({ kind: 'paragraph', text: `${summary.compactText} ` });
  }
  return nodes;
}

export function describeNumberOfExits(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'numberOfExits') {
    return { detailParagraphs: [], compactText: '' };
  }
  const text = formatNumberOfExitsEvent(node.event).trim();
  if (text.length === 0) {
    return { detailParagraphs: [], compactText: '' };
  }
  return {
    detailParagraphs: [{ kind: 'paragraph', text: `${text} ` }],
    compactText: text,
  };
}

function formatNumberOfExitsEvent(
  event: Extract<OutcomeEvent, { kind: 'numberOfExits' }>
): string {
  if (event.result === NumberOfExits.DoorChamberOrPassageRoom) {
    return event.context.isRoom
      ? 'There is a passage leaving this room. Determine its location and direction using the exit tables.'
      : 'There is a door exiting this chamber. Determine its placement using the exit tables.';
  }

  const nounBase = event.context.isRoom ? 'door' : 'passage';
  if (event.count <= 0) {
    const plural = `${nounBase}s`;
    return `There are no other ${plural}.`;
  }
  const plural = event.count === 1 ? nounBase : `${nounBase}s`;
  const verb = event.count === 1 ? 'is' : 'are';
  const rollInfo =
    event.result === NumberOfExits.OneToFour
      ? ` (1d4 result: ${event.count})`
      : '';
  const pronoun = event.count === 1 ? 'its' : 'their';
  return `There ${verb} ${event.count} additional ${plural}${rollInfo}. Determine ${pronoun} location and direction using the exit tables.`;
}

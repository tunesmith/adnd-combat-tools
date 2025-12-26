import type {
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { human, Human } from './monsterOneTables';
import { buildPreview } from '../../../adapters/render/shared';
import {
  hasPendingChildren,
  monsterTextDescription,
  type MonsterDescription,
} from '../render/shared';
import { summarizePartyResult } from '../../../helpers/party/formatPartyResult';
import { buildPartyCharacterMessage } from '../render/partyMessage';

export function describeHumanMonster(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  if (node.event.kind !== 'human') return undefined;
  const event = node.event;

  if (event.party) {
    const summary = summarizePartyResult(event.party);
    return {
      heading: 'Human Subtable',
      label: humanLabel(event.result),
      detailParagraphs: [buildPartyCharacterMessage(summary, 'detail')],
      compactText: '',
      compactMessages: [buildPartyCharacterMessage(summary, 'compact')],
      appendPending: hasPendingChildren(node),
    };
  }

  const textInfo = monsterTextDescription(
    'text' in event ? event.text : undefined
  );
  return {
    heading: 'Human Subtable',
    label: humanLabel(event.result),
    detailParagraphs: textInfo.detailParagraphs,
    compactText: textInfo.compactText,
    appendPending: hasPendingChildren(node),
  };
}

export function buildHumanPreview(
  tableId: string,
  context?: TableContext
): DungeonTablePreview {
  return buildPreview(tableId, {
    title: 'Human Subtable',
    sides: human.sides,
    entries: human.entries.map((entry) => ({
      range: entry.range,
      label: humanLabel(entry.command),
    })),
    context,
  });
}

function humanLabel(command: Human): string {
  switch (command) {
    case Human.Bandit_5to15:
      return 'Bandit';
    case Human.Berserker_3to9:
      return 'Berserker';
    case Human.Brigand_5to15:
      return 'Brigand';
    case Human.Character:
      return 'Character';
    default:
      return Human[command] ?? 'Human';
  }
}

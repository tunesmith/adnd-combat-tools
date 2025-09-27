import type {
  DungeonMessage,
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { human, Human } from '../../../../tables/dungeon/monster/monsterOne';
import { buildPreview } from '../shared';
import {
  monsterTextDescription,
  hasPendingChildren,
  type MonsterDescription,
} from './shared';
import {
  summarizePartyResult,
  type PartySummary,
} from '../../../helpers/party/formatPartyResult';

export function describeHumanMonster(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  if (node.event.kind !== 'human') return undefined;
  const event = node.event;

  if (event.party) {
    const summary = summarizePartyResult(event.party);
    const detailParagraphs = buildPartyDetailMessages(summary);
    const compactText = buildPartyCompactText(summary);
    return {
      heading: 'Human Subtable',
      label: humanLabel(event.result),
      detailParagraphs,
      compactText,
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

function buildPartyDetailMessages(summary: PartySummary): DungeonMessage[] {
  const messages: DungeonMessage[] = [];

  if (summary.main.length > 0) {
    messages.push({ kind: 'paragraph', text: 'Main characters:' });
    messages.push({
      kind: 'bullet-list',
      items: summary.main.map(({ member, followers }) =>
        followers.length > 0
          ? `${member} — Followers: ${followers.join('; ')}`
          : member
      ),
    });
  }

  if (summary.includesHenchmen) {
    messages.push({
      kind: 'paragraph',
      text: 'They are accompanied by henchmen ready to assist.',
    });
  }

  return messages;
}

function buildPartyCompactText(summary: PartySummary): string {
  const lines: string[] = [];

  if (summary.main.length > 0) {
    lines.push('Main characters:');
    summary.main.forEach(({ member, followers }) => {
      lines.push(`- ${member}`);
      followers.forEach((follower) => {
        lines.push(`Follower: ${follower}`);
      });
    });
  }

  if (summary.includesHenchmen) {
    lines.push('Includes henchmen ready to accompany them.');
  }

  return lines.join('\n');
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

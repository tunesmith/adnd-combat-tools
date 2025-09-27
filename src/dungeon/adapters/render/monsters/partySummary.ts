import type { PartySummary } from '../../../helpers/party/formatPartyResult';
import type { DungeonMessage } from '../../../../types/dungeon';

export function buildPartyCompactSummary(summary: PartySummary): string {
  const mainDescriptions = summary.main.map(({ member, followers }) =>
    followers.length > 0
      ? `${member} (followers: ${followers.join(', ')})`
      : member
  );
  const parts: string[] = [];
  if (mainDescriptions.length > 0) {
    parts.push(`Main characters: ${mainDescriptions.join('; ')}`);
  }
  if (summary.includesHenchmen) {
    parts.push('Includes henchmen ready to accompany them.');
  }
  return parts.join(' ');
}

export function compactMessagesToText(messages: DungeonMessage[]): string {
  return messages
    .map((message) => messageToText(message))
    .filter((text): text is string => text.length > 0)
    .join(' ')
    .trim();
}

function messageToText(message: DungeonMessage): string {
  switch (message.kind) {
    case 'paragraph':
    case 'heading':
      return message.text.trim();
    case 'bullet-list':
      return message.items.join(' ');
    case 'character-party':
      return buildPartyCompactSummary(message.summary);
    default:
      return '';
  }
}

import { formatCharacterSummary } from '../../../helpers/party/formatPartyResult';
import type { PartySummary } from '../../../helpers/party/formatPartyResult';
import type { DungeonMessage } from '../../../../types/dungeon';
import { iounStonesCompactSentence } from '../../../features/treasure/miscMagicE3/miscMagicE3SubtablesRender';

export function buildPartyCompactSummary(summary: PartySummary): string {
  const mainDescriptions = summary.main.map(({ member, followers }) => {
    const memberText = formatCharacterSummary(member);
    if (followers.length === 0) return memberText;
    const followerText = followers
      .map((follower) => formatCharacterSummary(follower))
      .join(', ');
    return `${memberText} (followers: ${followerText})`;
  });
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
    case 'ioun-stones':
      return iounStonesCompactSentence(message.summary);
    default:
      return '';
  }
}

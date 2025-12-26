import type { DungeonMessage } from '../../../../types/dungeon';
import type { PartySummary } from '../../../helpers/party/formatPartyResult';

export function buildPartyCharacterMessage(
  summary: PartySummary,
  display: 'detail' | 'compact'
): DungeonMessage {
  return {
    kind: 'character-party',
    summary,
    display,
  };
}


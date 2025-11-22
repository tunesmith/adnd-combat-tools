import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { passageWidth, PassageWidth } from './passageWidthTable';

export function resolvePassageWidth(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(passageWidth.sides);
  const command = getTableEntry(usedRoll, passageWidth);
  const event: OutcomeEvent = {
    kind: 'passageWidth',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === PassageWidth.SpecialPassage) {
    children.push({ type: 'pending-roll', table: 'specialPassage' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

import { passageTurns, PassageTurns } from '../../tables/dungeon/passageTurns';
import { passageWidthMessages } from './passageWidth';
import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
import type {
  DungeonTablePreview,
  DungeonRenderNode,
} from '../../types/dungeon';
import { resolvePassageTurns } from '../domain/resolvers';
import { toCompactRender, toDetailRender } from '../adapters/render';

export const passageTurnResults = (): string => {
  const roll = rollDice(passageTurns.sides);
  const command = getTableEntry(roll, passageTurns);
  console.log(`passageTurn roll: ${roll} is ${PassageTurns[command]}`);
  switch (command) {
    case PassageTurns.Left90:
      return (
        "The passage turns left 90 degrees - check again in 30'. " + textWidth()
      );
    case PassageTurns.Left45:
      return (
        "The passage turns left 45 degrees ahead - check again in 30'. " +
        textWidth()
      );
    case PassageTurns.Left135:
      return (
        "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. " +
        textWidth()
      );
    case PassageTurns.Right90:
      return (
        "The passage turns right 90 degrees - check again in 30'. " +
        textWidth()
      );
    case PassageTurns.Right45:
      return (
        "The passage turns right 45 degrees ahead - check again in 30'. " +
        textWidth()
      );
    case PassageTurns.Right135:
      return (
        "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. " +
        textWidth()
      );
  }
};

export const passageTurnMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'passageTurns',
      title: 'Passage Turns',
      sides: passageTurns.sides,
      entries: passageTurns.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: PassageTurns[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const node = resolvePassageTurns({ roll: options?.roll });
  const usedRoll = node.type === 'event' ? node.roll : undefined;
  const messages = options?.detailMode
    ? toDetailRender(node)
    : toCompactRender(node);
  return { usedRoll, messages };
};

function textWidth(): string {
  const width = passageWidthMessages({});
  let text = '';
  for (const m of width.messages) if (m.kind === 'paragraph') text += m.text;
  return text;
}

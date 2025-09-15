import { UnusualSize, unusualSize } from '../../tables/dungeon/unusualSize';
import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
import type { DungeonMessage, DungeonTablePreview } from '../../types/dungeon';

// Legacy string unusualSizeResult removed; use unusualSizeMessages in adapters.

export const getSize = (extraSquareFootage: number = 0): number => {
  const roll = rollDice(unusualSize.sides);
  const command = getTableEntry(roll, unusualSize);
  console.log(`unusualSize roll: ${roll} is ${UnusualSize[command]}`);
  switch (command) {
    case UnusualSize.SqFt500:
      return 500 + extraSquareFootage;
    case UnusualSize.SqFt900:
      return 900 + extraSquareFootage;
    case UnusualSize.SqFt1300:
      return 1300 + extraSquareFootage;
    case UnusualSize.SqFt2000:
      return 2000 + extraSquareFootage;
    case UnusualSize.SqFt2700:
      return 2700 + extraSquareFootage;
    case UnusualSize.SqFt3400:
      return 3400 + extraSquareFootage;
    case UnusualSize.RollAgain:
      return getSize(extraSquareFootage ? extraSquareFootage * 2 : 2000);
  }
};

export const unusualSizeMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  seq?: number;
  extra?: number;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: `unusualSize:${options.seq ?? 0}:${options?.extra ?? 0}`,
      title: 'Unusual Size (sq. ft.)',
      sides: unusualSize.sides,
      entries: unusualSize.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: UnusualSize[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(unusualSize.sides);
  const command = getTableEntry(usedRoll, unusualSize);
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: 'heading', level: 4, text: 'Unusual Size' },
    {
      kind: 'bullet-list',
      items: [`roll: ${usedRoll} — ${UnusualSize[command]}`],
    },
  ];
  if (command === UnusualSize.RollAgain && options?.detailMode) {
    // Stage another preview; defer size until resolved
    messages.push({
      kind: 'paragraph',
      text: 'Roll again for unusual size.',
    });
    const nextSeq = (options?.seq ?? 0) + 1;
    const nextExtra = options?.extra ? options.extra * 2 : 2000;
    messages.push({
      kind: 'table-preview',
      id: `unusualSize:${nextSeq}:${nextExtra}`,
      title: 'Unusual Size (sq. ft.)',
      sides: unusualSize.sides,
      entries: unusualSize.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: UnusualSize[e.command] ?? String(e.command),
      })),
    });
    return { usedRoll, messages };
  }
  // Compute and report final size
  const size =
    command === UnusualSize.SqFt500
      ? 500
      : command === UnusualSize.SqFt900
      ? 900
      : command === UnusualSize.SqFt1300
      ? 1300
      : command === UnusualSize.SqFt2000
      ? 2000
      : command === UnusualSize.SqFt2700
      ? 2700
      : 3400;
  const extra = options?.extra ?? 0;
  messages.push({
    kind: 'paragraph',
    text: `It is about ${size + extra} sq. ft. `,
  });
  return { usedRoll, messages };
};

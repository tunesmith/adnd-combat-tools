import type { DungeonMessage, DungeonTablePreview } from '../../types/dungeon';

// Stub typed wrapper for Trick/Trap until a full table is added
export const trickTrapMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'trickTrap',
      title: 'Trick / Trap',
      sides: 20,
      entries: [
        { range: '1–20', label: 'Not yet implemented — use GM judgment' },
      ],
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 1; // placeholder
  const messages: DungeonMessage[] = [
    { kind: 'heading', level: 4, text: 'Trick / Trap' },
    { kind: 'bullet-list', items: [`roll: ${usedRoll} — TBD`] },
    {
      kind: 'paragraph',
      text: "There is a trick or trap. (TODO) -- check again in 30'. ",
    },
  ];
  return { usedRoll, messages };
};

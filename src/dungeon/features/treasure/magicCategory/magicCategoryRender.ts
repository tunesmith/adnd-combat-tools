import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  treasureMagicCategory,
  TreasureMagicCategory,
} from './magicCategoryTable';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

type MagicCategoryInfo = {
  label: string;
  detail: string;
};

const MAGIC_CATEGORY_INFO: Record<TreasureMagicCategory, MagicCategoryInfo> = {
  [TreasureMagicCategory.Potions]: {
    label: 'Potions (Table A)',
    detail: 'Roll on Table A to determine the potion.',
  },
  [TreasureMagicCategory.Scrolls]: {
    label: 'Scrolls (Table B)',
    detail: 'Roll on Table B to determine the scroll.',
  },
  [TreasureMagicCategory.Rings]: {
    label: 'Rings (Table C)',
    detail: 'Roll on Table C to determine the ring.',
  },
  [TreasureMagicCategory.RodsStavesWands]: {
    label: 'Rods, Staves & Wands (Table D)',
    detail: 'Roll on Table D to determine the rod, staff, or wand.',
  },
  [TreasureMagicCategory.MiscMagicE1]: {
    label: 'Miscellaneous Magic (Table E.1)',
    detail: 'Roll on Table E.1 to determine the miscellaneous item.',
  },
  [TreasureMagicCategory.MiscMagicE2]: {
    label: 'Miscellaneous Magic (Table E.2)',
    detail: 'Roll on Table E.2 to determine the miscellaneous item.',
  },
  [TreasureMagicCategory.MiscMagicE3]: {
    label: 'Miscellaneous Magic (Table E.3)',
    detail: 'Roll on Table E.3 to determine the miscellaneous item.',
  },
  [TreasureMagicCategory.MiscMagicE4]: {
    label: 'Miscellaneous Magic (Table E.4)',
    detail: 'Roll on Table E.4 to determine the miscellaneous item.',
  },
  [TreasureMagicCategory.MiscMagicE5]: {
    label: 'Miscellaneous Magic (Table E.5)',
    detail: 'Roll on Table E.5 to determine the miscellaneous item.',
  },
  [TreasureMagicCategory.ArmorShields]: {
    label: 'Armor & Shields (Table F)',
    detail: 'Roll on Table F to determine the armor or shield.',
  },
  [TreasureMagicCategory.Swords]: {
    label: 'Swords (Table G)',
    detail: 'Roll on Table G to determine the sword.',
  },
  [TreasureMagicCategory.MiscWeapons]: {
    label: 'Miscellaneous Weapons (Table H)',
    detail: 'Roll on Table H to determine the miscellaneous weapon.',
  },
};

export function renderTreasureMagicCategoryDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMagicCategory') return [];
  const info = MAGIC_CATEGORY_INFO[outcome.event.result];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Magical Treasure',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${info.label}`],
  };
  const detail: DungeonMessage = {
    kind: 'paragraph',
    text: info.detail,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, detail];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMagicCategoryCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMagicCategory') return [];
  const info = MAGIC_CATEGORY_INFO[outcome.event.result];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Magical Treasure',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: info.detail,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMagicCategoryPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Magical Treasure',
    sides: treasureMagicCategory.sides,
    entries: treasureMagicCategory.entries.map((entry) => ({
      range: entry.range,
      label: MAGIC_CATEGORY_INFO[entry.command].label,
    })),
  });

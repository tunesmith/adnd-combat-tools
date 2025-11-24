import {
  TREASURE_PREVIEW_FACTORIES,
  TREASURE_REGISTRY_OUTCOMES,
  TREASURE_RENDER_ADAPTERS,
  TREASURE_TABLE_DEFINITIONS,
} from '.';

export type TreasureTableId = typeof TREASURE_TABLE_DEFINITIONS[number]['id'];

export const TREASURE_TABLE_ID_LIST: ReadonlyArray<TreasureTableId> =
  TREASURE_TABLE_DEFINITIONS.map((def) => def.id);

export const TREASURE_TABLE_HEADINGS = Object.fromEntries(
  TREASURE_TABLE_DEFINITIONS.map((def) => [def.id, def.heading])
) as Record<TreasureTableId, string>;

export {
  TREASURE_PREVIEW_FACTORIES,
  TREASURE_REGISTRY_OUTCOMES,
  TREASURE_RENDER_ADAPTERS,
  TREASURE_TABLE_DEFINITIONS,
};

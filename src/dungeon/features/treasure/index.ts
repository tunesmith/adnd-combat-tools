import type { DungeonTableDefinition } from '../types';
import {
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from '../types';
import { potionTables } from './potion/manifest';
import { scrollTables } from './scroll/manifest';

const defineTreasureTables = <
  T extends ReadonlyArray<DungeonTableDefinition<unknown>>
>(
  defs: T
): T => defs;

const treasureDefinitions = defineTreasureTables([
  ...potionTables,
  ...scrollTables,
] as ReadonlyArray<DungeonTableDefinition<unknown>>);

export const TREASURE_TABLE_DEFINITIONS = treasureDefinitions;
export const TREASURE_RENDER_ADAPTERS =
  createRenderAdapterMap(treasureDefinitions);
export const TREASURE_PREVIEW_FACTORIES =
  createPreviewFactoryMap(treasureDefinitions);
export const TREASURE_REGISTRY_OUTCOMES =
  createRegistryOutcomeMap(treasureDefinitions);

import type { DungeonTableDefinition } from '../types';
import {
  createPendingResolverMap,
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from '../types';
import { magicCategoryTables } from './magicCategory/manifest';
import { potionTables } from './potion/manifest';
import { scrollTables } from './scroll/manifest';
import { ringTables } from './ring/manifest';
import { rodStaffWandTables } from './rodStaffWand/manifest';
import { miscMagicE1Tables } from './miscMagicE1/manifest';
import { protectionTables } from './protection/manifest';
import { containerTables } from './container/manifest';
import { miscMagicE2Tables } from './miscMagicE2/manifest';
import { miscMagicE3Tables } from './miscMagicE3/manifest';
import { miscMagicE4Tables } from './miscMagicE4/manifest';
import { miscMagicE5Tables } from './miscMagicE5/manifest';

const defineTreasureTables = <
  T extends ReadonlyArray<DungeonTableDefinition<unknown>>
>(
  defs: T
): T => defs;

const treasureDefinitions = defineTreasureTables([
  ...magicCategoryTables,
  ...potionTables,
  ...scrollTables,
  ...ringTables,
  ...rodStaffWandTables,
  ...miscMagicE1Tables,
  ...miscMagicE2Tables,
  ...miscMagicE3Tables,
  ...miscMagicE4Tables,
  ...miscMagicE5Tables,
  ...protectionTables,
  ...containerTables,
] as ReadonlyArray<DungeonTableDefinition<unknown>>);

export const TREASURE_TABLE_DEFINITIONS = treasureDefinitions;
export const TREASURE_RENDER_ADAPTERS =
  createRenderAdapterMap(treasureDefinitions);
export const TREASURE_PREVIEW_FACTORIES =
  createPreviewFactoryMap(treasureDefinitions);
export const TREASURE_REGISTRY_OUTCOMES =
  createRegistryOutcomeMap(treasureDefinitions);
export const TREASURE_PENDING_RESOLVERS =
  createPendingResolverMap(treasureDefinitions);

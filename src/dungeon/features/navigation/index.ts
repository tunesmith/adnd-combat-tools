import type { DungeonTableDefinition } from '../types';
import {
  createChildPostProcessorMap,
  createPendingResolverMap,
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from '../types';
import { entryTables } from './tables/entry';
import { passageTables } from './tables/passages';
import { chasmTables } from './tables/chasm';
import { exitTables } from './tables/exits';
import { hazardTables } from './tables/hazards';

const defineNavigationTables = <
  T extends ReadonlyArray<DungeonTableDefinition<unknown>>
>(
  defs: T
): T => defs;

const navigationDefinitions = defineNavigationTables([
  ...entryTables,
  ...passageTables,
  ...chasmTables,
  ...exitTables,
  ...hazardTables,
]);

export const NAVIGATION_TABLE_DEFINITIONS = navigationDefinitions;
export const NAVIGATION_RENDER_ADAPTERS =
  createRenderAdapterMap(navigationDefinitions);
export const NAVIGATION_PREVIEW_FACTORIES =
  createPreviewFactoryMap(navigationDefinitions);
export const NAVIGATION_REGISTRY_OUTCOMES =
  createRegistryOutcomeMap(navigationDefinitions);
export const NAVIGATION_CHILD_POST_PROCESSORS =
  createChildPostProcessorMap(navigationDefinitions);
export const NAVIGATION_PENDING_RESOLVERS =
  createPendingResolverMap(navigationDefinitions);

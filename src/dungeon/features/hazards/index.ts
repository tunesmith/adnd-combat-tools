import type { DungeonTableDefinition } from '../types';
import {
  createChildPostProcessorMap,
  createPendingResolverMap,
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from '../types';
import { gasTrapTables } from './gasTrap/manifest';
import { trickTrapTables } from './trickTrap/manifest';

const defineHazardTables = <
  T extends ReadonlyArray<DungeonTableDefinition<unknown>>
>(
  defs: T
): T => defs;

const hazardDefinitions = defineHazardTables([
  ...gasTrapTables,
  ...trickTrapTables,
]);

export const HAZARD_TABLE_DEFINITIONS = hazardDefinitions;
export const HAZARD_RENDER_ADAPTERS = createRenderAdapterMap(hazardDefinitions);
export const HAZARD_PREVIEW_FACTORIES =
  createPreviewFactoryMap(hazardDefinitions);
export const HAZARD_REGISTRY_OUTCOMES =
  createRegistryOutcomeMap(hazardDefinitions);
export const HAZARD_CHILD_POST_PROCESSORS =
  createChildPostProcessorMap(hazardDefinitions);
export const HAZARD_PENDING_RESOLVERS =
  createPendingResolverMap(hazardDefinitions);

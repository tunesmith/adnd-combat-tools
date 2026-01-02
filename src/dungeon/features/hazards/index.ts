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
import { illusionaryWallTables } from './illusionaryWall/manifest';

const defineHazardTables = <T extends ReadonlyArray<DungeonTableDefinition>>(
  defs: T
): T => defs;

const hazardDefinitions = defineHazardTables([
  ...gasTrapTables,
  ...trickTrapTables,
  ...illusionaryWallTables,
]);

export const HAZARD_TABLE_DEFINITIONS = hazardDefinitions;
const HAZARD_RENDER_ADAPTERS = createRenderAdapterMap(hazardDefinitions);
const HAZARD_PREVIEW_FACTORIES =
  createPreviewFactoryMap(hazardDefinitions);
const HAZARD_REGISTRY_OUTCOMES =
  createRegistryOutcomeMap(hazardDefinitions);
const HAZARD_CHILD_POST_PROCESSORS =
  createChildPostProcessorMap(hazardDefinitions);
const HAZARD_PENDING_RESOLVERS =
  createPendingResolverMap(hazardDefinitions);

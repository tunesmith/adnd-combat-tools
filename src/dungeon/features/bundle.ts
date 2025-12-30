import type { DungeonTableDefinition } from './types';
import {
  createChildPostProcessorMap,
  createPendingResolverMap,
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from './types';
import { NAVIGATION_TABLE_DEFINITIONS } from './navigation';
import { HAZARD_TABLE_DEFINITIONS } from './hazards';
import { TREASURE_TABLE_DEFINITIONS } from './treasure';
import { MONSTER_TABLE_DEFINITIONS } from './monsters';

const defineAllTables = <
  T extends ReadonlyArray<DungeonTableDefinition<unknown>>
>(
  defs: T
): T => defs;

const featureDefinitions = defineAllTables([
  ...NAVIGATION_TABLE_DEFINITIONS,
  ...HAZARD_TABLE_DEFINITIONS,
  ...TREASURE_TABLE_DEFINITIONS,
  ...MONSTER_TABLE_DEFINITIONS,
] as ReadonlyArray<DungeonTableDefinition<unknown>>);

export const ALL_TABLE_DEFINITIONS = featureDefinitions;
export const ALL_RENDER_ADAPTERS = createRenderAdapterMap(featureDefinitions);
export const ALL_PREVIEW_FACTORIES = createPreviewFactoryMap(featureDefinitions);
export const ALL_REGISTRY_OUTCOMES = createRegistryOutcomeMap(
  featureDefinitions
);
export const ALL_PENDING_RESOLVERS = createPendingResolverMap(featureDefinitions);
export const ALL_CHILD_POST_PROCESSORS = createChildPostProcessorMap(
  featureDefinitions
);

export type FeatureTableId = typeof ALL_TABLE_DEFINITIONS[number]['id'];

export const ALL_TABLE_ID_LIST: ReadonlyArray<FeatureTableId> =
  ALL_TABLE_DEFINITIONS.map((def) => def.id);

export const ALL_TABLE_HEADINGS = Object.fromEntries(
  ALL_TABLE_DEFINITIONS.map((def) => [def.id, def.heading])
) as Record<FeatureTableId, string>;


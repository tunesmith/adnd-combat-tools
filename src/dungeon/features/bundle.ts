import type { DungeonTableDefinition } from './types';
import type { DungeonOutcomeNode } from '../domain/outcome';
import {
  createChildPostProcessorMap,
  createEventPreviewMap,
  createOutcomePostProcessorList,
  createPendingResolverMap,
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from './types';
import { NAVIGATION_TABLE_DEFINITIONS } from './navigation';
import { HAZARD_TABLE_DEFINITIONS } from './hazards';
import { TREASURE_TABLE_DEFINITIONS } from './treasure';
import { MONSTER_TABLE_DEFINITIONS } from './monsters';
import { ENVIRONMENT_TABLE_DEFINITIONS } from './environment';

const ALL_TABLE_DEFINITIONS = [
  ...NAVIGATION_TABLE_DEFINITIONS,
  ...HAZARD_TABLE_DEFINITIONS,
  ...TREASURE_TABLE_DEFINITIONS,
  ...MONSTER_TABLE_DEFINITIONS,
  ...ENVIRONMENT_TABLE_DEFINITIONS,
] as ReadonlyArray<DungeonTableDefinition>;
export const ALL_RENDER_ADAPTERS =
  createRenderAdapterMap(ALL_TABLE_DEFINITIONS);
export const ALL_PREVIEW_FACTORIES =
  createPreviewFactoryMap(ALL_TABLE_DEFINITIONS);
export const ALL_EVENT_PREVIEW_BUILDERS =
  createEventPreviewMap(ALL_TABLE_DEFINITIONS);
export const ALL_REGISTRY_OUTCOMES =
  createRegistryOutcomeMap(ALL_TABLE_DEFINITIONS);
export const ALL_PENDING_RESOLVERS =
  createPendingResolverMap(ALL_TABLE_DEFINITIONS);
export const ALL_CHILD_POST_PROCESSORS =
  createChildPostProcessorMap(ALL_TABLE_DEFINITIONS);

const ALL_OUTCOME_POST_PROCESSORS =
  createOutcomePostProcessorList(ALL_TABLE_DEFINITIONS);

export function postProcessOutcomeTree(
  outcome: DungeonOutcomeNode
): DungeonOutcomeNode {
  return ALL_OUTCOME_POST_PROCESSORS.reduce(
    (acc, processor) => processor(acc),
    outcome
  );
}

export type FeatureTableId = typeof ALL_TABLE_DEFINITIONS[number]['id'];

export const ALL_TABLE_ID_LIST: ReadonlyArray<FeatureTableId> =
  ALL_TABLE_DEFINITIONS.map((def) => def.id);

export const ALL_TABLE_HEADINGS = Object.fromEntries(
  ALL_TABLE_DEFINITIONS.map((def) => [def.id, def.heading])
) as Record<FeatureTableId, string>;

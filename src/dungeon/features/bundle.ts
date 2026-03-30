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
import { entryTables } from './navigation/entry/manifest';
import { doorChainTables } from './navigation/doorChain/manifest';
import { sidePassageTables } from './navigation/sidePassage/manifest';
import { passageTurnTables } from './navigation/passageTurn/manifest';
import { passageWidthTables } from './navigation/passageWidth/manifest';
import { specialPassageTables } from './navigation/specialPassage/manifest';
import { exitTables } from './navigation/exit/manifest';
import { chasmTables } from './navigation/chasm/manifest';
import { gasTrapTables } from './hazards/gasTrap/manifest';
import { trickTrapTables } from './hazards/trickTrap/manifest';
import { illusionaryWallTables } from './hazards/illusionaryWall/manifest';
import { TREASURE_TABLE_DEFINITIONS } from './treasure';
import { MONSTER_TABLE_DEFINITIONS } from './monsters';
import { roomsChambersTables } from './environment/roomsChambers/manifest';
import { unusualSpaceTables } from './environment/unusualSpace/manifest';
import { circularPoolsTables } from './environment/circularPools/manifest';

const ALL_TABLE_DEFINITIONS = [
  ...entryTables,
  ...doorChainTables,
  ...sidePassageTables,
  ...passageTurnTables,
  ...passageWidthTables,
  ...specialPassageTables,
  ...exitTables,
  ...chasmTables,
  ...gasTrapTables,
  ...trickTrapTables,
  ...illusionaryWallTables,
  ...TREASURE_TABLE_DEFINITIONS,
  ...MONSTER_TABLE_DEFINITIONS,
  ...roomsChambersTables,
  ...unusualSpaceTables,
  ...circularPoolsTables,
] as ReadonlyArray<DungeonTableDefinition>;
export const ALL_RENDER_ADAPTERS = createRenderAdapterMap(
  ALL_TABLE_DEFINITIONS
);
export const ALL_PREVIEW_FACTORIES = createPreviewFactoryMap(
  ALL_TABLE_DEFINITIONS
);
export const ALL_EVENT_PREVIEW_BUILDERS = createEventPreviewMap(
  ALL_TABLE_DEFINITIONS
);
export const ALL_REGISTRY_OUTCOMES = createRegistryOutcomeMap(
  ALL_TABLE_DEFINITIONS
);
export const ALL_PENDING_RESOLVERS = createPendingResolverMap(
  ALL_TABLE_DEFINITIONS
);
export const ALL_CHILD_POST_PROCESSORS = createChildPostProcessorMap(
  ALL_TABLE_DEFINITIONS
);

const ALL_OUTCOME_POST_PROCESSORS = createOutcomePostProcessorList(
  ALL_TABLE_DEFINITIONS
);

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

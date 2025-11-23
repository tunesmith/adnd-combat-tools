import type { DungeonTableDefinition } from '../types';
import {
  createChildPostProcessorMap,
  createPendingResolverMap,
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from '../types';
import { entryTables } from './tables/entry';
import { sidePassageTables } from './sidePassage/manifest';
import { passageTurnTables } from './passageTurn/manifest';
import { specialPassageTables } from './specialPassage/manifest';
import { passageWidthTables } from './passageWidth/manifest';
import { exitTables } from './exit/manifest';
import { chasmTables } from './chasm/manifest';
import { gasTrapTables } from './gasTrap/manifest';
import { doorChainTables } from './doorChain/manifest';

const defineNavigationTables = <
  T extends ReadonlyArray<DungeonTableDefinition<unknown>>
>(
  defs: T
): T => defs;

const navigationDefinitions = defineNavigationTables([
  ...entryTables,
  ...doorChainTables,
  ...sidePassageTables,
  ...passageTurnTables,
  ...passageWidthTables,
  ...specialPassageTables,
  ...exitTables,
  ...chasmTables,
  ...gasTrapTables,
]);

export const NAVIGATION_TABLE_DEFINITIONS = navigationDefinitions;
export const NAVIGATION_RENDER_ADAPTERS = createRenderAdapterMap(
  navigationDefinitions
);
export const NAVIGATION_PREVIEW_FACTORIES = createPreviewFactoryMap(
  navigationDefinitions
);
export const NAVIGATION_REGISTRY_OUTCOMES = createRegistryOutcomeMap(
  navigationDefinitions
);
export const NAVIGATION_CHILD_POST_PROCESSORS = createChildPostProcessorMap(
  navigationDefinitions
);
export const NAVIGATION_PENDING_RESOLVERS = createPendingResolverMap(
  navigationDefinitions
);

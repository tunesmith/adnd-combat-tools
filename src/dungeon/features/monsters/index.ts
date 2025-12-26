import type { DungeonTableDefinition } from '../types';
import {
  createPendingResolverMap,
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from '../types';
import { monsterLevelTables } from './monsterLevel/manifest';
import { monsterOneTables } from './monsterOne/manifest';
import { monsterFourTables } from './monsterFour/manifest';
import { monsterFiveTables } from './monsterFive/manifest';
import { monsterThreeTables } from './monsterThree/manifest';
import { monsterTwoTables } from './monsterTwo/manifest';

const defineMonsterTables = <
  T extends ReadonlyArray<DungeonTableDefinition<unknown>>
>(
  defs: T
): T => defs;

const monsterDefinitions = defineMonsterTables([
  ...monsterLevelTables,
  ...monsterOneTables,
  ...monsterTwoTables,
  ...monsterThreeTables,
  ...monsterFourTables,
  ...monsterFiveTables,
] as ReadonlyArray<DungeonTableDefinition<unknown>>);

export const MONSTER_TABLE_DEFINITIONS = monsterDefinitions;
export const MONSTER_RENDER_ADAPTERS =
  createRenderAdapterMap(monsterDefinitions);
export const MONSTER_PREVIEW_FACTORIES =
  createPreviewFactoryMap(monsterDefinitions);
export const MONSTER_REGISTRY_OUTCOMES =
  createRegistryOutcomeMap(monsterDefinitions);
export const MONSTER_PENDING_RESOLVERS =
  createPendingResolverMap(monsterDefinitions);

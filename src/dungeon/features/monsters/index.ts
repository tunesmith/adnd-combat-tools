import type { DungeonTableDefinition } from '../types';
import {
  createPendingResolverMap,
  createPreviewFactoryMap,
  createRegistryOutcomeMap,
  createRenderAdapterMap,
} from '../types';
import { monsterLevelTables } from './monsterLevel/manifest';
import { monsterOneTables } from './monsterOne/manifest';
import { humanTables } from './human/manifest';
import { monsterFourTables } from './monsterFour/manifest';
import { monsterFiveTables } from './monsterFive/manifest';
import { monsterSixTables } from './monsterSix/manifest';
import { monsterSevenTables } from './monsterSeven/manifest';
import { monsterEightTables } from './monsterEight/manifest';
import { monsterNineTables } from './monsterNine/manifest';
import { monsterTenTables } from './monsterTen/manifest';
import { monsterThreeTables } from './monsterThree/manifest';
import { monsterTwoTables } from './monsterTwo/manifest';

const defineMonsterTables = <T extends ReadonlyArray<DungeonTableDefinition>>(
  defs: T
): T => defs;

const monsterDefinitions = defineMonsterTables([
  ...monsterLevelTables,
  ...monsterOneTables,
  ...humanTables,
  ...monsterTwoTables,
  ...monsterThreeTables,
  ...monsterFourTables,
  ...monsterFiveTables,
  ...monsterSixTables,
  ...monsterSevenTables,
  ...monsterEightTables,
  ...monsterNineTables,
  ...monsterTenTables,
] as ReadonlyArray<DungeonTableDefinition>);

export const MONSTER_TABLE_DEFINITIONS = monsterDefinitions;
const MONSTER_RENDER_ADAPTERS =
  createRenderAdapterMap(monsterDefinitions);
const MONSTER_PREVIEW_FACTORIES =
  createPreviewFactoryMap(monsterDefinitions);
const MONSTER_REGISTRY_OUTCOMES =
  createRegistryOutcomeMap(monsterDefinitions);
const MONSTER_PENDING_RESOLVERS =
  createPendingResolverMap(monsterDefinitions);

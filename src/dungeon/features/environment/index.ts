import type { DungeonTableDefinition } from '../types';
import { circularPoolsTables } from './circularPools/manifest';
import { roomsChambersTables } from './roomsChambers/manifest';
import { unusualSpaceTables } from './unusualSpace/manifest';

const defineEnvironmentTables = <
  T extends ReadonlyArray<DungeonTableDefinition>
>(
  defs: T
): T => defs;

const environmentDefinitions = defineEnvironmentTables([
  ...roomsChambersTables,
  ...unusualSpaceTables,
  ...circularPoolsTables,
]);

export const ENVIRONMENT_TABLE_DEFINITIONS = environmentDefinitions;

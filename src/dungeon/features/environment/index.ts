import type { DungeonTableDefinition } from '../types';
import { circularPoolsTables } from './circularPools/manifest';
import { roomsChambersTables } from './roomsChambers/manifest';
import { unusualSpaceTables } from './unusualSpace/manifest';

export const ENVIRONMENT_TABLE_DEFINITIONS = [
  ...roomsChambersTables,
  ...unusualSpaceTables,
  ...circularPoolsTables,
] as ReadonlyArray<DungeonTableDefinition>;

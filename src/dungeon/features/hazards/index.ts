import type { DungeonTableDefinition } from '../types';
import { gasTrapTables } from './gasTrap/manifest';
import { trickTrapTables } from './trickTrap/manifest';
import { illusionaryWallTables } from './illusionaryWall/manifest';

export const HAZARD_TABLE_DEFINITIONS = [
  ...gasTrapTables,
  ...trickTrapTables,
  ...illusionaryWallTables,
] as ReadonlyArray<DungeonTableDefinition>;

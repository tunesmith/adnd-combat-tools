import type { DungeonTableDefinition } from '../types';
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

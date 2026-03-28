import type { DungeonTableDefinition } from '../types';
import { entryTables } from './entry/manifest';
import { sidePassageTables } from './sidePassage/manifest';
import { passageTurnTables } from './passageTurn/manifest';
import { specialPassageTables } from './specialPassage/manifest';
import { passageWidthTables } from './passageWidth/manifest';
import { exitTables } from './exit/manifest';
import { chasmTables } from './chasm/manifest';
import { doorChainTables } from './doorChain/manifest';

export const NAVIGATION_TABLE_DEFINITIONS = [
  ...entryTables,
  ...doorChainTables,
  ...sidePassageTables,
  ...passageTurnTables,
  ...passageWidthTables,
  ...specialPassageTables,
  ...exitTables,
  ...chasmTables,
] as ReadonlyArray<DungeonTableDefinition>;

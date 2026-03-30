import type { TableContext } from '../../types/dungeon';
import type { EnvironmentOutcomeEvent } from './environmentOutcome';
import type { HazardOutcomeEvent } from './hazardOutcome';
import type { MonsterOutcomeEvent } from './monsterOutcome';
import type { NavigationOutcomeEvent } from './navigationOutcome';
import type { TreasureOutcomeEvent } from './treasureOutcome';

export type OutcomeEvent =
  | NavigationOutcomeEvent
  | EnvironmentOutcomeEvent
  | HazardOutcomeEvent
  | MonsterOutcomeEvent
  | TreasureOutcomeEvent;

export type PendingRoll = {
  type: 'pending-roll';
  /**
   * New explicit pending discriminator. During the compatibility period we
   * still accept legacy `table`/`context` fields and normalize through helper
   * accessors.
   */
  kind?: string;
  /**
   * Legacy table identifier, often including a scoped suffix like `foo:1`.
   * New code should prefer `kind` + `args` and only set `table` when a
   * preview/reference needs the fully scoped identifier.
   */
  table: string;
  id?: string;
  // optional typed arguments for feature-local resolution
  args?: TableContext;
  // legacy context used by older callers; preserved during migration
  context?: TableContext;
};

export type OutcomeEventNode = {
  type: 'event';
  id?: string;
  event: OutcomeEvent;
  roll: number;
  children?: DungeonOutcomeNode[];
};

export type DungeonOutcomeNode = OutcomeEventNode | PendingRoll;

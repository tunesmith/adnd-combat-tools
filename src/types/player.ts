/**
 * A player is a creature that makes an action against a target player/monster/creature.
 */
interface Player {
  id: number;
  action: number;
  targets: number[]; // may have multiple targets?
  initDie: number;
}

export default Player;

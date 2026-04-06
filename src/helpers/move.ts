import type Player from '../types/player';
import type { PlayerMove, RoundDag } from '../types/sequence';

const initPlayers = (
  attacker: Player,
  target: Player
): { attackerMove: PlayerMove; targetMove: PlayerMove } => {
  const attackerMove: PlayerMove = {
    player: attacker,
    segment: undefined,
    moveNumber: 1,
  };
  const targetMove: PlayerMove = {
    player: target,
    segment: undefined,
    moveNumber: 1,
  };
  return { attackerMove, targetMove };
};

/**
 * Return simultaneous order, no matter what.
 *
 * @param attacker
 * @param target
 */
export const getSimultaneous = (attacker: Player, target: Player): RoundDag => {
  const { attackerMove, targetMove } = initPlayers(attacker, target);
  return {
    playerNodes: [attackerMove, targetMove],
    playerEdges: [],
  };
};

/**
 * Plain old sequential ordering. If init rolls are tied, return simultaneous order.
 *
 * @param attacker
 * @param target
 */
export const getSequential = (attacker: Player, target: Player): RoundDag => {
  const { attackerMove, targetMove } = initPlayers(attacker, target);
  if (attacker.initDie > target.initDie) {
    return {
      playerNodes: [attackerMove, targetMove],
      playerEdges: [
        {
          source: attackerMove.player.id,
          sourceMoveNumber: attackerMove.moveNumber,
          target: target.id,
          targetMoveNumber: targetMove.moveNumber,
        },
      ],
    };
  } else if (target.initDie > attacker.initDie) {
    return {
      playerNodes: [attackerMove, targetMove],
      playerEdges: [
        {
          source: targetMove.player.id,
          sourceMoveNumber: targetMove.moveNumber,
          target: attacker.id,
          targetMoveNumber: attackerMove.moveNumber,
        },
      ],
    };
  }
  return {
    playerNodes: [attackerMove, targetMove],
    playerEdges: [],
  };
};

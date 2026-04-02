import type Player from "./player";
import type Option from "./util";

interface MoveSequence {}
export interface InitOrder extends MoveSequence {}
// interface BeforeAfter extends MoveSequence {}
// interface LongerReach extends MoveSequence {}

/**
 * A PlayerSequence is a node.
 *
 * Properties could include logging, like an explanation of how the move was calculated.
 */
export interface PlayerSequence {
  player: Player;
  previous: Option<ActionDependency[]>; // I need this to make sure a two-parent node is still blocked
  segment: Option<number>;
  next: Option<ActionDependency[]>;
}
/**
 * An ActionDependency is an edge.
 *
 * Each edge is a line from a node to a node.
 */
export interface ActionDependency {
  source: PlayerSequence;
  property?: string;
  decisionType: MoveSequence; // I'll probably dump this, it's just for info
  target: PlayerSequence;
}

export interface PlayerMove {
  player: Player;
  moveNumber: number;
  segment: Option<number>;
}
// TODO source and target should just be PlayerMove ids instead
export interface PlayerEdge {
  source: number;
  sourceMoveNumber: number;
  target: number;
  targetMoveNumber: number;
}
/**
 *
 */
export interface RoundDag {
  playerNodes: PlayerMove[]; // nodes
  playerEdges: PlayerEdge[]; // edges
}

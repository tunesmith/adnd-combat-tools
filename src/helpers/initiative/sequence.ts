import type Player from "../../types/player";
import type { PlayerMove, RoundDag } from "../../types/sequence";
import matchup, { Ruleset } from "../matchup";

/**
 * I believe the goal here is to receive a collection of players,
 * each with an initiative roll and action, and then determine
 * the overall DAG - a collection of nodes and edges - from their
 * desired actions.
 *
 * @param players all players/monsters/creatures
 */
const sequencePlayers = (players: Player[]): RoundDag => {
  const fullCombatGraph = players.reduce<RoundDag>(
    (prev: RoundDag, attacker: Player, _, players) => {
      const opponents: Player[] = players.filter((player) =>
        attacker.targets.includes(player.id)
      );
      /**
       * There is a matchup for each target of the attacker in question. So this
       * should return the revised nodes and edges for this attacker and all its
       * outgoing edges.
       *
       * We'll return a Dag for each matchup.
       */
      const partialDags = opponents.map((target) =>
        matchup(attacker, target, Ruleset.ByTheBook)
      );
      /**
       * So now that we have a collection of partialDags, we have to go through them
       * and compare them to what we had before, and reduce them.
       */
      const matchupNodes = partialDags.flatMap((dag) => dag.playerNodes);
      const matchupEdges = partialDags.flatMap((dag) => dag.playerEdges);

      // Identify all new edges that aren't already part of prev's edges
      const newEdges = matchupEdges.filter(
        (edge) =>
          !prev.playerEdges.some(
            (e) => e.source === edge.source && e.target === edge.target
          )
      );
      /**
       * Now, compare the matchup nodes with what prev has. This needs to be an intelligent merge:
       * 1. *New* nodes need to be added
       * 2. *Pre-existing* nodes need to be examined:
       *  2a. If the matchup node has *less* information than the existing node, it should be ignored
       *  2b. If the matchup node has *more* information than the existing node, that new information should be added.
       *
       * We could call a reduce on the new nodes, while setting the previous nodes as the
       * initialized accumulator...
       */
      const newNodes = matchupNodes.reduce<PlayerMove[]>(
        (previousNodes, newNode) => {
          /**
           * For each of the nodes that this matchup created,
           * if the player.id/moveNumber combination doesn't already exist, add it. (concat)
           * if the player.id/moveNumber combination does already exist: (map)
           *    - if new node has segment
           *        - if old node doesn't, add it
           *        - if it does and it conflicts, ERROR!
           */
          if (
            previousNodes &&
            previousNodes.some(
              (playerMove) =>
                playerMove.player.id === newNode.player.id &&
                playerMove.moveNumber === newNode.moveNumber
            )
          ) {
            return previousNodes.map((oldMove) => {
              if (newNode.segment) {
                if (
                  oldMove.segment &&
                  newNode.segment &&
                  newNode.segment !== oldMove.segment
                ) {
                  console.error(
                    `new segment ${newNode.segment} does not match old segment ${oldMove.segment}; contradiction!!!`
                  );
                }
                return {
                  ...oldMove,
                  segment: newNode.segment,
                };
              }
              return oldMove;
            });
          } else {
            return previousNodes.concat(newNode);
          }
        },
        prev.playerNodes
      );

      return {
        playerNodes: newNodes,
        playerEdges: newEdges,
      };
    },
    { playerNodes: [], playerEdges: [] }
  );
  return fullCombatGraph;
};

export default sequencePlayers;

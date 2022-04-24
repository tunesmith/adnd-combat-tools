import Option from "../types/util";
import { PlayerEdge, PlayerMove, RoundDag } from "../types/sequence";
import Player from "../types/player";
import { getSequential, getSimultaneous } from "./move";

/**
 * Test case: Fighter attacks magic-user. Fighter attacks with 2H Sword (WSF 10).
 * Magic-User casts Mass Charm, 8 segments. Fighter loses initiative with a roll
 * of 1.
 *
 * Result: The adjusted weapon speed of 9 is greater than the casting time of 8,
 * so the Magic-User is able to get the spell off before the attack happens.
 *
 * Note this conflicts with rule #2.
 *
 * I like EOTB's interpretation that #2 supersedes this rule. If it's a super
 * long casting time, then he still might be interrupted, even with a 2H sword,
 * since an attack will always come on segments 1-6.
 *
 * Others (Nagora) like the interpretation that the 2H sword only interrupts
 * an 8seg spell if it wins initiative or loses with a roll of 3+. Which means
 * rule #2 does not supersede the WSF function.
 *
 * Nagora doesn't like Thorfinn.
 *
 * >"Attacks directed ot spell casters will come on that segment of the round shown
 * on the opponent's or on their own side's initiative die, whichever is applicable.
 * (If the spell caster's side won the initiative with a roll of 5, the attack must
 * come then, not on the opponent's losing roll of 4 or less.) Thus, all such attacks
 * will occur on the 1st-6th segments of the round."
 *
 * I haven't really gotten anywhere with this.
 *
 * So for now, I will limit the implementation, so that it is only called when:
 *  1. The caster's side wins initiative
 *  2. The attacker
 *
 * Here's a truism: *If* ruleTwo applies to WSF weapons, *then* casting must not
 * always start on seg-1. In this case, ruleTwo effectively "anchors" the spell
 * casting into some range that must be interrupted if the OWFD rule applies.
 * Which is weird.
 */

/**
 * Return the segment that the caster is attacked, if applicable
 *
 * @param attackerDie
 * @param casterDie
 */
export const ruleTwo = (
  attackerDie: number,
  casterDie: number
): Option<number> => {
  if (casterDie > attackerDie) {
    return casterDie;
  } else {
    return undefined;
  }
};

export const attackCaster = (attacker: Player, caster: Player): RoundDag => {
  // caster wins initiative
  if (caster.initDie > attacker.initDie) {
    //
    /**
     * Create edges from caster to each target, since caster won initiative.
     *
     * Specifically, this means that the commencement of the spell must
     * come first. *Not* the culmination (because of casting time).
     */
    const edges: PlayerEdge[] = caster.targets.map((target) => ({
      source: caster.id,
      target,
      sourceMoveNumber: 1,
      targetMoveNumber: 1,
    }));
    const moves: PlayerMove[] = [
      // caster
      { player: caster, moveNumber: 1, segment: undefined },
      // attacker
      {
        player: attacker,
        moveNumber: 1,
        segment: ruleTwo(attacker.initDie, caster.initDie),
      },
    ];
    return {
      playerNodes: moves,
      playerEdges: edges,
    };
  } else if (attacker.initDie === caster.initDie) {
    /**
     * Note this is highly controversial.
     *
     * In one reading, tied just means simultaneous - both actions succeed, neither interrupt.
     * In another reading, tied means the attack is simultaneous with spell commencements.
     * In other reading, the attack comes on the segment of the die.
     *
     * For now, we're choosing simultaneous, since it's the "punt" solution.
     */
    return getSimultaneous(attacker, caster);
  } else {
    /**
     * This is controversial as well.
     *
     * One reading is that if the caster loses initiative, that's it.
     * The other is that attacks still happen on each other's die.
     */
    return getSequential(attacker, caster);
  }
};

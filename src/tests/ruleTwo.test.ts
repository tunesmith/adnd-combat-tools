import type Player from "../types/player";
import { MISSILE, SPELL } from "../types/action";
import type { RoundDag } from "../types/sequence";
import sequencePlayers from "../helpers/initiative/sequence";

/**
 * The big question with rule #2: who does it apply to?
 *
 * Question #1: Does it apply to WSF weapons against spell-casters?
 *
 * In isolation, it appears the answer is yes, since the book clearly states,
 *
 * >"Attacks directed ot spell casters will come on that segment of the round shown on the
 * opponent's or on their own side's initiative die, which- ever is applicable. (If the
 * spell caster's side won the initiative with a roll of 5, the attack must come then,
 * not on the opponent's losing roll of 4 or less.) Thus, all such attacks will occur
 * on the 1st-6th segments of the round." (DMG p65)
 *
 * Given that, and that the section is labeled "Spell Casting During Melee", it seems
 * this would apply to any Melee Attack.
 *
 * However, there are mitigating factors:
 *
 * 1. The placement in the outline shows that this section is related to the section
 *     regarding Missile, Devices, Spells, and Turning (MDST).
 * 2. Applying this to WSF attacks would directly contradict the WSF against timed action
 *     section on p67, or lead to nonsensical results
 *     a. For instance, if a fighter attacks with a 2H sword (WSF 10), against a
 *      Magic-User casting Mass Charm, 8 segments, and loses on a roll of 1,
 *      then the spell happens before the weapon. But if the Magic-User rolls
 *      a 6, then this is either impossible, or, the Magic-User began casting
 *      the spell two segments before the round began.
 * 3. p67 comes later, and can be read as a "more specific" variation to something
 *     previously stated. In this reading, rule #2 would apply to natural melee
 *     attacks, but not WSF attacks.
 */

describe('ruleTwo', () => {
  test('default p65', () => {
    /**
     * >"If the spell caster's side won the initiative with a roll of 5,
     * the attack must come then, not on the opponent's losing roll of
     * 4 or less" (DMG p65)
     */
    const caster: Player = {
      id: 1,
      action: SPELL,
      targets: [2],
      initDie: 5,
    };
    const opponent: Player = {
      id: 2,
      action: MISSILE, // Note this is unclear what move types this rule applies to
      targets: [1],
      initDie: 4, // 4 or less
    };
    const sequence: RoundDag = sequencePlayers([caster, opponent]);

    // there should be one winner (ie not simultaneous)
    const firstMovers = sequence.playerNodes.filter(
      (playerMove) =>
        !sequence.playerEdges.some(
          (edge) => edge.target === playerMove.player.id
        )
    );
    expect(firstMovers.length).toBe(1);
    // the winner should be the caster
    expect(firstMovers[0]?.player.id === caster.id);

    // the caster should have no one before them
    const casterAsLoser = sequence.playerEdges.filter(
      (edge) => edge.target === caster.id
    );
    expect(casterAsLoser.length).toBe(0);

    // the caster should be before the opponent
    const casterBeatsOpponent = sequence.playerEdges.filter(
      (edge) => edge.source === caster.id && edge.target === opponent.id
    );
    expect(casterBeatsOpponent.length).toBe(1);

    // The opponent's attack should come on segment 5.
    const opponentAttack = sequence.playerNodes.filter(
      (playerMove) => playerMove.player.id === opponent.id
    );
    expect(opponentAttack[0]?.segment).toBe(5);
  });
});

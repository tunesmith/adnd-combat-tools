import type Player from '../types/player';
import { MELEE_WEAPON, SPELL } from '../types/action';
import sequencePlayers from '../helpers/initiative/sequence';

/**
 * If the rolls are 5-5, and we drop one cleric but now one fighter is attacking the remaining cleric -
 * not an especially unusual situation.
 *
 * So, FA with bastard sword (wsf 6), FB with battle axe (7), and cleric B casting hold person (ct 5).
 * FA attacks the cleric; FB attacking FA. Everyone's directly involved and the players need to know
 * what the sequence is. What is your answer? Because at this point I can't guess where you'll go with this.
 */
describe('nagora tests', () => {
  test('fighters and cleric', () => {
    const fighterA: Player = {
      id: 1,
      initDie: 5,
      targets: [3],
      action: MELEE_WEAPON,
    };
    const fighterB: Player = {
      id: 2,
      initDie: 5,
      targets: [1],
      action: MELEE_WEAPON,
    };
    const clericB: Player = {
      id: 3,
      initDie: 5,
      targets: [1],
      action: SPELL,
    };
    // TODO turn on wsf - store weapons and casting time in player definitions
    const combatGraph = sequencePlayers([fighterA, fighterB, clericB]);
    console.log(combatGraph);
    expect(combatGraph.playerNodes.length).toBeGreaterThan(0);
  });
});

import type Player from '../types/player';
import type { RoundDag } from '../types/sequence';
import {
  CHARGE,
  MELEE_MULTI,
  MELEE_NATURAL,
  MELEE_WEAPON,
  MISSILE,
  MISSILE_MULTI,
  SPELL,
  TURN,
} from "../types/action";
import { getSequential, getSimultaneous } from "./move";
import { attackCaster } from "./ruleTwo";

export enum Ruleset {
  Simultaneous,
  Sequential,
  ByTheBook,
}

/**
 * Each should return a graph snippet. A portion of a DAG. Each node can also return
 * optional information of what segment it lands on.
 *
 * Since each matchup can return simultaneous, it should return an array of orderings
 *
 * Then what's cool is I could filter through the collection, and join them together,
 * and find the ones that have empty "previous" properties.
 *
 * Then I could even graph them, which is cool.
 *
 * Hmm... not all moves have targets...
 *
 * @param attacker
 * @param target
 * @param ruleset
 */
const matchup = (
  attacker: Player,
  target: Player,
  ruleset: Ruleset
): RoundDag => {
  switch (attacker.action) {
    case MELEE_NATURAL:
      switch (target.action) {
        case MELEE_NATURAL:
          if (ruleset === Ruleset.Sequential) {
            return getSequential(attacker, target);
          } else {
            return getSimultaneous(attacker, target);
          }
        case MELEE_WEAPON:
          /**
           * >"When opponents in melee have tied for initiative, blows (attack routines included) occur simultaneously,
           * except when both opponents are using weapons." (DMG p66)
           *
           * Therefore, WSF is *not* considered for natural vs weapon. (Fists excepted.) You might argue,
           * well if fists are weapons, why aren't natural attacks? The problem is that then natural
           * melee attacks don't even exist, which makes the above quote meaningless. So fists are clearly
           * an exception, in that they have a WSF specifically listed in the PHB, while monster attacks don't.
           */
          if (ruleset === Ruleset.Sequential) {
            return getSequential(attacker, target);
          } else {
            return getSimultaneous(attacker, target);
          }
        case MELEE_MULTI:
        // target acts before and after attacker, depending on #
        // some may be simultaneous - if so, compare WSF if natural weapon is 0, but only if fighting each other
        case CHARGE:
        // check distance to see if it completes. check if anyone else interrupts. This one is complicated.
        // longer reach goes first - what's the reach of a natural attack?
        case MISSILE:
        // regular old sequential works here, since melee can target a missile that is aiming for someone else
        // don't forget dex adjustment if missile user has 12" mvmt
        case MISSILE_MULTI:
        // depends on number. Middle attacks might be simultaneous, or ordered by initiative.
        // don't forget dex adjustment if missile user has 12" mvmt
        case SPELL:
        // Rule two *may* apply. Unclear. Probably not if MDST guideline is followed.
        case TURN:
        default:
          return getSimultaneous(attacker, target);
      }
    case MELEE_WEAPON:
      switch (target.action) {
        case MELEE_NATURAL:
          if (ruleset === Ruleset.Sequential) {
            return getSequential(attacker, target);
          } else {
            return getSimultaneous(attacker, target);
          }
        case MELEE_WEAPON:
        // compare WSF for ties - also check for double/triple attacks for faster weapons
        case MELEE_MULTI:
        // compare WSF for ties - also check for double/triple attacks for faster weapons
        case CHARGE:
        case MISSILE:
        // owsf applies
        // don't forget dex adjustment if missile user has 12" mvmt
        case MISSILE_MULTI:
        // owsf applies
        // don't forget dex adjustment if missile user has 12" mvmt
        case SPELL:
        // owsf applies
        case TURN:
        // owsf applies
        default:
          return getSimultaneous(attacker, target);
      }
    case MELEE_MULTI:
      switch (target.action) {
        case MELEE_NATURAL:
        case MELEE_WEAPON:
        // compare WSF for ties - also check for double/triple attacks for faster weapons
        case MELEE_MULTI:
        // compare WSF for ties - also check for double/triple attacks for faster weapons
        case CHARGE:
        case MISSILE:
        // owsf applies
        // don't forget dex adjustment if missile user has 12" mvmt
        case MISSILE_MULTI:
        // owsf applies
        // don't forget dex adjustment if missile user has 12" mvmt
        case SPELL:
        // owsf applies
        case TURN:
        // owsf applies
        default:
          return getSimultaneous(attacker, target);
      }
    case CHARGE:
      switch (target.action) {
        case MELEE_NATURAL:
        case MELEE_WEAPON:
        case MELEE_MULTI:
        case CHARGE:
        case MISSILE:
        // don't forget dex adjustment if missile user has 12" mvmt (probably irrelevant to charge)
        case MISSILE_MULTI:
        // don't forget dex adjustment if missile user has 12" mvmt (probably irrelevant to charge)
        case SPELL:
        case TURN:
        default:
          return getSimultaneous(attacker, target);
      }
    case MISSILE:
      switch (target.action) {
        case MELEE_NATURAL:
        // don't forget dex adjustment if missile user has 12" mvmt
        case MELEE_WEAPON:
        // wsf may apply - OWFD
        // don't forget dex adjustment if missile user has 12" mvmt
        case MELEE_MULTI:
        // wsf may apply - OWFD
        // don't forget dex adjustment if missile user has 12" mvmt
        case CHARGE:
        // don't forget dex adjustment if missile user has 12" mvmt (probably irrelevant to charge)
        case MISSILE:
        // don't forget dex adjustment if missile user has 12" mvmt
        case MISSILE_MULTI:
          // don't forget dex adjustment if missile user has 12" mvmt
          return getSimultaneous(attacker, target);
        case SPELL:
          // don't forget dex adjustment to init die if missile user has 12" mvmt
          return attackCaster(attacker, target);
        case TURN:
          // don't forget dex adjustment if missile user has 12" mvmt
          return getSimultaneous(attacker, target);
        default:
          return getSimultaneous(attacker, target);
      }
    case MISSILE_MULTI:
      switch (target.action) {
        case MELEE_NATURAL:
        // don't forget dex adjustment if missile user has 12" mvmt
        case MELEE_WEAPON:
        // wsf may apply - OWFD
        // don't forget dex adjustment if missile user has 12" mvmt
        case MELEE_MULTI:
        // wsf may apply - OWFD
        // don't forget dex adjustment if missile user has 12" mvmt
        case CHARGE:
        // don't forget dex adjustment if missile user has 12" mvmt (probably irrelevant to charge)
        case MISSILE:
        // don't forget dex adjustment if missile user has 12" mvmt
        case MISSILE_MULTI:
        // don't forget dex adjustment if missile user has 12" mvmt
        case SPELL:
        // don't forget dex adjustment if missile user has 12" mvmt
        case TURN:
        // don't forget dex adjustment if missile user has 12" mvmt
        default:
          return getSimultaneous(attacker, target);
      }
    case SPELL:
      switch (target.action) {
        case MELEE_NATURAL:
        case MELEE_WEAPON:
        // wsf applies - OWFD
        case MELEE_MULTI:
        // wsf applies - OWFD
        case CHARGE:
          return getSimultaneous(attacker, target);
        case MISSILE:
        // don't forget dex adjustment if missile user has 12" mvmt
        case MISSILE_MULTI:
        // don't forget dex adjustment if missile user has 12" mvmt
        case SPELL:
        case TURN:
        default:
          return getSimultaneous(attacker, target);
      }
    case TURN:
      // Top of DMG p63: if cleric wins initiative, turning takes effect before monsters can respond.
      switch (target.action) {
        case MELEE_NATURAL:
        case MELEE_WEAPON:
        // wsf applies - OWFD
        case MELEE_MULTI:
        // wsf applies - OWFD
        case CHARGE:
        case MISSILE:
        // don't forget dex adjustment if missile user has 12" mvmt
        case MISSILE_MULTI:
        // don't forget dex adjustment if missile user has 12" mvmt
        case SPELL:
        case TURN:
        default:
          return getSimultaneous(attacker, target);
      }
    default:
      return getSimultaneous(attacker, target);
  }
};

export default matchup;

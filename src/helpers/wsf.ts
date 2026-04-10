export const WEAPON_WINS = 1;
export const TIMED_ACTION_WINS = 2;
export const TIMED_ACTION_WEAPON_TIE = 3;
/**
 * Weapon Speed Factor vs Timed Actions: DMG p67, top of page
 *
 * >"The speed factor of a weapon also determines when the weapon strikes
 * during the course of the round with respect to opponents who are
 * engaged in activity other than striking blows. Thus, suppose side A,
 * which has achieved initiative (action) for the round, has a magic-user
 * engaged in casting a spell. Compare the speed factor of the weapon
 * with the number of segments which the spell will require to cast to
 * determine if the spell or the weapon will be cast/strike first,
 * subtracting the losing die roll on the initiative die roll from
 * the weapon factor and treating negative results as positive."
 *
 * Basically, if a timed action wins (or ties) initiative, there's still
 * a chance for the weapon to strike first, due to the duration of the
 * timed action.
 *
 * Note this is purely a relative calculation. It does not give any
 * info on what segment the timed action commences.
 *
 * Note that if this is called with an instant action (actionTime = 0),
 * like anything that takes less than a full segment, then that action
 * will always win. Which is appropriate if attacker loses initiative.
 *
 * Implies that an instant action would always beat WSF during initiative
 * ties.
 *
 * Doesn't make sense to call this function if the attacker *wins*
 * initiative. Beyond the zoomed-out-perspective reasons, examine
 * an initiative result of 6-1. The function returns the same result
 * either way, whether the caster wins or loses initiative. That doesn't
 * make sense that initiative becomes meaningless. But more basically,
 * it means that a caster has just *lost* initiative, the caster is
 * still able to complete the spell, just because they are facing a
 * weapon with a speed factor. Attacker with longsword (5) against
 * a caster with fireball (3). With a roll of 6-1, the defenseless
 * caster can still get the spell of, whether they win or lose initiative.
 *
 * Here's a truism: *If* ruleTwo applies to WSF weapons, *then* casting must not
 * always start on seg-1. In this case, ruleTwo effectively "anchors" the spell
 * casting into some range that must be interrupted if the OWFD rule applies.
 * Which is weird. Part of the reason we conclude ruleTwo does not apply to WSF.
 *
 * @param wsf the weapon speed factor of the weapon wielded by the attacker
 * @param actionTime the duration of the action, e.g. casting time of a spell
 * @param losingDie the number on the die roll of attacker that lost initiative
 */
export const determineWeaponVsTimedAction = (
  wsf: number,
  actionTime: number,
  losingDie: number | null = null
): number => {
  // If combat is simultaneous, there is no modification of the weapon speed factor.
  const adjustedWeaponSpeed = losingDie ? Math.abs(wsf - losingDie) : wsf;

  if (adjustedWeaponSpeed > actionTime) {
    // action concludes before weapon attacks
    return TIMED_ACTION_WINS;
  } else if (adjustedWeaponSpeed === actionTime) {
    // action concludes simultaneously as weapon attack.
    // Note that for a spell caster, this may still imply no dex bonus
    return TIMED_ACTION_WEAPON_TIE;
  } else {
    // weapon attacks during action
    // for a spell caster, no dex bonus, and a hit interrupts spell
    return WEAPON_WINS;
  }
};

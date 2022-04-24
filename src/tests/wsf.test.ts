import {
  determineWeaponVsTimedAction,
  TIMED_ACTION_WEAPON_TIE,
  TIMED_ACTION_WINS,
  WEAPON_WINS,
} from "../helpers/wsf";

describe("wsf", () => {
  /**
   * >"A sword with a factor of 5 (broad or long) is being used by on opponent of a magic-user attempting to cast a
   * fireball spell (3 segment casting time)." (DMG p67)
   */
  test("DMG p67 ex1", () => {
    /**
     * >"If the sword-wielding attacker was represented by a losing initiative die roll of 1, the spell will be cast
     * prior to the sword's blow."
     */
    expect(determineWeaponVsTimedAction(5, 3, 1)).toBe(TIMED_ACTION_WINS);
  });
  test("DMG p67 ex2", () => {
    /**
     * >"A 2 will indicate that the spell and the blow are completed simultaneously."
     */
    expect(determineWeaponVsTimedAction(5, 3, 2)).toBe(TIMED_ACTION_WEAPON_TIE);
  });
  test("DMG p67 ex3", () => {
    /**
     * >"A 3-5 will indicate that the blow has a chance of striking (if o successful "to hit" roll is made) before
     * the spell is cast, arriving either as the spell is begun or during the first segment of its casting."
     *
     * Note there is an error in the DMG for the losing die of 3. In this case, the adjusted weapon speed
     * is 2, which is in the middle of casting, not "as the spell is begun" or "during the first segment
     * of its casting".
     */
    // Adjusted weapon speed is 2, which is in the middle of casting
    expect(determineWeaponVsTimedAction(5, 3, 3)).toBe(WEAPON_WINS);
    // Adjusted weapon speed is 1, which is "during the first segment of its casting"
    expect(determineWeaponVsTimedAction(5, 3, 4)).toBe(WEAPON_WINS);
    // Adjusted weapon speed is 0, which is "as the spell is begun"
    expect(determineWeaponVsTimedAction(5, 3, 5)).toBe(WEAPON_WINS);
  });
  test("DMG p67 ex4", () => {
    /**
     * >"Suppose instead that a dagger were being employed. It has a speed factor of only 2, so it will strike prior
     * to spell completion if the initiative roll which lost was 1-4 (the adjusted segment indicator being 1, 0, 1, 2
     * respectively)..."
     */
    expect(determineWeaponVsTimedAction(2, 3, 1)).toBe(WEAPON_WINS);
    expect(determineWeaponVsTimedAction(2, 3, 2)).toBe(WEAPON_WINS);
    expect(determineWeaponVsTimedAction(2, 3, 3)).toBe(WEAPON_WINS);
    expect(determineWeaponVsTimedAction(2, 3, 4)).toBe(WEAPON_WINS);
    /**
     * >"[...] and simultaneously if the die score was a 5."
     */
    expect(determineWeaponVsTimedAction(2, 3, 5)).toBe(TIMED_ACTION_WEAPON_TIE);
  });
  test("DMG p67 ex5", () => {
    /**
     * >"If the weapon being employed was a two-handed sword (or any other weapon with a speed factor of 10,
     * or 9 for that matter) there would be no chance far the reacting side to strike the spell caster
     * prior to completion of the fireball."
     */
    expect(determineWeaponVsTimedAction(10, 3, 1)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(10, 3, 2)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(10, 3, 3)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(10, 3, 4)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(10, 3, 5)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(9, 3, 1)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(9, 3, 2)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(9, 3, 3)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(9, 3, 4)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(9, 3, 5)).toBe(TIMED_ACTION_WINS);
  });
  test("DMG p67 ex6", () => {
    /**
     * >"Note that even though a spell takes but 1 segment to complete, this is 6 seconds, and during that period
     * a reacting attacker might be able to attack the magic-user or other spell caster prior to actual completion
     * of the spell!"
     */
    // Let's say a short sword, which has speed factor of 3
    expect(determineWeaponVsTimedAction(3, 1, 1)).toBe(TIMED_ACTION_WINS);
    expect(determineWeaponVsTimedAction(3, 1, 2)).toBe(TIMED_ACTION_WEAPON_TIE);
    expect(determineWeaponVsTimedAction(3, 1, 3)).toBe(WEAPON_WINS);
    expect(determineWeaponVsTimedAction(3, 1, 4)).toBe(TIMED_ACTION_WEAPON_TIE);
    expect(determineWeaponVsTimedAction(3, 1, 5)).toBe(TIMED_ACTION_WINS);
  });
});

describe("controversial wsf tests", () => {
  test("umm", () => {
    /**
     * Test case: Fighter attacks magic-user. Fighter attacks with 2H Sword (WSF 10).
     * Magic-User casts Mass Charm, 8 segments. Fighter loses initiative with a roll
     * of 1.
     *
     * Result: The adjusted weapon speed of 9 is greater than the casting time of 8,
     * so the Magic-User is able to get the spell off before the attack happens.
     */
    expect(determineWeaponVsTimedAction(10, 8, 1)).toBe(TIMED_ACTION_WINS);
    /**
     * Note this conflicts with rule #2.
     *
     * EOTB's interpretation is that #2 supersedes this rule. If it's a super
     * long casting time, then he still might be interrupted, even by a 2H sword,
     * since an attack will always come on segments 1-6. This assumes Rule #2
     * applies to weapons with WSF.
     *
     * Nagora's interpretation is that the 2H sword only interrupts an 8-segment
     * spell if it wins initiative or loses with a roll of 3+. Which means rule #2
     * does not supersede the WSF function. This assumes Rule #2 does not apply to
     * weapons with WSF.
     */
    expect(determineWeaponVsTimedAction(10, 8, 2)).toBe(
      TIMED_ACTION_WEAPON_TIE
    );
    expect(determineWeaponVsTimedAction(10, 8, 3)).toBe(WEAPON_WINS);
    expect(determineWeaponVsTimedAction(10, 8, 4)).toBe(WEAPON_WINS);
    expect(determineWeaponVsTimedAction(10, 8, 5)).toBe(WEAPON_WINS);
  });
});

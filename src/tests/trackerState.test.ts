import {
  addCombatant,
  createInitialTrackerState,
  insertRoundAfterActive,
  updateCombatant,
} from "../helpers/trackerState";

describe("tracker state helpers", () => {
  test("new trackers start with matchup cells hidden until a target matters", () => {
    const initialState = createInitialTrackerState();

    expect(initialState.version).toBe(5);
    expect(initialState.rounds[0]?.party).toHaveLength(3);
    expect(initialState.rounds[0]?.enemies).toHaveLength(3);
    expect(initialState.rounds[0]?.cells[0]?.[0]).toEqual({
      enemyToParty: "",
      partyToEnemy: "",
      isVisible: false,
    });
  });

  test("advancing a round carries persistent fields and clears transient ones", () => {
    const initialState = createInitialTrackerState();
    const firstRound = initialState.rounds[0];
    if (!firstRound) {
      throw new Error("Missing first round");
    }

    firstRound.partyInitiative = "4";
    firstRound.enemyInitiative = "5";
    firstRound.summary = "The ankylosaur charges.";

    const firstRow = firstRound.cells[0];
    if (!firstRow) {
      throw new Error("Missing first interaction row");
    }
    const firstCell = firstRow[0];
    if (!firstCell) {
      throw new Error("Missing first interaction cell");
    }
    firstCell.enemyToParty = "xx";
    firstCell.partyToEnemy = "6";

    firstRound.partyStates[0] = {
      hp: "21",
      effect: "hopeless",
      action: "cast",
      result: "interrupted",
      notes: "Bracers of defense",
    };
    firstRound.enemyStates[0] = {
      hp: "20-4=16",
      effect: "turned 3/6",
      action: "advance",
      result: "miss",
      notes: "immune to charm",
    };

    const nextState = insertRoundAfterActive(initialState);
    const nextRound = nextState.rounds[1];
    if (!nextRound) {
      throw new Error("Missing next round");
    }

    const nextRoundFirstRow = nextRound.cells[0];
    if (!nextRoundFirstRow) {
      throw new Error("Missing next round interaction row");
    }

    expect(nextState.activeRound).toBe(1);
    expect(nextRound.party[0]?.maxHp).toBe("");
    expect(nextRound.partyInitiative).toBe("");
    expect(nextRound.enemyInitiative).toBe("");
    expect(nextRound.summary).toBe("");
    expect(nextRoundFirstRow[0]).toEqual({
      enemyToParty: "",
      partyToEnemy: "",
      isVisible: true,
    });
    expect(nextRoundFirstRow[1]).toEqual({
      enemyToParty: "",
      partyToEnemy: "",
      isVisible: false,
    });
    expect(nextRound.partyStates[0]).toEqual({
      hp: "21",
      effect: "hopeless",
      action: "",
      result: "",
      notes: "Bracers of defense",
    });
    expect(nextRound.enemyStates[0]).toEqual({
      hp: "20-4=16",
      effect: "turned 3/6",
      action: "",
      result: "",
      notes: "immune to charm",
    });
  });

  test("adding a party combatant expands each round consistently", () => {
    const initialState = createInitialTrackerState();
    const nextState = addCombatant(initialState, "party", 99);
    const nextRound = nextState.rounds[0];
    const previousRound = initialState.rounds[0];
    if (!nextRound || !previousRound) {
      throw new Error("Missing round data");
    }
    const nextRow = nextRound.cells[0];
    const previousRow = previousRound.cells[0];
    if (!nextRow || !previousRow) {
      throw new Error("Missing interaction row");
    }
    const addedPartyState = nextRound.partyStates[nextRound.partyStates.length - 1];

    expect(nextRound.party).toHaveLength(previousRound.party.length + 1);
    expect(previousRound.party).toHaveLength(initialState.rounds[0]?.party.length || 0);
    expect(nextRound.partyStates).toHaveLength(previousRound.partyStates.length + 1);
    expect(nextRow).toHaveLength(previousRow.length + 1);
    expect(addedPartyState?.hp).toBe("");
    expect(nextRow[nextRow.length - 1]).toEqual({
      enemyToParty: "",
      partyToEnemy: "",
      isVisible: false,
    });
  });

  test("updating max hp refreshes blank round hp values without overwriting custom values", () => {
    const initialState = createInitialTrackerState();
    const firstRound = initialState.rounds[0];
    const currentCombatant = firstRound?.party[0];
    if (!currentCombatant || !firstRound) {
      throw new Error("Missing initial tracker data");
    }
    const firstPartyState = firstRound.partyStates[0];
    if (!firstPartyState) {
      throw new Error("Missing first party round state");
    }
    firstPartyState.hp = "";
    firstRound.party[0] = {
      ...currentCombatant,
      maxHp: "",
    };
    initialState.rounds.push({
      party: firstRound.party.map((combatant) => ({
        ...combatant,
      })),
      enemies: firstRound.enemies.map((combatant) => ({
        ...combatant,
      })),
      partyInitiative: firstRound.partyInitiative,
      enemyInitiative: firstRound.enemyInitiative,
      summary: firstRound.summary,
      cells: firstRound.cells.map((row) =>
        row.map((cell) => ({
          ...cell,
        }))
      ),
      partyStates: firstRound.partyStates.map((state, index) =>
        index === 0 ? { ...state, hp: "17" } : { ...state }
      ),
      enemyStates: firstRound.enemyStates.map((state) => ({
        ...state,
      })),
    });

    const nextState = updateCombatant(initialState, "party", 0, {
      ...currentCombatant,
      maxHp: "24",
    });

    const updatedFirstRound = nextState.rounds[0];
    const updatedSecondRound = nextState.rounds[1];
    if (!updatedFirstRound || !updatedSecondRound) {
      throw new Error("Missing updated rounds");
    }

    expect(updatedFirstRound.party[0]?.maxHp).toBe("24");
    expect(updatedSecondRound.party[0]?.maxHp).toBe("");
    expect(updatedFirstRound.partyStates[0]?.hp).toBe("24");
    expect(updatedSecondRound.partyStates[0]?.hp).toBe("17");
  });

  test("changing combatant metadata in a later round does not mutate previous rounds", () => {
    const initialState = createInitialTrackerState();
    const roundTwoState = insertRoundAfterActive(initialState);
    roundTwoState.activeRound = 1;

    const roundOneCombatant = roundTwoState.rounds[0]?.enemies[0];
    const roundTwoCombatant = roundTwoState.rounds[1]?.enemies[0];
    if (!roundOneCombatant || !roundTwoCombatant) {
      throw new Error("Missing combatants");
    }

    const updated = updateCombatant(roundTwoState, "enemy", 0, {
      ...roundTwoCombatant,
      weapon: 12,
    });

    expect(updated.rounds[0]?.enemies[0]?.weapon).toBe(roundOneCombatant.weapon);
    expect(updated.rounds[1]?.enemies[0]?.weapon).toBe(12);
  });

  test("adding a combatant in a later round does not mutate previous rounds", () => {
    const initialState = createInitialTrackerState();
    const roundTwoState = insertRoundAfterActive(initialState);
    roundTwoState.activeRound = 1;

    const updated = addCombatant(roundTwoState, "enemy", 99);

    expect(updated.rounds[0]?.enemies).toHaveLength(3);
    expect(updated.rounds[1]?.enemies).toHaveLength(4);
  });
});

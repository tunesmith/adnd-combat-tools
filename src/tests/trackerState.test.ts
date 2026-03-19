import {
  addCombatant,
  createInitialTrackerState,
  insertRoundAfterActive,
  updateCombatant,
} from "../helpers/trackerState";

describe("tracker state helpers", () => {
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
    expect(nextState.party[0]?.maxHp).toBe("");
    expect(nextRound.partyInitiative).toBe("");
    expect(nextRound.enemyInitiative).toBe("");
    expect(nextRound.summary).toBe("");
    expect(nextRoundFirstRow[0]).toEqual({
      enemyToParty: "",
      partyToEnemy: "",
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

    expect(nextState.party).toHaveLength(initialState.party.length + 1);
    expect(nextRound.partyStates).toHaveLength(previousRound.partyStates.length + 1);
    expect(nextRow).toHaveLength(previousRow.length + 1);
    expect(addedPartyState?.hp).toBe("");
  });

  test("updating max hp refreshes blank round hp values without overwriting custom values", () => {
    const initialState = createInitialTrackerState();
    const currentCombatant = initialState.party[0];
    const firstRound = initialState.rounds[0];
    if (!currentCombatant || !firstRound) {
      throw new Error("Missing initial tracker data");
    }
    const firstPartyState = firstRound.partyStates[0];
    if (!firstPartyState) {
      throw new Error("Missing first party round state");
    }
    firstPartyState.hp = "";
    initialState.party[0] = {
      ...currentCombatant,
      maxHp: "",
    };
    initialState.rounds.push({
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

    expect(nextState.party[0]?.maxHp).toBe("24");
    expect(updatedFirstRound.partyStates[0]?.hp).toBe("24");
    expect(updatedSecondRound.partyStates[0]?.hp).toBe("17");
  });
});

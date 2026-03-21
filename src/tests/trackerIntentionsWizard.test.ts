import { createInitialTrackerState } from "../helpers/trackerState";
import {
  buildIntentionWizardEntries,
  toggleIntentionWizardEntryTarget,
} from "../helpers/trackerIntentionsWizard";

describe("tracker intentions wizard helpers", () => {
  test("builds enemy-first wizard entries from current round state", () => {
    const state = createInitialTrackerState();
    const round = state.rounds[0];

    if (!round) {
      throw new Error("Missing tracker round");
    }
    const enemyZero = round.enemies[0];
    const partyZero = round.party[0];
    const enemyZeroState = round.enemyStates[0];
    const partyZeroState = round.partyStates[0];
    if (!enemyZero || !partyZero || !enemyZeroState || !partyZeroState) {
      throw new Error("Missing initial combatants");
    }

    enemyZero.name = "Ghoul";
    partyZero.name = "Lodi";
    enemyZeroState.action = "advance";
    partyZeroState.action = "shoot bow";
    const firstEnemyRow = round.cells[0];
    const secondEnemyRow = round.cells[1];
    if (!firstEnemyRow || !secondEnemyRow || !firstEnemyRow[0] || !secondEnemyRow[0]) {
      throw new Error("Missing matchup cells");
    }
    firstEnemyRow[0] = {
      ...firstEnemyRow[0],
      enemyToPartyVisible: true,
      enemyToParty: "xx",
    };
    secondEnemyRow[0] = {
      ...secondEnemyRow[0],
      partyToEnemyVisible: true,
      partyToEnemy: "7",
    };

    const entries = buildIntentionWizardEntries(round);

    expect(entries).toHaveLength(6);
    expect(entries[0]).toMatchObject({
      side: "enemy",
      combatantName: "Ghoul",
      intention: "advance",
    });
    expect(entries[0]?.targetOptions[0]).toEqual({
      targetIndex: 0,
      targetKey: round.party[0]?.key,
      targetName: "Lodi",
      selected: true,
      lockedOpen: true,
    });
    expect(entries[3]).toMatchObject({
      side: "party",
      combatantName: "Lodi",
      intention: "shoot bow",
    });
    expect(entries[3]?.targetOptions[1]).toEqual({
      targetIndex: 1,
      targetKey: round.enemies[1]?.key,
      targetName: round.enemies[1]?.name || "Enemy 2",
      selected: true,
      lockedOpen: true,
    });
  });

  test("toggling an enemy target returns the correct visibility change", () => {
    const state = createInitialTrackerState();
    const round = state.rounds[0];

    if (!round) {
      throw new Error("Missing tracker round");
    }

    const entry = buildIntentionWizardEntries(round)[0];

    if (!entry) {
      throw new Error("Missing enemy wizard entry");
    }

    const { nextEntry, visibilityChange } = toggleIntentionWizardEntryTarget(
      entry,
      1
    );

    expect(nextEntry.targetOptions[1]?.selected).toBe(true);
    expect(visibilityChange).toEqual({
      rowIndex: 0,
      columnIndex: 1,
      field: "enemyToPartyVisible",
      value: true,
    });
  });

  test("locked targets stay open, and party targeting maps to party-to-enemy visibility", () => {
    const state = createInitialTrackerState();
    const round = state.rounds[0];

    if (!round) {
      throw new Error("Missing tracker round");
    }

    const firstEnemyRow = round.cells[0];
    if (!firstEnemyRow || !firstEnemyRow[0]) {
      throw new Error("Missing matchup cell");
    }

    firstEnemyRow[0] = {
      ...firstEnemyRow[0],
      enemyToPartyVisible: true,
      enemyToParty: "xx",
    };

    const entries = buildIntentionWizardEntries(round);
    const enemyEntry = entries[0];
    const partyEntry = entries[3];

    if (!enemyEntry || !partyEntry) {
      throw new Error("Missing wizard entries");
    }

    const lockedToggle = toggleIntentionWizardEntryTarget(enemyEntry, 0);
    const partyToggle = toggleIntentionWizardEntryTarget(partyEntry, 2);

    expect(lockedToggle.nextEntry).toBe(enemyEntry);
    expect(lockedToggle.visibilityChange).toBeUndefined();
    expect(partyToggle.nextEntry.targetOptions[2]?.selected).toBe(true);
    expect(partyToggle.visibilityChange).toEqual({
      rowIndex: 2,
      columnIndex: 0,
      field: "partyToEnemyVisible",
      value: true,
    });
  });
});

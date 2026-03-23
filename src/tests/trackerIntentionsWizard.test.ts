import { createInitialTrackerState } from "../helpers/trackerState";
import {
  buildIntentionWizardEntries,
  replaceIntentionWizardEntry,
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

    const entries = buildIntentionWizardEntries(round);

    expect(entries).toHaveLength(6);
    expect(entries[0]).toMatchObject({
      side: "enemy",
      index: 0,
      combatantKey: enemyZero.key,
      combatantName: "Ghoul",
      intention: "advance",
    });
    expect(entries[3]).toMatchObject({
      side: "party",
      index: 0,
      combatantKey: partyZero.key,
      combatantName: "Lodi",
      intention: "shoot bow",
    });
  });

  test("replacing a wizard entry updates only the targeted entry", () => {
    const state = createInitialTrackerState();
    const round = state.rounds[0];

    if (!round) {
      throw new Error("Missing tracker round");
    }

    const entries = buildIntentionWizardEntries(round);
    const originalFirstEntry = entries[0];
    const secondEntry = entries[1];

    if (!originalFirstEntry || !secondEntry) {
      throw new Error("Missing wizard entries");
    }

    const updatedFirstEntry = {
      ...originalFirstEntry,
      intention: "cast sleep",
    };
    const nextEntries = replaceIntentionWizardEntry(entries, 0, updatedFirstEntry);

    expect(nextEntries[0]).toEqual(updatedFirstEntry);
    expect(nextEntries[1]).toBe(secondEntry);
    expect(entries[0]).toEqual(originalFirstEntry);
  });
});

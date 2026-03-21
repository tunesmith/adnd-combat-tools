import { deflate } from "zlib";
import {
  decodeTrackerState,
  encodeTrackerState,
  transformTrackerState,
} from "../helpers/trackerCodec";
import type { TrackerStateV2, TrackerStateV5 } from "../types/tracker";

const encodeLegacyState = (value: unknown): Promise<string> =>
  new Promise((resolve, reject) => {
    deflate(JSON.stringify(value), (error, buffer) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(encodeURIComponent(buffer.toString("base64")));
    });
  });

describe("tracker codec", () => {
  test("migrates version 2 tracker state into round-snapshot shape", () => {
    const legacyState: TrackerStateV2 = {
      version: 2,
      party: [
        {
          key: 1,
          name: "Lodi",
          class: 1,
          level: 7,
          armorType: 10,
          armorClass: -1,
          weapon: 12,
          maxHp: "",
        },
      ],
      enemies: [
        {
          key: 2,
          name: "Ghoul",
          class: 10,
          level: 3,
          armorType: 1,
          armorClass: 6,
          weapon: 0,
          maxHp: "",
        },
      ],
      rounds: [
        {
          partyInitiative: "4",
          enemyInitiative: "5",
          summary: "The ghoul lunges first.",
          cells: [[{ enemyToParty: "xx", partyToEnemy: "16" }]],
          partyStates: [
            {
              maxHp: "19",
              hp: "",
              effect: "",
              action: "attack",
              result: "",
              notes: "",
            },
          ],
          enemyStates: [
            {
              maxHp: "11",
              hp: "7",
              effect: "slowed",
              action: "",
              result: "",
              notes: "",
            },
          ],
        },
      ],
      activeRound: 0,
    };

    const migrated = transformTrackerState(legacyState);

    expect(migrated.version).toBe(6);
    expect(migrated.rounds[0]?.party[0]?.maxHp).toBe("19");
    expect(migrated.rounds[0]?.enemies[0]?.maxHp).toBe("11");
    expect(migrated.rounds[0]?.cells[0]?.[0]).toEqual({
      enemyToParty: "xx",
      partyToEnemy: "16",
      enemyToPartyVisible: true,
      partyToEnemyVisible: true,
    });
    expect(migrated.rounds[0]?.partyStates[0]).toEqual({
      hp: "19",
      effect: "",
      action: "attack",
      result: "",
      notes: "",
    });
    expect(migrated.rounds[0]?.enemyStates[0]).toEqual({
      hp: "7",
      effect: "slowed",
      action: "",
      result: "",
      notes: "",
    });
  });

  test("decodes legacy encoded tracker state through the shared migration path", async () => {
    const encodedState = await encodeLegacyState({
      version: 2,
      party: [
        {
          key: 1,
          name: "Azalia",
          class: 8,
          level: 6,
          armorType: 2,
          armorClass: -4,
          weapon: 17,
          maxHp: "",
        },
      ],
      enemies: [
        {
          key: 2,
          name: "Gnoll",
          class: 10,
          level: 1,
          armorType: 5,
          armorClass: 5,
          weapon: 15,
          maxHp: "8",
        },
      ],
      rounds: [
        {
          partyInitiative: "",
          enemyInitiative: "",
          summary: "",
          cells: [[{ enemyToParty: "", partyToEnemy: "dead" }]],
          partyStates: [
            {
              maxHp: "14",
              hp: "9",
              effect: "hopeful",
              action: "",
              result: "",
              notes: "",
            },
          ],
          enemyStates: [
            {
              maxHp: "",
              hp: "",
              effect: "",
              action: "",
              result: "",
              notes: "",
            },
          ],
        },
      ],
      activeRound: 0,
    } as TrackerStateV2);

    const decoded = await decodeTrackerState(encodedState);

    expect(decoded.version).toBe(6);
    expect(decoded.rounds[0]?.party[0]?.maxHp).toBe("14");
    expect(decoded.rounds[0]?.enemies[0]?.maxHp).toBe("8");
    expect(decoded.rounds[0]?.cells[0]?.[0]).toEqual({
      enemyToParty: "",
      partyToEnemy: "dead",
      enemyToPartyVisible: true,
      partyToEnemyVisible: true,
    });
  });

  test("migrates version 5 per-cell visibility to independent half visibility", () => {
    const versionFiveState: TrackerStateV5 = {
      version: 5,
      rounds: [
        {
          party: [
            {
              key: 1,
              name: "Lodi",
              class: 1,
              level: 7,
              armorType: 10,
              armorClass: -1,
              weapon: 12,
              maxHp: "19",
            },
          ],
          enemies: [
            {
              key: 2,
              name: "Ghoul",
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 0,
              maxHp: "11",
            },
          ],
          partyInitiative: "4",
          enemyInitiative: "5",
          summary: "",
          cells: [[{ enemyToParty: "xx", partyToEnemy: "", isVisible: true }]],
          partyStates: [
            {
              hp: "19",
              effect: "",
              action: "",
              result: "",
              notes: "",
            },
          ],
          enemyStates: [
            {
              hp: "11",
              effect: "",
              action: "",
              result: "",
              notes: "",
            },
          ],
        },
      ],
      activeRound: 0,
    };

    const migrated = transformTrackerState(versionFiveState);

    expect(migrated.version).toBe(6);
    expect(migrated.rounds[0]?.cells[0]?.[0]).toEqual({
      enemyToParty: "xx",
      partyToEnemy: "",
      enemyToPartyVisible: true,
      partyToEnemyVisible: true,
    });
  });

  test("roundtrips current-version tracker titles through the codec", async () => {
    const encoded = await encodeTrackerState({
      version: 6,
      title: "Assault on the Shrine",
      rounds: [
        {
          party: [
            {
              key: 1,
              name: "Lodi",
              class: 1,
              level: 7,
              armorType: 10,
              armorClass: -1,
              weapon: 12,
              maxHp: "19",
            },
          ],
          enemies: [
            {
              key: 2,
              name: "Ghoul",
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 0,
              maxHp: "11",
            },
          ],
          partyInitiative: "4",
          enemyInitiative: "5",
          summary: "",
          cells: [[{
            enemyToParty: "xx",
            partyToEnemy: "",
            enemyToPartyVisible: true,
            partyToEnemyVisible: false,
          }]],
          partyStates: [
            {
              hp: "19",
              effect: "",
              action: "shoot bow",
              result: "",
              notes: "",
            },
          ],
          enemyStates: [
            {
              hp: "11",
              effect: "",
              action: "advance",
              result: "",
              notes: "",
            },
          ],
        },
      ],
      activeRound: 0,
    });

    const decoded = await decodeTrackerState(encoded);

    expect(decoded.title).toBe("Assault on the Shrine");
    expect(decoded.rounds[0]?.partyStates[0]?.action).toBe("shoot bow");
  });
});

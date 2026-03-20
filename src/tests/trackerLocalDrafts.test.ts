import {
  deleteTrackerLocalDraft,
  getOrCreateTrackerSessionDraftId,
  getTrackerLocalDraft,
  listTrackerLocalDrafts,
  saveTrackerLocalDraft,
  setTrackerSessionDraftId,
  type StorageLike,
} from "../helpers/trackerLocalDrafts";
import type { TrackerState } from "../types/tracker";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) || null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const createTrackerState = (label: string, activeRound: number): TrackerState => {
  const rounds = Array.from({ length: activeRound + 1 }, () => ({
    party: [
      {
        key: 1,
        name: `${label} Party`,
        class: 1,
        level: 5,
        armorType: 10,
        armorClass: 0,
        weapon: 12,
        maxHp: "21",
      },
    ],
    enemies: [
      {
        key: 2,
        name: `${label} Enemy`,
        class: 10,
        level: 3,
        armorType: 5,
        armorClass: 5,
        weapon: 0,
        maxHp: "8",
      },
    ],
    partyInitiative: "",
    enemyInitiative: "",
    summary: "",
    cells: [[{ enemyToParty: "", partyToEnemy: "", isVisible: false }]],
    partyStates: [
      {
        hp: "21",
        effect: "",
        action: "",
        result: "",
        notes: "",
      },
    ],
    enemyStates: [
      {
        hp: "8",
        effect: "",
        action: "",
        result: "",
        notes: "",
      },
    ],
  }));

  return {
    version: 5,
    rounds,
    activeRound,
  };
};

describe("tracker local drafts", () => {
  test("creates a stable session draft id once one exists", () => {
    const storage = new MemoryStorage();
    const firstId = getOrCreateTrackerSessionDraftId(storage);
    const secondId = getOrCreateTrackerSessionDraftId(storage);

    expect(firstId).toBe(secondId);
  });

  test("saves and lists tracker drafts with preview metadata", () => {
    const storage = new MemoryStorage();
    const firstState = createTrackerState("First", 0);
    const secondState = createTrackerState("Second", 3);

    saveTrackerLocalDraft(storage, "draft-1", "encoded-1", firstState);
    const drafts = saveTrackerLocalDraft(storage, "draft-2", "encoded-2", secondState);

    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.id).toBe("draft-2");
    expect(drafts[0]?.roundNumber).toBe(4);
    expect(drafts[0]?.partyNames).toEqual(["Second Party"]);
    expect(getTrackerLocalDraft(storage, "draft-1")?.encodedState).toBe("encoded-1");
    expect(listTrackerLocalDrafts(storage).map((draft) => draft.id)).toEqual([
      "draft-2",
      "draft-1",
    ]);
  });

  test("deletes a draft without disturbing the others", () => {
    const storage = new MemoryStorage();
    saveTrackerLocalDraft(storage, "draft-1", "encoded-1", createTrackerState("One", 0));
    saveTrackerLocalDraft(storage, "draft-2", "encoded-2", createTrackerState("Two", 1));
    setTrackerSessionDraftId(storage, "draft-2");

    const remainingDrafts = deleteTrackerLocalDraft(storage, "draft-1");

    expect(remainingDrafts.map((draft) => draft.id)).toEqual(["draft-2"]);
    expect(getTrackerLocalDraft(storage, "draft-1")).toBeUndefined();
    expect(getOrCreateTrackerSessionDraftId(storage)).toBe("draft-2");
  });
});

import type { TrackerState } from "../types/tracker";

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface TrackerLocalDraftRecord {
  id: string;
  encodedState: string;
  updatedAt: number;
  roundNumber: number;
  partyNames: string[];
  enemyNames: string[];
}

interface TrackerLocalDraftStore {
  version: 1;
  drafts: TrackerLocalDraftRecord[];
}

const TRACKER_LOCAL_DRAFT_STORAGE_KEY = "adnd-combat-tools/tracker-local-drafts";
export const TRACKER_SESSION_DRAFT_ID_KEY =
  "adnd-combat-tools/tracker-session-draft-id";
const TRACKER_LOCAL_DRAFT_LIMIT = 12;

const createEmptyStore = (): TrackerLocalDraftStore => ({
  version: 1,
  drafts: [],
});

const parseStore = (rawValue: string | null): TrackerLocalDraftStore => {
  if (!rawValue) {
    return createEmptyStore();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<TrackerLocalDraftStore>;
    if (parsed.version !== 1 || !Array.isArray(parsed.drafts)) {
      return createEmptyStore();
    }

    return {
      version: 1,
      drafts: parsed.drafts
        .filter(
          (draft): draft is TrackerLocalDraftRecord =>
            Boolean(
              draft &&
                typeof draft.id === "string" &&
                typeof draft.encodedState === "string" &&
                typeof draft.updatedAt === "number" &&
                typeof draft.roundNumber === "number" &&
                Array.isArray(draft.partyNames) &&
                Array.isArray(draft.enemyNames)
            )
        )
        .sort((left, right) => right.updatedAt - left.updatedAt),
    };
  } catch (_error) {
    return createEmptyStore();
  }
};

const writeStore = (
  storage: StorageLike,
  drafts: TrackerLocalDraftRecord[]
): TrackerLocalDraftRecord[] => {
  const nextDrafts = drafts.slice(0, TRACKER_LOCAL_DRAFT_LIMIT);
  const nextStore: TrackerLocalDraftStore = {
    version: 1,
    drafts: nextDrafts,
  };

  storage.setItem(
    TRACKER_LOCAL_DRAFT_STORAGE_KEY,
    JSON.stringify(nextStore)
  );
  return nextDrafts;
};

const readStore = (storage: StorageLike): TrackerLocalDraftStore =>
  parseStore(storage.getItem(TRACKER_LOCAL_DRAFT_STORAGE_KEY));

export const listTrackerLocalDrafts = (
  storage: StorageLike
): TrackerLocalDraftRecord[] => readStore(storage).drafts;

export const getTrackerLocalDraft = (
  storage: StorageLike,
  draftId: string
): TrackerLocalDraftRecord | undefined =>
  listTrackerLocalDrafts(storage).find((draft) => draft.id === draftId);

export const saveTrackerLocalDraft = (
  storage: StorageLike,
  draftId: string,
  encodedState: string,
  state: TrackerState
): TrackerLocalDraftRecord[] => {
  const nextDraft: TrackerLocalDraftRecord = {
    id: draftId,
    encodedState,
    updatedAt: Date.now(),
    roundNumber: state.activeRound + 1,
    partyNames: state.party.map((combatant) => combatant.name || "Unnamed"),
    enemyNames: state.enemies.map((combatant) => combatant.name || "Unnamed"),
  };

  const drafts = listTrackerLocalDrafts(storage).filter(
    (draft) => draft.id !== draftId
  );

  drafts.unshift(nextDraft);
  return writeStore(storage, drafts);
};

export const deleteTrackerLocalDraft = (
  storage: StorageLike,
  draftId: string
): TrackerLocalDraftRecord[] => {
  const remainingDrafts = listTrackerLocalDrafts(storage).filter(
    (draft) => draft.id !== draftId
  );

  if (remainingDrafts.length === 0) {
    storage.removeItem(TRACKER_LOCAL_DRAFT_STORAGE_KEY);
    return [];
  }

  return writeStore(storage, remainingDrafts);
};

const generateDraftId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `tracker-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getOrCreateTrackerSessionDraftId = (
  storage: StorageLike
): string => {
  const existingId = storage.getItem(TRACKER_SESSION_DRAFT_ID_KEY);
  if (existingId) {
    return existingId;
  }

  const nextId = generateDraftId();
  storage.setItem(TRACKER_SESSION_DRAFT_ID_KEY, nextId);
  return nextId;
};

export const setTrackerSessionDraftId = (
  storage: StorageLike,
  draftId: string
) => {
  storage.setItem(TRACKER_SESSION_DRAFT_ID_KEY, draftId);
};

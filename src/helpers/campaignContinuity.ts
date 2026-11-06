import { carriedPartyProfiles, profilesInSession } from './campaignParty';
import { sha256 } from 'js-sha256';
import { canonical } from './campaignSnapshots';
import { captureCombatCheckpoint } from './campaignWorkingCombat';
import { captureInventoryCheckpoint } from './campaignWorkingInventory';
import type { CampaignDocument } from './campaignDocument';
import type { SessionContinuation } from './campaignContinuityModel';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export interface NextSessionRequest {
  campaignId: string;
  sourceSessionId: string;
  sourceFingerprint: string;
  destinationId: string;
  label: string;
  combats: { sourceId: string; instanceId: string; checkpointId: string }[];
  inventory: {
    sourceId: string;
    instanceId: string;
    checkpointId: string;
  } | null;
  copyNotes: boolean;
  partyCharacterIds?: string[];
  capturedAt: string;
}
function sourceContext(doc: CampaignDocument, id: string) {
  const session = doc.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Source session no longer exists.');
  return {
    session,
    records: doc.records,
    combats: doc.workingCombats.filter((c) => c.sessionId === id),
    inventory: doc.workingInventories.filter((w) => w.sessionId === id),
    selected: doc.workspace.combatSelections?.[id] || null,
    ...(doc.party
      ? { party: profilesInSession(doc, id), roster: doc.party.roster }
      : {}),
  };
}
export function sessionFingerprint(doc: CampaignDocument, id: string) {
  return sha256(canonical(sourceContext(doc, id)));
}
function requestFingerprint(
  destinationId: string,
  label: string,
  origin: Omit<SessionContinuation, 'requestFingerprint'>
) {
  return sha256(canonical({ destinationId, label, ...origin }));
}
export function startNextSession(
  doc: CampaignDocument,
  request: NextSessionRequest
): CampaignDocument {
  if (doc.id !== request.campaignId)
    throw new Error('Campaign changed; reopen Start next session.');
  const label = request.label.trim();
  if (!label || label.length > 1000)
    throw new Error('Enter a session label (up to 1000 characters).');
  const origin = {
    sourceSessionId: request.sourceSessionId,
    sourceFingerprint: request.sourceFingerprint,
    combatInstanceIds: request.combats.map((c) => c.sourceId),
    inventoryId: request.inventory?.sourceId || null,
    copyNotes: request.copyNotes,
    ...(request.partyCharacterIds?.length
      ? { partyCharacterIds: request.partyCharacterIds }
      : {}),
  };
  const fingerprint = requestFingerprint(request.destinationId, label, origin);
  const existing = doc.sessions.find((s) => s.id === request.destinationId);
  if (existing) {
    if (existing.continuation?.requestFingerprint === fingerprint) return doc;
    throw new Error(
      'Destination session already exists; nothing was replaced.'
    );
  }
  if (
    sessionFingerprint(doc, request.sourceSessionId) !==
    request.sourceFingerprint
  )
    throw new Error(
      'Source session changed. Cancel and review fresh carry-over choices.'
    );
  if (new Set(origin.combatInstanceIds).size !== request.combats.length)
    throw new Error('An encounter was selected more than once.');
  const source = doc.sessions.find((s) => s.id === request.sourceSessionId);
  if (!source) throw new Error('Source session missing.');
  let next: CampaignDocument = {
    ...doc,
    sessions: [
      ...doc.sessions,
      {
        id: request.destinationId,
        label,
        notes: request.copyNotes ? source.notes || '' : '',
        continuation: { ...origin, requestFingerprint: fingerprint },
      },
    ],
  };
  for (const choice of request.combats) {
    const combat = doc.workingCombats.find(
      (c) =>
        c.id === choice.sourceId && c.sessionId === source.id && !c.removedAt
    );
    if (!combat) throw new Error('Selected source encounter is missing.');
    next = captureCombatCheckpoint(
      next,
      combat.id,
      `Before continuing to ${label}`,
      choice.checkpointId,
      request.capturedAt
    );
    next = {
      ...next,
      workingCombats: [
        ...next.workingCombats,
        {
          ...clone(combat),
          id: choice.instanceId,
          sessionId: request.destinationId,
          generation: 0,
          origin: { kind: 'checkpoint', checkpointId: choice.checkpointId },
          continuedFrom: {
            sessionId: source.id,
            instanceId: combat.id,
            checkpointId: choice.checkpointId,
          },
        },
      ],
    };
  }
  if (request.inventory) {
    const choice = request.inventory,
      inventory = doc.workingInventories.find(
        (w) => w.id === choice.sourceId && w.sessionId === source.id
      );
    if (!inventory)
      throw new Error('Source session has no selected current inventory.');
    next = captureInventoryCheckpoint(
      next,
      inventory.id,
      `Before continuing to ${label}`,
      choice.checkpointId,
      request.capturedAt
    );
    next = {
      ...next,
      workingInventories: [
        ...next.workingInventories,
        {
          ...clone(inventory),
          id: choice.instanceId,
          sessionId: request.destinationId,
          origin: { kind: 'checkpoint', checkpointId: choice.checkpointId },
          continuedFrom: {
            sessionId: source.id,
            instanceId: inventory.id,
            checkpointId: choice.checkpointId,
          },
        },
      ],
    };
  }
  if (request.partyCharacterIds?.length && doc.party) {
    const carried = carriedPartyProfiles(
      doc,
      source.id,
      request.destinationId,
      request.partyCharacterIds
    );
    next = {
      ...next,
      party: {
        ...doc.party,
        profiles: [...doc.party.profiles, ...carried],
      },
    };
  }
  const selected =
    request.combats.find(
      (c) => c.sourceId === doc.workspace.combatSelections?.[source.id]
    ) || request.combats[0];
  return {
    ...next,
    workspace: {
      ...doc.workspace,
      sessionId: request.destinationId,
      view: 'session',
      combatSelections: {
        ...doc.workspace.combatSelections,
        ...(selected ? { [request.destinationId]: selected.instanceId } : {}),
      },
    },
  };
}
export function validateContinuationReferences(doc: CampaignDocument) {
  const associations = new Set<string>();
  for (const c of doc.workingCombats) {
    const association = canonical([c.sessionId, c.encounterId]);
    if (associations.has(association))
      throw new Error(
        'An encounter has duplicate working instances in one session.'
      );
    associations.add(association);
    if (!c.continuedFrom) {
      if (c.encounterId !== c.id)
        throw new Error('Logical encounter requires continuation provenance.');
      continue;
    }
    const from = c.continuedFrom,
      source = doc.workingCombats.find(
        (w) => w.id === from.instanceId && w.sessionId === from.sessionId
      ),
      checkpoint = doc.combatCheckpoints.find(
        (p) =>
          p.id === from.checkpointId &&
          p.combatId === from.instanceId &&
          p.sessionId === from.sessionId
      );
    if (
      !source ||
      !checkpoint ||
      source.encounterId !== c.encounterId ||
      source.sessionId === c.sessionId
    )
      throw new Error('Invalid encounter continuation lineage.');
    const visited = new Set([c.id]);
    let ancestor = source;
    while (ancestor) {
      if (visited.has(ancestor.id))
        throw new Error('Cyclic encounter continuation.');
      visited.add(ancestor.id);
      const parent = ancestor.continuedFrom;
      if (!parent) break;
      const found = doc.workingCombats.find((w) => w.id === parent.instanceId);
      if (!found) throw new Error('Missing continuation ancestor.');
      ancestor = found;
    }
  }
  for (const w of doc.workingInventories) {
    if (!w.continuedFrom) continue;
    const from = w.continuedFrom;
    if (
      from.sessionId === w.sessionId ||
      !doc.inventoryCheckpoints.some(
        (c) =>
          c.id === from.checkpointId &&
          c.workingId === from.instanceId &&
          c.sessionId === from.sessionId
      )
    )
      throw new Error('Invalid inventory continuation lineage.');
  }
  for (const s of doc.sessions) {
    const visited = new Set<string>([s.id]);
    let parent = s.continuation?.sourceSessionId;
    while (parent) {
      if (visited.has(parent)) throw new Error('Cyclic session continuation.');
      visited.add(parent);
      parent = doc.sessions.find((p) => p.id === parent)?.continuation
        ?.sourceSessionId;
    }
    const from = s.continuation;
    if (!from) continue;
    if (
      s.id === from.sourceSessionId ||
      !doc.sessions.some((p) => p.id === from.sourceSessionId) ||
      new Set(from.combatInstanceIds).size !== from.combatInstanceIds.length ||
      from.combatInstanceIds.some(
        (id) =>
          !doc.workingCombats.some(
            (c) => c.id === id && c.sessionId === from.sourceSessionId
          )
      )
    )
      throw new Error('Invalid session continuation source.');
    if (
      from.inventoryId &&
      !doc.inventoryCheckpoints.some(
        (c) =>
          c.workingId === from.inventoryId &&
          c.sessionId === from.sourceSessionId
      )
    )
      throw new Error('Missing inventory carry-forward checkpoint.');
  }
}
/** Native and renderer transition checks: instances cannot be moved, and initial copies must be exact. */
export function validateContinuityTransition(
  old: CampaignDocument,
  next: CampaignDocument
) {
  for (const s of old.sessions) {
    const current = next.sessions.find((n) => n.id === s.id);
    if (
      current &&
      canonical(current.continuation) !== canonical(s.continuation)
    )
      throw new Error('Session continuation provenance is immutable.');
  }
  for (const w of old.workingInventories) {
    const current = next.workingInventories.find((n) => n.id === w.id);
    if (
      current &&
      (current.sessionId !== w.sessionId ||
        canonical(current.continuedFrom) !== canonical(w.continuedFrom))
    )
      throw new Error('Inventory instance association is immutable.');
  }
  for (const c of old.workingCombats) {
    const current = next.workingCombats.find((n) => n.id === c.id);
    if (
      current &&
      (current.sessionId !== c.sessionId ||
        current.encounterId !== c.encounterId ||
        canonical(current.continuedFrom) !== canonical(c.continuedFrom))
    )
      throw new Error('Encounter instance association is immutable.');
  }
  const createdSessions = next.sessions.filter(
    (s) => !old.sessions.some((p) => p.id === s.id)
  );
  for (const s of createdSessions) {
    const origin = s.continuation;
    if (!origin) continue;
    if (
      sessionFingerprint(old, origin.sourceSessionId) !==
        origin.sourceFingerprint ||
      canonical(sourceContext(old, origin.sourceSessionId)) !==
        canonical(sourceContext(next, origin.sourceSessionId))
    )
      throw new Error('Source session changed during continuation.');
    const { requestFingerprint: stored, ...choices } = origin;
    if (requestFingerprint(s.id, s.label, choices) !== stored)
      throw new Error('Continuation choices do not match confirmation.');
    const source = old.sessions.find((p) => p.id === origin.sourceSessionId);
    if ((s.notes || '') !== (origin.copyNotes ? source?.notes || '' : ''))
      throw new Error('Session notes were not copied as requested.');
    const party = carriedPartyProfiles(
      old,
      origin.sourceSessionId,
      s.id,
      origin.partyCharacterIds || []
    );
    if (canonical(party) !== canonical(profilesInSession(next, s.id)))
      throw new Error('Party profile copies do not match choices.');
    const combats = next.workingCombats.filter((c) => c.sessionId === s.id),
      inventories = next.workingInventories.filter((w) => w.sessionId === s.id);
    if (
      combats.length !== origin.combatInstanceIds.length ||
      inventories.length !== (origin.inventoryId ? 1 : 0)
    )
      throw new Error('Continuation copies do not match choices.');
    for (const id of origin.combatInstanceIds) {
      const source = old.workingCombats.find(
          (c) =>
            c.id === id &&
            c.sessionId === origin.sourceSessionId &&
            !c.removedAt
        ),
        copy = combats.find((c) => c.continuedFrom?.instanceId === id);
      if (
        !source ||
        !copy ||
        copy.encounterId !== source.encounterId ||
        copy.status !== source.status ||
        copy.title !== source.title ||
        copy.generation !== 0 ||
        canonical(copy.state) !== canonical(source.state)
      )
        throw new Error('Continuing combat must retain complete source state.');
      const checkpoint = next.combatCheckpoints.find(
        (p) => p.id === copy.continuedFrom?.checkpointId
      );
      if (
        !checkpoint ||
        checkpoint.combatId !== id ||
        canonical(checkpoint.state) !== canonical(source.state) ||
        checkpoint.status !== source.status ||
        copy.origin.kind !== 'checkpoint' ||
        copy.origin.checkpointId !== checkpoint.id
      )
        throw new Error('Preserve source combat before continuation.');
    }
    if (origin.inventoryId) {
      const source = old.workingInventories.find(
          (w) =>
            w.id === origin.inventoryId &&
            w.sessionId === origin.sourceSessionId
        ),
        copy = inventories[0];
      if (
        !source ||
        !copy ||
        copy.continuedFrom?.instanceId !== source.id ||
        canonical(copy.document) !== canonical(source.document)
      )
        throw new Error('Carried inventory must retain complete source state.');
      const checkpoint = next.inventoryCheckpoints.find(
        (p) => p.id === copy.continuedFrom?.checkpointId
      );
      if (
        !checkpoint ||
        checkpoint.workingId !== source.id ||
        canonical(checkpoint.document) !== canonical(source.document) ||
        copy.origin.kind !== 'checkpoint' ||
        copy.origin.checkpointId !== checkpoint.id
      )
        throw new Error('Preserve source inventory before continuation.');
    }
  }
  for (const c of next.workingCombats.filter(
    (c) => !old.workingCombats.some((w) => w.id === c.id) && c.continuedFrom
  )) {
    if (!createdSessions.some((s) => s.id === c.sessionId && s.continuation))
      throw new Error('Continuing encounters require Start next session.');
  }
  for (const w of next.workingInventories.filter(
    (w) => !old.workingInventories.some((p) => p.id === w.id) && w.continuedFrom
  )) {
    if (!createdSessions.some((s) => s.id === w.sessionId && s.continuation))
      throw new Error('Carried inventory requires Start next session.');
  }
}

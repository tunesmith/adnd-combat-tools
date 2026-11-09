import type { CampaignDocument } from './campaignDocument';
export function reorderCampaignSession(
  doc: CampaignDocument,
  fromId: string,
  targetId: string
): CampaignDocument {
  if (doc.xp?.events.length)
    throw new Error('Session order is fixed after XP confirmation.');
  if (fromId === targetId) return doc;
  const from = doc.sessions.find((s) => s.id === fromId),
    target = doc.sessions.findIndex((s) => s.id === targetId);
  if (!from || target < 0)
    throw new Error('Sessions changed; try dragging again.');
  const sessions = doc.sessions.filter((s) => s.id !== fromId);
  sessions.splice(target, 0, from);
  return {
    ...doc,
    sessions,
    ...(doc.xp
      ? { xp: { ...doc.xp, sessionOrder: sessions.map((s) => s.id) } }
      : {}),
  };
}

export function historicalSessionTargets(
  doc: CampaignDocument,
  fromId?: string
) {
  const xp = doc.xp;
  if (!xp?.openings.length) return [];
  if (fromId) {
    const tail = doc.sessions[doc.sessions.length - 1];
    if (
      tail?.id !== fromId ||
      tail.continuation ||
      doc.sessions.some((s) => s.continuation?.sourceSessionId === fromId) ||
      xp.openings.some((o) => o.sessionId === fromId) ||
      xp.extensions?.some((e) =>
        e.openings.some(
          (o) =>
            o.previous.sessionId === fromId ||
            o.replacement.sessionId === fromId
        )
      ) ||
      xp.events.some(
        (e) =>
          e.point.position.sessionId === fromId ||
          e.rewards.some(
            (r) =>
              r.origin.sessionId === fromId || r.evidence.sessionId === fromId
          )
      )
    )
      return [];
  }
  const lastCutoff = Math.max(
    ...xp.openings.map((o) =>
      doc.sessions.findIndex((s) => s.id === o.sessionId)
    )
  );
  return doc.sessions.slice(0, lastCutoff + 1);
}

export function placeHistoricalSession(
  doc: CampaignDocument,
  beforeId: string,
  session: CampaignDocument['sessions'][number]
): CampaignDocument {
  const existing = doc.sessions.find((s) => s.id === session.id);
  if (
    !historicalSessionTargets(doc, existing?.id).some((s) => s.id === beforeId)
  )
    throw new Error('Choose a starting session or an earlier session.');
  const sessions = doc.sessions.filter((s) => s.id !== session.id);
  const index = sessions.findIndex((s) => s.id === beforeId);
  sessions.splice(index, 0, existing ?? session);
  return {
    ...doc,
    sessions,
    ...(doc.xp
      ? { xp: { ...doc.xp, sessionOrder: sessions.map((s) => s.id) } }
      : {}),
    workspace: { ...doc.workspace, sessionId: session.id },
  };
}

export function validHistoricalSessionMove(
  old: CampaignDocument,
  next: CampaignDocument
) {
  const tail = old.sessions[old.sessions.length - 1];
  if (!tail) return false;
  const oldIds = old.sessions.map((s) => s.id);
  const nextIds = next.sessions
    .map((s) => s.id)
    .filter((id) => oldIds.includes(id));
  const index = nextIds.indexOf(tail.id);
  const remaining = nextIds.filter((n) => n !== tail.id);
  return (
    index >= 0 &&
    oldIds.slice(0, -1).every((id, i) => remaining[i] === id) &&
    historicalSessionTargets(old, tail.id).some(
      (s) => s.id === nextIds[index + 1]
    )
  );
}

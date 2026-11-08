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

import type { CampaignDocument } from './campaignDocument';
import type { CampaignXp, XpPoint, XpPosition } from './campaignXpModel';
const phases = { opening: 0, during: 1, end: 2 };
function compareBoundaryPosition(a: XpPosition, b: XpPosition): number {
  return phases[a.phase] - phases[b.phase] || a.order - b.order;
}
function entries(xp: CampaignXp) {
  return [
    ...xp.rewards.map((r) => ({
      id: r.id,
      sessionId: r.origin.sessionId,
      position: r.origin,
      kind: 'event' as const,
      label: r.title,
    })),
    ...xp.points
      .filter((p) => !p.correctionOf)
      .map((p) => ({
        id: p.id,
        sessionId: p.position.sessionId,
        position: p.position,
        kind: 'award' as const,
        label: p.label,
      })),
  ];
}
export function syncXpTimeline(xp: CampaignXp): CampaignXp {
  const all = entries(xp),
    timeline: Record<string, string[]> = {};
  for (const [sessionId, ids] of Object.entries(xp.timeline))
    timeline[sessionId] = ids.filter((id) =>
      all.some((e) => e.id === id && e.sessionId === sessionId)
    );
  for (const entry of all) {
    const ids = timeline[entry.sessionId] || [];
    if (!ids.includes(entry.id)) timeline[entry.sessionId] = [...ids, entry.id];
  }
  return { ...xp, timeline };
}
export function xpTimelineEntries(doc: CampaignDocument, sessionId: string) {
  const xp = doc.xp;
  if (!xp) return [];
  const all = entries(xp),
    timeline = xp.timeline;
  return (timeline[sessionId] || []).flatMap((id) => {
    const e = all.find((e) => e.id === id);
    return e ? [e] : [];
  });
}
export function xpAwardRoot(doc: CampaignDocument, point: XpPoint): string {
  const visited = new Set<string>();
  let current = point;
  while (current.correctionOf) {
    if (visited.has(current.id))
      throw new Error('Invalid XP correction lineage.');
    visited.add(current.id);
    const prior = doc.xp?.events.find((e) => e.id === current.correctionOf);
    if (!prior) throw new Error('Missing XP correction source.');
    current = prior.point;
  }
  return current.id;
}
export function compareXpTimeline(
  doc: CampaignDocument,
  a: XpPosition,
  b: XpPosition,
  aId?: string,
  bId?: string
): number {
  const sessions = doc.sessions.map((s) => s.id),
    session = sessions.indexOf(a.sessionId) - sessions.indexOf(b.sessionId);
  if (session) return session;
  const ids = doc.xp?.timeline[a.sessionId] || [];
  const ai = aId ? ids.indexOf(aId) : -1,
    bi = bId ? ids.indexOf(bId) : -1;
  if (ai >= 0 && bi >= 0) return ai - bi;
  // Session balance boundaries are virtual, not rows in the timeline.
  if (ai >= 0 && !bId && b.phase === 'opening' && b.order === 0) return 1;
  if (ai >= 0 && !bId && b.phase === 'end' && b.order === 9999) return -1;
  return compareBoundaryPosition(a, b);
}
export function compareXpAwards(
  doc: CampaignDocument,
  a: XpPoint,
  b: XpPoint
): number {
  return compareXpTimeline(
    doc,
    a.position,
    b.position,
    xpAwardRoot(doc, a),
    xpAwardRoot(doc, b)
  );
}
export function xpTimelineEntryFrozen(
  doc: CampaignDocument,
  id: string
): boolean {
  const xp = doc.xp;
  if (!xp) return false;
  return (
    xp.points.some((p) => p.id === id && !!p.confirmedEventId) ||
    xp.events.some((e) => e.rewards.some((r) => r.id === id))
  );
}
export function moveXpTimelineEntry(
  doc: CampaignDocument,
  sessionId: string,
  id: string,
  direction: -1 | 1
): CampaignDocument {
  const xp = doc.xp;
  if (!xp) throw new Error('XP list changed.');
  if (xpTimelineEntryFrozen(doc, id))
    throw new Error('Confirmed XP history cannot be reordered.');
  const ids = [...(xp.timeline?.[sessionId] || [])],
    index = ids.indexOf(id),
    other = ids[index + direction];
  if (index < 0 || !other) return doc;
  ids[index] = other;
  ids[index + direction] = id;
  return {
    ...doc,
    xp: { ...xp, timeline: { ...xp.timeline, [sessionId]: ids } },
  };
}
export function validateXpTimeline(doc: CampaignDocument) {
  const xp = doc.xp;
  if (!xp) return;
  if (xp.version !== 3 || !xp.timeline)
    throw new Error('Expected ordered XP data.');
  const all = entries(xp),
    seen = new Set<string>();
  for (const [sessionId, ids] of Object.entries(xp.timeline)) {
    if (!doc.sessions.some((s) => s.id === sessionId))
      throw new Error('Invalid XP list session.');
    for (const id of ids) {
      if (
        seen.has(id) ||
        !all.some((e) => e.id === id && e.sessionId === sessionId)
      )
        throw new Error('Invalid or duplicate XP list entry.');
      seen.add(id);
    }
  }
  if (seen.size !== all.length) throw new Error('Missing XP list entry.');
}
export function validateXpTimelineTransition(
  old: CampaignDocument,
  next: CampaignDocument
) {
  const xp = old.xp;
  if (!xp) return;
  const fixed = new Set(
    entries(xp)
      .filter((e) => xpTimelineEntryFrozen(old, e.id))
      .map((e) => e.id)
  );
  for (const session of old.sessions) {
    const before = xpTimelineEntries(old, session.id)
        .map((e) => e.id)
        .filter((id) => fixed.has(id)),
      after = xpTimelineEntries(next, session.id)
        .map((e) => e.id)
        .filter((id) => fixed.has(id));
    if (JSON.stringify(before) !== JSON.stringify(after))
      throw new Error('Confirmed XP list order is immutable.');
  }
}

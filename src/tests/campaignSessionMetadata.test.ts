import {
  parseCampaign,
  serializeCampaign,
  validateCampaign,
  validateHistoryTransition,
  type CampaignDocument,
} from '../helpers/campaignDocument';
import {
  formatSessionDate,
  nextSessionNumber,
  sessionDetails,
} from '../helpers/campaignSessionMetadata';
import { reorderCampaignSession } from '../helpers/campaignSessionOrder';

const legacy: CampaignDocument = {
  kind: 'adnd-campaign',
  schemaVersion: 21,
  id: 'campaign',
  title: 'Campaign',
  notes: '',
  sessions: [
    { id: 'a', label: 'Day86 2025-12-14' },
    { id: 'b', label: 'Act10 — 2025-11-07' },
    { id: 'c', label: 'Session 93' },
    { id: 'd', label: '  Day 4: The Attack 2025-12-14  ' },
    { id: 'e', label: 'Act 11 — 2025-02-29' },
    { id: 'f', label: 'Day 12 — 2024-02-29' },
    { id: 'g', label: 'Session 012' },
  ],
  records: [],
  workingInventories: [],
  inventoryCheckpoints: [],
  workingCombats: [],
  combatCheckpoints: [],
  workspace: { sessionId: 'b', view: 'session' },
};

test('migrates recognizable labels once and leaves colliding numbers unassigned', () => {
  const text = JSON.stringify(legacy);
  expect(parseCampaign(text, 'edit').sessions).toEqual(legacy.sessions);
  const doc = parseCampaign(text);
  expect(doc.sessions).toEqual([
    { id: 'a', label: 'Day86', date: '2025-12-14', sessionNumber: 86 },
    { id: 'b', label: 'Act10', date: '2025-11-07', sessionNumber: 10 },
    { id: 'c', label: 'Session 93', sessionNumber: 93 },
    legacy.sessions[3],
    { ...legacy.sessions[4], sessionNumber: 11 },
    { id: 'f', label: 'Day 12', date: '2024-02-29' },
    legacy.sessions[6],
  ]);
  expect(formatSessionDate('2025-12-14')).toBe('Dec 14, 2025');
  expect(nextSessionNumber(doc.sessions)).toBe(94);
  expect(doc.workspace.sessionId).toBe('b');

  // A later name can look like a legacy label even while its metadata is unset.
  doc.sessions = doc.sessions.map((session) => {
    if (session.id === 'a')
      return { ...session, label: 'The Attack', date: undefined };
    if (session.id === 'd') return { ...session, label: 'Day 30 2025-12-14' };
    return session;
  });
  const reordered = reorderCampaignSession(doc, 'a', 'b');
  const reopened = parseCampaign(serializeCampaign(reordered));
  expect(reopened).toEqual(reordered);
  expect(reopened.sessions[1]).toEqual({
    id: 'a',
    label: 'The Attack',
    sessionNumber: 86,
  });
  expect(reopened.sessions[3]).toEqual({ id: 'd', label: 'Day 30 2025-12-14' });
});

test('validates dates and unique positive session numbers on edits and at the file boundary', () => {
  const doc = parseCampaign(JSON.stringify(legacy));
  const validateSession = (
    change: Partial<CampaignDocument['sessions'][number]>
  ) =>
    validateCampaign({
      ...doc,
      sessions: [{ ...doc.sessions[0], ...change }, ...doc.sessions.slice(1)],
    });
  expect(() => validateSession({ sessionNumber: 10 })).toThrow(
    'already in use'
  );
  for (const sessionNumber of [0, -1, 0.5, Number.MAX_SAFE_INTEGER + 1])
    expect(() => validateSession({ sessionNumber })).toThrow();
  for (const date of ['0000-01-01', '2025-02-29', '2025-12-14T00:00:00Z'])
    expect(() => validateSession({ date })).toThrow('Invalid session date');
  expect(() =>
    validateHistoryTransition(
      doc,
      { ...doc, sessionMetadataVersion: undefined },
      ''
    )
  ).toThrow('version cannot be removed');

  const draft = { label: 'The Attack', date: '', number: '10' };
  expect(() => sessionDetails(doc.sessions, draft)).toThrow('already in use');
  expect(sessionDetails(doc.sessions, draft, doc.sessions[1])).toMatchObject({
    label: 'The Attack',
    sessionNumber: 10,
  });
  expect(
    sessionDetails(doc.sessions, { ...draft, number: '12' }, doc.sessions[5])
      .sessionNumber
  ).toBe(12);
});

import { reorderCampaignSession } from '../helpers/campaignSessionOrder';
import { xpCastleDraft, xpCampaign, xpAt } from './fixtures/xpCampaign';
import {
  confirmXpAward,
  previewXpAward,
  sessionXpBalances,
  xpSessionOrder,
} from '../helpers/campaignXp';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
test('tab moves preserve selected identity and all session contents, and round-trip the same XP chronology', () => {
  const doc = xpCastleDraft(),
    next = reorderCampaignSession(doc, 'session-1', 'session-2');
  expect(next.sessions.map((s) => s.id)).toEqual(['session-2', 'session-1']);
  expect(next.workspace).toEqual(doc.workspace);
  expect(next.records).toEqual(doc.records);
  expect(next.party).toEqual(doc.party);
  expect(next.xp?.rewards).toEqual(doc.xp?.rewards);
  expect(xpSessionOrder(next)).toEqual(['session-2', 'session-1']);
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
  expect(() => validateHistoryTransition(doc, next, '')).not.toThrow();
  expect(
    reorderCampaignSession(next, 'session-1', 'session-2').sessions
  ).toEqual(doc.sessions);
  expect(() => reorderCampaignSession(doc, 'missing', 'session-2')).toThrow(
    'changed'
  );
  const empty = xpCampaign();
  delete empty.xp;
  expect(
    reorderCampaignSession(empty, 'session-1', 'session-2').xp
  ).toBeUndefined();
});
test('confirmed XP locks tab chronology and legacy chronology is displayed without changing awards', () => {
  const draft = xpCastleDraft();
  const doc = confirmXpAward(
    draft,
    'refuge-point',
    previewXpAward(draft, 'refuge-point').fingerprint,
    'confirmed',
    xpAt
  );
  expect(() => reorderCampaignSession(doc, 'session-1', 'session-2')).toThrow(
    'fixed'
  );
  expect(() =>
    validateHistoryTransition(
      doc,
      { ...doc, sessions: [...doc.sessions].reverse() },
      ''
    )
  ).toThrow('chronology');
  const loaded = parseCampaign(
    JSON.stringify({ ...doc, sessions: [...doc.sessions].reverse() })
  );
  expect(loaded.sessions).toEqual(doc.sessions);
  expect(loaded.xp?.events).toEqual(doc.xp?.events);
  expect(sessionXpBalances(loaded, 'xp-mira', 'session-1').closing).toBe(0);
  expect(sessionXpBalances(loaded, 'xp-mira', 'session-2').closing).toBe(507);
});

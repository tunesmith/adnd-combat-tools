/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, within } from '@testing-library/react';
import XpAwardTable from '../components/desktop/XpAwardTable';
import {
  extensionBaseline,
  backfillSession,
} from './fixtures/xpExtensionCampaign';
import {
  xpCastleDraft,
  xpTestReward,
  xpAt,
  pendingFungus,
  xpTestIds,
} from './fixtures/xpCampaign';
import { moveXpTimelineEntry } from '../helpers/campaignXpTimeline';
import {
  saveXpReward,
  previewXpExtension,
  confirmXpExtension,
  newXpPoint,
  saveXpPoint,
  selectXpRewards,
  previewXpAward,
  confirmXpAward,
} from '../helpers/campaignXp';
import { serializeCampaign, parseCampaign } from '../helpers/campaignDocument';

test('draft and confirmed award rows follow session/timeline order without rewriting the selected rewards or history', () => {
  let doc = moveXpTimelineEntry(xpCastleDraft(), 'session-1', 'money', -1);
  const laterMoney = xpTestReward(doc, 'second-session-money', 'money');
  laterMoney.title = 'Second-session money';
  laterMoney.origin.sessionId = 'session-2';
  doc = saveXpReward(doc, laterMoney);
  doc = moveXpTimelineEntry(doc, 'session-2', laterMoney.id, -1);
  const selectedIds = [laterMoney.id, 'scroll', 'raiders', 'money'];
  doc = selectXpRewards(doc, 'refuge-point', selectedIds);
  const point = doc.xp?.points.find((p) => p.id === 'refuge-point');
  if (!point || !doc.xp) throw Error('Fixture');
  const source = selectedIds.map((id) => {
    const reward = doc.xp?.rewards.find((r) => r.id === id);
    if (!reward) throw Error('Fixture');
    return reward;
  });
  const expected = [
    'Recovered coin lots',
    'Seventeen tunnel raiders',
    'Kept warding scroll',
    'Second-session money',
  ];
  const titles = (table: HTMLElement) =>
    within(table)
      .getAllByRole('row')
      .slice(1, 5)
      .map((row) => within(row).getAllByRole('button')[0]?.textContent);
  const beforeDraft = serializeCampaign(doc);
  const onSelect = jest.fn();
  const draft = render(
    <XpAwardTable
      document={doc}
      point={point}
      rewards={source}
      onSelect={onSelect}
      onOpen={() => undefined}
      onInspectAllocation={() => undefined}
    />
  );
  expect(titles(draft.getByRole('table', { name: 'XP award' }))).toEqual(
    expected
  );
  fireEvent.click(draft.getByLabelText('Include Recovered coin lots'));
  expect(onSelect).toHaveBeenCalledWith('money', false);
  expect(serializeCampaign(doc)).toBe(beforeDraft);
  draft.unmount();

  const preview = previewXpAward(doc, point.id);
  const confirmed = confirmXpAward(
    doc,
    point.id,
    preview.fingerprint,
    'ordered-display-award',
    xpAt
  );
  const accepted = confirmed.xp?.events[0];
  if (!accepted) throw Error('Fixture');
  expect(accepted.rewards.map((r) => r.id)).toEqual(selectedIds);
  const beforeHistory = serializeCampaign(confirmed);
  const history = render(
    <XpAwardTable
      document={confirmed}
      point={accepted.point}
      rewards={accepted.rewards}
      rows={accepted.rows}
      readOnly
      onOpen={() => undefined}
      onInspectAllocation={() => undefined}
    />
  );
  expect(titles(history.getByRole('table', { name: 'XP award' }))).toEqual(
    expected
  );
  expect(accepted.rewards.map((r) => r.id)).toEqual(selectedIds);
  expect(serializeCampaign(confirmed)).toBe(beforeHistory);
  expect(parseCampaign(beforeHistory).xp?.events).toEqual(confirmed.xp?.events);
});

test('an earlier award hides future events and their recipients', () => {
  const doc = xpCastleDraft();
  const point = doc.xp?.points[0];
  const earlier = doc.xp?.rewards[0];
  if (!point || !earlier || !earlier.recipients[0]) throw Error('Fixture');
  const future = {
    ...xpTestReward(doc, 'future-coins', 'money'),
    origin: { sessionId: 'session-2', phase: 'end' as const, order: 99 },
    recipients: [
      {
        ...earlier.recipients[0],
        characterId: 'future-only',
        name: 'Future recruit',
      },
    ],
  };
  const view = render(
    <XpAwardTable
      document={doc}
      point={point}
      rewards={[earlier, future]}
      onOpen={() => undefined}
      onInspectAllocation={() => undefined}
    />
  );
  expect(view.getByText(earlier.title)).toBeInTheDocument();
  expect(view.queryByText(future.title)).not.toBeInTheDocument();
  expect(
    view.queryByRole('columnheader', { name: 'Future recruit' })
  ).not.toBeInTheDocument();
});

test('unknown caps require review only for recipients being paid now', () => {
  const doc = xpCastleDraft();
  const original = doc.xp?.points[0];
  const reward = doc.xp?.rewards[0];
  const recipient = reward?.recipients[0];
  if (!original || !reward || !recipient || !doc.party) throw Error('Fixture');
  doc.party.profiles = doc.party.profiles.filter(
    (p) => p.characterId !== recipient.characterId
  );
  const point = { ...original, rewardIds: [reward.id] };
  const props = {
    document: doc,
    rewards: [reward],
    onOpen: () => undefined,
    onInspectAllocation: () => undefined,
  };
  const view = render(<XpAwardTable {...props} point={point} />);
  expect(
    view.getByRole('button', { name: `Review ${recipient.name} XP cap` })
  ).toHaveTextContent('Review trained level');
  for (const decision of ['later', 'forfeit'] as const) {
    view.rerender(
      <XpAwardTable
        {...props}
        point={{
          ...point,
          settlements: [
            {
              rewardId: reward.id,
              characterId: recipient.characterId,
              decision,
              reason: '',
            },
          ],
        }}
      />
    );
    expect(
      view.queryByRole('button', { name: `Review ${recipient.name} XP cap` })
    ).not.toBeInTheDocument();
    expect(view.getByText('Not needed')).toBeInTheDocument();
  }
});

test('retired recipients are hidden while absent recipients retain their latest known cap', () => {
  const doc = xpCastleDraft();
  const point = doc.xp?.points[0];
  const reward = doc.xp?.rewards[0];
  const retired = reward?.recipients[0];
  const absent = reward?.recipients[1];
  if (!point || !reward || !retired || !absent || !doc.party)
    throw Error('Fixture');
  doc.party.roster = doc.party.roster.map((c) =>
    c.id === retired.characterId
      ? { ...c, lastEligibleSessionId: 'session-1' }
      : c
  );
  doc.party.profiles = doc.party.profiles.filter(
    (p) => p.characterId !== absent.characterId || p.sessionId !== 'session-2'
  );
  const previous = doc.party.profiles.find(
    (p) => p.characterId === absent.characterId
  );
  if (!previous) throw Error('Fixture');
  doc.sessions.push({
    id: 'future-session',
    label: 'Future training',
    notes: '',
  });
  doc.party.profiles.push({
    ...previous,
    sessionId: 'future-session',
    baseLevel: 10,
  });
  const props = {
    document: doc,
    point: { ...point, rewardIds: [] },
    rewards: [reward],
    onOpen: () => undefined,
    onInspectAllocation: () => undefined,
  };
  const view = render(<XpAwardTable {...props} />);
  expect(
    view.queryByRole('columnheader', { name: retired.name })
  ).not.toBeInTheDocument();
  expect(
    view.getByRole('columnheader', { name: absent.name })
  ).toBeInTheDocument();
  expect(
    view.getByRole('button', { name: `Review ${absent.name} XP cap` })
  ).toHaveTextContent('2,001');
  view.rerender(
    <XpAwardTable
      {...props}
      point={{
        ...point,
        settlements: [
          {
            rewardId: reward.id,
            characterId: absent.characterId,
            decision: 'later',
            reason: '',
          },
        ],
      }}
    />
  );
  expect(
    view.getByRole('button', { name: `Review ${absent.name} XP cap` })
  ).toHaveTextContent('2,001');
});

test('confirmed partial awards hide retired forfeitures and show accurate unchanged character totals', () => {
  let doc = xpCastleDraft();
  doc = confirmXpAward(
    doc,
    'refuge-point',
    previewXpAward(doc, 'refuge-point').fingerprint,
    'castle-confirmed',
    xpAt
  );
  const source = pendingFungus(doc);
  const excluded = doc.xp?.rewards[0]?.recipients.find(
    (c) => c.characterId === xpTestIds[4]
  );
  if (!excluded || !doc.party || !xpTestIds[2]) throw Error('Fixture');
  source.recipients.push({ ...excluded, eligible: false, participated: false });
  doc = saveXpReward(doc, source);
  if (!doc.party) throw Error('Fixture');
  doc.party = {
    ...doc.party,
    roster: doc.party.roster.map((c) =>
      c.id === xpTestIds[1] ? { ...c, lastEligibleSessionId: 'session-1' } : c
    ),
    profiles: doc.party.profiles
      .filter(
        (p) => p.characterId !== xpTestIds[2] || p.sessionId !== 'session-2'
      )
      .map((p) =>
        p.characterId === xpTestIds[4]
          ? { ...p, characterClass: 'magic-user' }
          : p
      ),
  };
  const draft = newXpPoint(doc, 'session-2', 'split');
  doc = saveXpPoint(doc, draft);
  doc = selectXpRewards(doc, draft.id, [source.id]);
  const point = doc.xp?.points.find((p) => p.id === draft.id);
  if (!point) throw Error('Fixture');
  doc = saveXpPoint(doc, {
    ...point,
    settlements: [
      {
        rewardId: source.id,
        characterId: xpTestIds[2],
        decision: 'later',
        reason: '',
      },
    ],
  });
  doc = confirmXpAward(
    doc,
    point.id,
    previewXpAward(doc, point.id).fingerprint,
    'split-confirmed',
    xpAt
  );
  const accepted = doc.xp?.events.find((e) => e.id === 'split-confirmed');
  if (!accepted) throw Error('Fixture');
  const history = JSON.stringify(accepted);
  // A subsequent payment and profile must not leak into this confirmed view.
  doc.sessions.push({ id: 'day5', label: 'Day5', notes: '' });
  doc = saveXpPoint(doc, newXpPoint(doc, 'day5', 'return'));
  doc = selectXpRewards(doc, 'return', [source.id]);
  doc = confirmXpAward(
    doc,
    'return',
    previewXpAward(doc, 'return').fingerprint,
    'return-confirmed',
    xpAt
  );
  const view = render(
    <XpAwardTable
      document={doc}
      point={accepted.point}
      confirmedEventId={accepted.id}
      rewards={accepted.rewards}
      rows={accepted.rows}
      readOnly
      onOpen={() => undefined}
      onInspectAllocation={() => undefined}
    />
  );
  const headers = view.getAllByRole('columnheader').map((h) => h.textContent);
  expect(headers).toEqual(['XP event', 'Mira', 'Oren', 'Nera', 'Bram']);
  const cell = (label: string, name: string) =>
    within(
      view.getByRole('row', { name: new RegExp('^' + label) })
    ).getAllByRole('cell')[headers.indexOf(name) - 1];
  for (const name of ['Oren', 'Bram']) {
    for (const label of ['Base XP', 'Full award', 'XP added', 'Discarded'])
      expect(cell(label, name)).toHaveTextContent(/^0$/);
    expect(cell('Bonus', name)).toHaveTextContent('+0 (10%)');
    expect(cell('Previous balance', name)).toHaveTextContent(/^507$/);
    expect(cell('New balance', name)).toHaveTextContent(/^507$/);
  }
  expect(cell('XP cap', 'Oren')).toHaveTextContent('2,001');
  expect(cell('XP cap', 'Bram')).toHaveTextContent('2,501');
  expect(cell('XP to cap', 'Oren')).toHaveTextContent('1,494');
  expect(cell('XP to cap', 'Bram')).toHaveTextContent('1,994');
  expect(cell('Later alarm fungus', 'Oren')).toHaveTextContent('23Later');
  expect(cell('New balance', 'Mira')).toHaveTextContent('532');
  expect(cell('New balance', 'Nera')).toHaveTextContent('484');
  expect(JSON.stringify(accepted)).toBe(history);
});

test('a later backward-history extension preserves unchanged balances in an older confirmation', () => {
  let doc = extensionBaseline();
  const source = doc.xp?.rewards[0];
  const basis = doc.xp?.points[0];
  if (!source || !basis) throw Error('Fixture');
  const reward = {
    ...source,
    id: 'birch-only',
    version: 1,
    recipients: source.recipients.map((c) => ({
      ...c,
      eligible: c.characterId === 'birch',
    })),
  };
  doc = saveXpReward(doc, reward);
  doc = saveXpPoint(doc, {
    ...newXpPoint(doc, 's90', 'birch-award'),
    bonuses: basis.bonuses,
    caps: basis.caps,
  });
  doc = selectXpRewards(doc, 'birch-award', [reward.id]);
  doc = confirmXpAward(
    doc,
    'birch-award',
    previewXpAward(doc, 'birch-award').fingerprint,
    'birch-confirmed',
    xpAt
  );
  const accepted = doc.xp?.events.find((e) => e.id === 'birch-confirmed');
  if (!accepted) throw Error('Fixture');
  doc = backfillSession(doc, 70, 85);
  doc = saveXpReward(doc, {
    ...source,
    id: 'earlier-coins',
    version: 1,
    origin: { sessionId: 's70', phase: 'during', order: 0 },
  });
  doc = saveXpPoint(doc, {
    ...newXpPoint(doc, 's70', 'earlier-award'),
    bonuses: basis.bonuses,
    caps: basis.caps,
  });
  doc = selectXpRewards(doc, 'earlier-award', ['earlier-coins']);
  const request = {
    pointIds: ['earlier-award'],
    openings: [
      { characterId: 'amber', sessionId: 's70', balance: 9500 },
      { characterId: 'birch', sessionId: 's70', balance: 7800 },
    ],
  };
  doc = confirmXpExtension(
    doc,
    request,
    previewXpExtension(doc, request).fingerprint,
    'earlier-extension',
    xpAt
  );
  doc = parseCampaign(serializeCampaign(doc));
  const view = render(
    <XpAwardTable
      document={doc}
      point={accepted.point}
      confirmedEventId={accepted.id}
      rewards={accepted.rewards}
      rows={accepted.rows}
      readOnly
      onOpen={() => undefined}
      onInspectAllocation={() => undefined}
    />
  );
  const headers = view.getAllByRole('columnheader').map((h) => h.textContent);
  for (const label of ['Previous balance', 'New balance']) {
    const cell = within(
      view.getByRole('row', { name: new RegExp('^' + label) })
    ).getAllByRole('cell')[headers.indexOf('Amber') - 1];
    expect(cell).toHaveTextContent('10,500');
  }
});

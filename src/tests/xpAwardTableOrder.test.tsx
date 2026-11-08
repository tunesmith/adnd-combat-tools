/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, within } from '@testing-library/react';
import XpAwardTable from '../components/desktop/XpAwardTable';
import { xpCastleDraft, xpTestReward, xpAt } from './fixtures/xpCampaign';
import { moveXpTimelineEntry } from '../helpers/campaignXpTimeline';
import {
  saveXpReward,
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

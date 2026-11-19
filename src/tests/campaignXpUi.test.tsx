/** @jest-environment jsdom */
import replay from './fixtures/xpSyntheticReplay.json';
import { storageInventory } from './fixtures/storageInventory';
import { startWorkingInventory } from '../helpers/campaignWorkingInventory';
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CampaignXp from '../components/desktop/CampaignXp';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import { xpCastleDraft, pendingFungus, xpTestIds } from './fixtures/xpCampaign';
import {
  saveXpReward,
  confirmXpAward,
  previewXpAward,
  newXpPoint,
  saveXpPoint,
  selectXpRewards,
  sessionXpBalances,
  xpLedger,
} from '../helpers/campaignXp';
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `xp-ui-${++id}` },
  });
});
function openFixtureAward() {
  fireEvent.click(
    screen.getByRole('button', { name: /^At the synthetic refuge/ })
  );
}
function renameNewAward(label: string) {
  const dialog = within(screen.getByRole('dialog', { name: 'XP award' }));
  fireEvent.change(dialog.getByLabelText('Award name'), {
    target: { value: label },
  });
  fireEvent.keyDown(dialog.getByLabelText('Award name'), { key: 'Enter' });
}
function awardValues(container: ReturnType<typeof within>) {
  const row = container.getByRole('row', { name: /^Full award/ });
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}
test('usable review flow establishes opening XP, keeps a scroll, creates an opening award and confirms once with a later reward pending', () => {
  let current = xpCastleDraft();
  current = {
    ...current,
    xp: { ...xpLedger(current), openings: [], points: [] },
  };
  const scroll = xpLedger(current).rewards.find((r) => r.id === 'scroll');
  if (!scroll || scroll.input.category !== 'treasure') throw Error('Fixture');
  scroll.input.disposition = 'defer';
  current = saveXpReward(current, pendingFungus(current));
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={doc}
        sessionId="session-2"
        onChange={(change) => {
          const next = parseCampaign(serializeCampaign(change(doc)));
          validateHistoryTransition(doc, next, '');
          current = next;
          setDoc(next);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Opening balances' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Opening XP' }));
  expect(dialog.getByLabelText('Mira opening XP')).toHaveValue(null);
  expect(dialog.getByLabelText('Mira starting session')).toHaveValue(
    'session-2'
  );
  // This reconstruction needs openings before the rewards in the first session.
  for (const select of dialog.getAllByRole('combobox'))
    fireEvent.change(select, { target: { value: 'session-1' } });
  fireEvent.click(
    dialog.getByRole('button', { name: 'Set listed unlocked balances to 0' })
  );
  fireEvent.click(
    dialog.getByRole('button', { name: 'Save opening balances' })
  );
  expect(sessionXpBalances(current, 'xp-mira', 'session-1').closing).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: '+ Award point' }));
  const disposition = () =>
    screen.getByLabelText('Disposition for Kept warding scroll');
  expect(disposition()).toHaveValue('defer');
  expect(
    awardValues(within(screen.getByRole('table', { name: 'XP award' })))
  ).toEqual(['0', '0', '0', '0', '0']);
  fireEvent.change(disposition(), { target: { value: 'sell' } });
  expect(
    awardValues(within(screen.getByRole('table', { name: 'XP award' })))[0]
  ).toBe('1,650');
  fireEvent.change(disposition(), { target: { value: 'defer' } });
  expect(
    screen.getByLabelText('Include Kept warding scroll')
  ).not.toBeChecked();
  fireEvent.change(disposition(), { target: { value: 'keep' } });
  expect(
    awardValues(within(screen.getByRole('table', { name: 'XP award' })))[0]
  ).toBe('330');
  fireEvent.keyDown(screen.getByRole('dialog', { name: 'XP award' }), {
    key: 'Escape',
  });
  expect(xpLedger(current).points).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: '+ Award point' }));
  expect(disposition()).toHaveValue('defer');
  renameNewAward('At the test refuge');
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Move At the test refuge earlier' })
  );
  fireEvent.click(
    screen.getByRole('button', { name: /^At the test refuge Draft/ })
  );
  fireEvent.change(disposition(), { target: { value: 'keep' } });
  for (const title of ['Seventeen tunnel raiders', 'Recovered coin lots'])
    fireEvent.click(screen.getByLabelText(`Include ${title}`));
  expect(
    screen.queryByLabelText('Include Later alarm fungus')
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Edit Mira XP bonus' })
  ).toHaveTextContent('10%');
  expect(
    screen.getByRole('button', { name: 'Edit Nera XP bonus' })
  ).toHaveTextContent('0%');
  const preview = within(
    screen.getByRole('region', { name: 'Confirm XP award' })
  );
  expect(awardValues(preview)).toEqual(['507', '507', '507', '461', '507']);
  expect(xpLedger(current).events).toHaveLength(0);
  fireEvent.click(preview.getByRole('button', { name: 'Confirm award' }));
  expect(xpLedger(current).events).toHaveLength(1);
  expect(
    xpLedger(current).rewards.find((r) => r.id === 'scroll')?.input
  ).toMatchObject({ disposition: 'keep' });
  expect(
    screen.queryByRole('button', { name: 'Confirm award', exact: true })
  ).not.toBeInTheDocument();
  expect(
    xpTestIds.map((id) => sessionXpBalances(current, id, 'session-2').closing)
  ).toEqual([507, 507, 507, 461, 507]);
  expect(
    xpTestIds.map((id) => sessionXpBalances(current, id, 'session-1').closing)
  ).toEqual([0, 0, 0, 0, 0]);
  expect(
    screen.getByRole('button', { name: /^Later alarm fungus/ })
  ).toBeEnabled();
  const reopened = parseCampaign(serializeCampaign(current));
  expect(xpLedger(reopened).events).toEqual(xpLedger(current).events);
});
test('reward modal cancel and draft save are distinct from award confirmation, with missing inputs retained safely', () => {
  let current = xpCastleDraft();
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={doc}
        sessionId="session-2"
        onChange={(change) => {
          current = parseCampaign(serializeCampaign(change(doc)));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: '+ XP Event' }));
  let dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  fireEvent.change(dialog.getByLabelText('XP event name'), {
    target: { value: 'Cancelled reward' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  expect(xpLedger(current).rewards).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: '+ XP Event' }));
  dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  fireEvent.change(dialog.getByLabelText('XP event name'), {
    target: { value: 'Incomplete draft' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  expect(xpLedger(current).rewards).toHaveLength(4);
  expect(xpLedger(current).events).toHaveLength(0);
});

test('new reward review stays open with long-decimal and scientific-notation inventory prices', () => {
  const doc = xpCastleDraft();
  const inventory = storageInventory();
  const stock = inventory.storageLocations[0];
  if (!stock) throw Error('Fixture');
  const first = stock.inventory[0],
    second = stock.inventory[1];
  if (!first || !second) throw Error('Fixture');
  first.valueGpOverride = 1 / 3;
  second.valueGpOverride = 1e-8;
  const campaign = startWorkingInventory(
    doc,
    'session-2',
    inventory,
    { kind: 'empty' },
    'decimal-stock',
    'unused',
    '2026-11-07T12:00:00.000Z'
  );
  render(
    <CampaignXp
      onConfirmExtension={async () => undefined}
      document={campaign}
      sessionId="session-2"
      onChange={() => true}
    />
  );
  expect(() =>
    fireEvent.click(screen.getByRole('button', { name: '+ XP Event' }))
  ).not.toThrow();
  const dialog = within(
    screen.getByRole('dialog', { name: 'XP event review' })
  );
  fireEvent.change(dialog.getByLabelText('Category'), {
    target: { value: 'money' },
  });
  expect(
    screen.getByRole('dialog', { name: 'XP event review' })
  ).toBeInTheDocument();
});

test('single-table entry calculates fractional XP and applies one deliberate historical adjustment', () => {
  let current = xpCastleDraft();
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={doc}
        sessionId="session-2"
        onChange={(change) => {
          current = parseCampaign(serializeCampaign(change(doc)));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: '+ XP Event' }));
  const dialog = within(
    screen.getByRole('dialog', { name: 'XP event review' })
  );
  fireEvent.change(dialog.getByLabelText('XP event name'), {
    target: { value: 'Tunnel kobolds' },
  });
  expect(dialog.queryByLabelText('Monster name')).not.toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Count'), { target: { value: '17' } });
  fireEvent.change(dialog.getByLabelText('Actual HD / level'), {
    target: { value: '1/2' },
  });
  fireEvent.change(dialog.getByLabelText('Total starting HP'), {
    target: { value: '44' },
  });
  expect(dialog.getByText('Raw XP: 129')).toBeInTheDocument();
  expect(dialog.queryByLabelText('Recovery status')).not.toBeInTheDocument();
  expect(dialog.getAllByRole('table')).toHaveLength(1);
  for (const label of [
    'Separate monster label',
    'Participation exceptions',
    'Historical allocation override',
    'Individual shares and overrides',
    'Band override',
    'Event exclusion',
    'Historical or other DM adjustments',
    'Challenge and decisions',
    'Calculation',
  ]) {
    expect(dialog.queryByText(label, { exact: true })).not.toBeInTheDocument();
  }
  expect(
    dialog.getByText('Select participants to calculate the ratio.')
  ).toBeInTheDocument();
  fireEvent.click(dialog.getByLabelText('All participated'));
  expect(dialog.getByLabelText('Mira eligible')).not.toBeChecked();
  expect(
    dialog.getByText(
      'Ratio: 8.5 adjusted HD / 5 participating levels = 1.7 (1)'
    )
  ).toBeInTheDocument();
  fireEvent.click(dialog.getByLabelText('All receive XP'));
  expect(dialog.getAllByText('25.8')).toHaveLength(5);
  fireEvent.click(dialog.getByRole('button', { name: 'Adjust XP…' }));
  let adjustment = within(screen.getByRole('dialog', { name: 'Adjust XP' }));
  fireEvent.change(adjustment.getByLabelText('Apply to'), {
    target: { value: 'all' },
  });
  fireEvent.change(adjustment.getByLabelText('XP each'), {
    target: { value: '26' },
  });
  fireEvent.click(
    adjustment.getByRole('button', { name: 'Apply', exact: true })
  );
  expect(adjustment.getByRole('alert')).toHaveTextContent('Add a note');
  fireEvent.change(adjustment.getByLabelText('Note'), {
    target: { value: 'Historical award-row rounding' },
  });
  fireEvent.click(adjustment.getByRole('button', { name: 'Cancel' }));
  expect(dialog.getAllByText('25.8')).toHaveLength(5);
  fireEvent.click(dialog.getByRole('button', { name: 'Adjust XP…' }));
  adjustment = within(screen.getByRole('dialog', { name: 'Adjust XP' }));
  fireEvent.change(adjustment.getByLabelText('Apply to'), {
    target: { value: 'all' },
  });
  fireEvent.change(adjustment.getByLabelText('XP each'), {
    target: { value: '26' },
  });
  fireEvent.change(adjustment.getByLabelText('Note'), {
    target: { value: 'Historical award-row rounding' },
  });
  fireEvent.click(
    adjustment.getByRole('button', { name: 'Apply', exact: true })
  );
  expect(dialog.getAllByText('26')).toHaveLength(5);
  expect(dialog.getAllByText('Historical award-row rounding')).toHaveLength(1);
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  const saved = current.xp?.rewards.find((r) => r.title === 'Tunnel kobolds');
  if (!saved) throw Error('Missing XP event');
  expect(
    saved.input.category === 'monster' && saved.input.monsters[0]?.name
  ).toBe('Tunnel kobolds');
  expect(
    saved.recipients.every(
      (r) =>
        r.participated &&
        r.eligible &&
        r.allocationOverride === '26' &&
        r.allocationReason === 'Historical award-row rounding'
    )
  ).toBe(true);
});

test('separate participation and unequal individual allocations survive ordinary event editing', () => {
  const doc = xpCastleDraft();
  const event = doc.xp?.rewards.find((r) => r.id === 'raiders');
  if (!event) throw Error('Fixture');
  const first = event.recipients[0],
    second = event.recipients[1];
  if (!first || !second) throw Error('Fixture');
  first.eligible = false;
  first.participated = true;
  second.shares = '2';
  second.allocationOverride = '27';
  second.allocationReason = 'Individual historical exception';
  let current = doc;
  function Harness() {
    const [d, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={d}
        sessionId="session-2"
        onChange={(change) => {
          current = parseCampaign(serializeCampaign(change(d)));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  openFixtureAward();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Seventeen tunnel raiders',
      exact: true,
    })
  );
  const dialog = within(
    screen.getByRole('dialog', { name: 'XP event review' })
  );
  expect(dialog.getByLabelText('Mira participated')).toBeChecked();
  expect(dialog.getByLabelText('Mira eligible')).not.toBeChecked();
  expect(dialog.getByText('2 shares')).toBeInTheDocument();
  expect(dialog.getByText('27')).toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('XP event notes'), {
    target: { value: 'A note without changing allocation' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  expect(
    current.xp?.rewards.find((r) => r.id === 'raiders')?.recipients
  ).toEqual(event.recipients);
});

test('level edits, participation and ratio changes remain independent of recipient selection and historical overrides', () => {
  const doc = xpCastleDraft();
  const event = doc.xp?.rewards.find((r) => r.id === 'raiders');
  if (!event) throw Error('Fixture');
  event.recipients = event.recipients.map((r) => ({
    ...r,
    allocationOverride: null,
    allocationReason: '',
  }));
  let current = doc;
  function Harness() {
    const [d, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={d}
        sessionId="session-2"
        onChange={(change) => {
          current = parseCampaign(serializeCampaign(change(d)));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  openFixtureAward();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Seventeen tunnel raiders',
      exact: true,
    })
  );
  const dialog = within(
    screen.getByRole('dialog', { name: 'XP event review' })
  );
  fireEvent.change(dialog.getByLabelText('Mira level at event'), {
    target: { value: '16' },
  });
  expect(
    dialog.getByText(/8.5 adjusted HD \/ 20 participating levels/)
  ).toBeInTheDocument();
  expect(
    dialog.getByText('Ratio: 8.5 adjusted HD / 20 participating levels = 0.425')
  ).toBeInTheDocument();
  expect(dialog.getAllByText('10.965')).toHaveLength(5);
  fireEvent.click(dialog.getByLabelText('Mira eligible'));
  expect(dialog.getByLabelText('Mira participated')).toBeChecked();
  expect(
    dialog.getByText('Ratio: 8.5 adjusted HD / 20 participating levels = 0.425')
  ).toBeInTheDocument();
  fireEvent.click(dialog.getByRole('button', { name: 'Override…' }));
  fireEvent.change(dialog.getByLabelText('Ratio override'), {
    target: { value: '1' },
  });
  fireEvent.change(dialog.getByLabelText('Reason'), {
    target: { value: 'DM difficulty decision' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Apply override' }));
  expect(
    dialog.getByText(
      'Ratio: 8.5 adjusted HD / 20 participating levels = 0.425 → 1 (adjusted)'
    )
  ).toBeInTheDocument();
  expect(dialog.getAllByText('32.25')).toHaveLength(4);
  fireEvent.click(dialog.getByRole('button', { name: 'Override…' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Use calculated ratio' }));
  expect(
    dialog.getByText('Ratio: 8.5 adjusted HD / 20 participating levels = 0.425')
  ).toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Mira level at event'), {
    target: { value: '' },
  });
  expect(dialog.getByText('Raw XP: 129')).toBeInTheDocument();
  expect(
    dialog.getByText('Enter the missing participant levels.')
  ).toBeInTheDocument();
  expect(
    dialog.queryByText(/missing levels\/HD require/)
  ).not.toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Mira level at event'), {
    target: { value: '16' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  const saved = current.xp?.rewards.find((r) => r.id === 'raiders');
  expect(saved?.recipients[0]).toMatchObject({
    level: '16',
    participated: true,
    eligible: false,
    allocationOverride: null,
  });
  expect(saved?.ratio.override).toBeNull();
  expect(current.party).toEqual(doc.party);
});

test('one adjustment dialog edits raw XP and individual shares without changing other recorded inputs', () => {
  const doc = xpCastleDraft();
  let current = doc;
  function Harness() {
    const [d, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={d}
        sessionId="session-2"
        onChange={(change) => {
          current = parseCampaign(serializeCampaign(change(d)));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  openFixtureAward();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Seventeen tunnel raiders',
      exact: true,
    })
  );
  const dialog = within(
    screen.getByRole('dialog', { name: 'XP event review' })
  );
  fireEvent.click(dialog.getByRole('button', { name: 'Adjust XP…' }));
  let adjustment = within(screen.getByRole('dialog', { name: 'Adjust XP' }));
  expect(adjustment.getByLabelText('Apply to')).toHaveValue('raw');
  fireEvent.change(adjustment.getByLabelText('Raw XP'), {
    target: { value: '144' },
  });
  fireEvent.change(adjustment.getByLabelText('Note'), {
    target: { value: 'Retained historical DM addition' },
  });
  fireEvent.click(
    adjustment.getByRole('button', { name: 'Apply', exact: true })
  );
  expect(dialog.getByText('Raw XP: 144')).toBeInTheDocument();
  fireEvent.click(dialog.getByRole('button', { name: 'Adjust XP…' }));
  adjustment = within(screen.getByRole('dialog', { name: 'Adjust XP' }));
  expect(adjustment.getByLabelText('Raw XP')).toHaveValue('144');
  expect(adjustment.getByLabelText('Note')).toHaveValue(
    'Retained historical DM addition'
  );
  fireEvent.change(adjustment.getByLabelText('Apply to'), {
    target: { value: 'xp-tal' },
  });
  fireEvent.change(adjustment.getByLabelText('XP', { exact: true }), {
    target: { value: '' },
  });
  fireEvent.change(adjustment.getByLabelText('Shares'), {
    target: { value: '2' },
  });
  fireEvent.click(
    adjustment.getByRole('button', { name: 'Apply', exact: true })
  );
  expect(dialog.getByText('2 shares')).toBeInTheDocument();
  expect(dialog.getByText('48')).toBeInTheDocument();
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  const before = doc.xp?.rewards.find((r) => r.id === 'raiders');
  const saved = current.xp?.rewards.find((r) => r.id === 'raiders');
  expect(saved?.rawOverride).toEqual({
    amount: '144',
    reason: 'Retained historical DM addition',
  });
  expect(saved?.recipients[1]).toMatchObject({
    shares: '2',
    allocationOverride: null,
  });
  expect(saved?.recipients[0]).toEqual(before?.recipients[0]);
  expect(saved?.input).toEqual(before?.input);
  expect(saved?.evidence).toEqual(before?.evidence);
  expect(saved?.origin).toEqual(before?.origin);
});

test('money entry needs only value and recipients, then awards or deletes without a recovery status', () => {
  let current = xpCastleDraft();
  function Harness() {
    const [d, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={d}
        sessionId="session-2"
        onChange={(change) => {
          const next = parseCampaign(serializeCampaign(change(d)));
          validateHistoryTransition(d, next, '');
          current = next;
          setDoc(next);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: '+ XP Event' }));
  let dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  fireEvent.change(dialog.getByLabelText('XP event name'), {
    target: { value: '750 electrum' },
  });
  fireEvent.change(dialog.getByLabelText('Category'), {
    target: { value: 'money' },
  });
  expect(
    dialog.getByRole('option', { name: 'Money', exact: true })
  ).toBeInTheDocument();
  expect(dialog.queryByLabelText('Recovery status')).not.toBeInTheDocument();
  expect(dialog.queryByText(/secured|recovered/i)).not.toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('GP equivalent'), {
    target: { value: '375' },
  });
  fireEvent.click(dialog.getByLabelText('All participated'));
  fireEvent.click(dialog.getByLabelText('All receive XP'));
  expect(dialog.getByText('Ratio: 1')).toBeInTheDocument();
  expect(dialog.getAllByText('75')).toHaveLength(5);
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  expect(
    current.xp?.rewards.find((r) => r.title === '750 electrum')?.eligibility
  ).toBeUndefined();
  fireEvent.click(screen.getByRole('button', { name: '+ Award point' }));
  renameNewAward('Money settlement');
  fireEvent.click(screen.getByLabelText('Include 750 electrum'));
  const preview = within(
    screen.getByRole('region', { name: 'Confirm XP award' })
  );
  expect(awardValues(preview)).toEqual(['83', '83', '83', '75', '83']);
  fireEvent.click(preview.getByRole('button', { name: 'Confirm award' }));
  const accepted = current.xp?.events;
  fireEvent.click(screen.getByRole('button', { name: 'Close award' }));
  fireEvent.click(
    screen.getByRole('button', { name: /^750 electrum Awarded/ })
  );
  expect(
    screen.queryByRole('button', { name: 'Delete event' })
  ).not.toBeInTheDocument();
  fireEvent.click(
    within(
      screen.getByRole('dialog', { name: 'Historical XP event' })
    ).getByRole('button', { name: 'Close' })
  );
  fireEvent.click(screen.getByRole('button', { name: '+ XP Event' }));
  dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  fireEvent.change(dialog.getByLabelText('XP event name'), {
    target: { value: 'Mistaken entry' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  fireEvent.click(
    screen.getByRole('button', { name: /^Mistaken entry Pending/ })
  );
  dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Delete event' }));
  expect(current.xp?.rewards.some((r) => r.title === 'Mistaken entry')).toBe(
    false
  );
  expect(
    screen.queryByRole('button', { name: /^Mistaken entry/ })
  ).not.toBeInTheDocument();
  expect(current.xp?.events).toEqual(accepted);
});

test('treasure uses one sale-value field, keeps retained XP separate and saves an explicit cleared value', () => {
  let current = xpCastleDraft();
  function Harness() {
    const [d, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={d}
        sessionId="session-2"
        onChange={(change) => {
          const next = parseCampaign(serializeCampaign(change(d)));
          validateHistoryTransition(d, next, '');
          current = next;
          setDoc(next);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  openFixtureAward();
  fireEvent.click(
    screen.getByRole('button', { name: 'Kept warding scroll', exact: true })
  );
  let dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  expect(dialog.getByLabelText('Sale value (GP)')).toHaveValue('7500');
  expect(dialog.getByLabelText('Retained-item XP')).toHaveValue('1500');
  expect(
    dialog.queryByLabelText('Actual sale proceeds (GP)')
  ).not.toBeInTheDocument();
  expect(
    dialog.queryByLabelText('Market value (GP, reference only)')
  ).not.toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Disposition'), {
    target: { value: 'sell' },
  });
  expect(dialog.getByText('Raw XP: 7500')).toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Sale value (GP)'), {
    target: { value: '6000' },
  });
  expect(dialog.getAllByText('1200')).toHaveLength(5);
  fireEvent.change(dialog.getByLabelText('Disposition'), {
    target: { value: 'keep' },
  });
  expect(dialog.getByText('Raw XP: 1500')).toBeInTheDocument();
  expect(dialog.getByLabelText('Sale value (GP)')).toHaveValue('6000');
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Kept warding scroll', exact: true })
  );
  dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  expect(dialog.getByLabelText('Sale value (GP)')).toHaveValue('6000');
  fireEvent.change(dialog.getByLabelText('Sale value (GP)'), {
    target: { value: '' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Kept warding scroll', exact: true })
  );
  dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  expect(dialog.getByLabelText('Sale value (GP)')).toHaveValue('');
  expect(dialog.getByLabelText('Retained-item XP')).toHaveValue('1500');
});

test('an older treasure draft defaults to full XP and keeps ratio overrides independent of XP adjustments', () => {
  let current = xpCastleDraft();
  const scroll = current.xp?.rewards.find((r) => r.id === 'scroll');
  if (!scroll || scroll.input.category !== 'treasure') throw Error('Fixture');
  scroll.ratio.proposed = null;
  scroll.input.disposition = 'defer';
  const originalCombats = current.workingCombats;
  function Harness() {
    const [d, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={d}
        sessionId="session-2"
        onChange={(change) => {
          current = parseCampaign(serializeCampaign(change(d)));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  openFixtureAward();
  fireEvent.click(
    screen.getByRole('button', { name: 'Kept warding scroll', exact: true })
  );
  let dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  expect(dialog.getByText('Ratio: 1')).toBeInTheDocument();
  expect(
    dialog.getByText('Deferred treasure remains pending.')
  ).toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Disposition'), {
    target: { value: 'keep' },
  });
  expect(dialog.getAllByText('300')).toHaveLength(5);
  fireEvent.click(dialog.getByRole('button', { name: 'Override…' }));
  fireEvent.change(dialog.getByLabelText('Ratio override'), {
    target: { value: '1/2' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Apply override' }));
  expect(dialog.getByText('Ratio: 0.5')).toBeInTheDocument();
  expect(dialog.getAllByText('150')).toHaveLength(5);
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Kept warding scroll', exact: true })
  );
  dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  expect(dialog.getByText('Ratio: 0.5')).toBeInTheDocument();
  fireEvent.click(dialog.getByRole('button', { name: 'Override…' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Use default ratio' }));
  expect(dialog.getAllByText('300')).toHaveLength(5);
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  expect(
    current.xp?.rewards.find((r) => r.id === 'scroll')?.ratio.proposed
  ).toBe('1');
  expect(current.workingCombats).toEqual(originalCombats);
});

test('one award matrix handles inspection, bonus cancellation, final adjustments and immutable correction history', () => {
  let current = xpCastleDraft();
  function Harness() {
    const [d, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={d}
        sessionId="session-2"
        onChange={(change) => {
          const next = parseCampaign(serializeCampaign(change(d)));
          validateHistoryTransition(d, next, '');
          current = next;
          setDoc(next);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  openFixtureAward();
  expect(screen.getAllByRole('table', { name: 'XP award' })).toHaveLength(1);
  const table = within(screen.getByRole('table', { name: 'XP award' }));
  expect(table.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
    'XP event',
    'Mira',
    'Tal',
    'Oren',
    'Nera',
    'Bram',
  ]);
  expect(screen.queryByLabelText('Award label')).not.toBeInTheDocument();
  for (const text of [
    'Recipient bonuses',
    'Selected reward calculations',
    'Final award overrides',
    'Calculated share',
    'Accepted share',
  ])
    expect(screen.queryByText(text, { exact: true })).not.toBeInTheDocument();
  fireEvent.click(
    table.getByRole('button', {
      name: 'Seventeen tunnel raiders: adjusted XP for Mira',
    })
  );
  const detail = within(
    screen.getByRole('dialog', { name: 'XP allocation detail' })
  );
  expect(detail.getByText('Calculated: 25.8')).toBeInTheDocument();
  expect(detail.getByText('Adjusted: 26')).toBeInTheDocument();
  expect(
    detail.getByText('Recorded historical award-row rounding')
  ).toBeInTheDocument();
  fireEvent.click(detail.getByRole('button', { name: 'Close' }));
  expect(screen.getAllByRole('table', { name: 'XP award' })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Mira XP bonus' }));
  let edit = within(screen.getByRole('dialog', { name: 'XP bonus' }));
  fireEvent.change(edit.getByLabelText('XP bonus %'), {
    target: { value: '0' },
  });
  fireEvent.click(edit.getByRole('button', { name: 'Cancel' }));
  expect(
    screen.getByRole('button', { name: 'Confirm award' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Edit Mira XP bonus' })
  ).toHaveTextContent('10%');
  fireEvent.click(screen.getByRole('button', { name: 'Edit Mira XP bonus' }));
  edit = within(screen.getByRole('dialog', { name: 'XP bonus' }));
  fireEvent.change(edit.getByLabelText('XP bonus %'), {
    target: { value: '0' },
  });
  fireEvent.click(edit.getByRole('button', { name: 'Apply' }));
  expect(screen.getByRole('button', { name: 'Confirm award' })).toBeEnabled();
  expect(
    awardValues(within(screen.getByRole('table', { name: 'XP award' })))[0]
  ).toBe('461');
  fireEvent.click(
    screen.getByRole('button', { name: 'Adjust Mira full award' })
  );
  edit = within(screen.getByRole('dialog', { name: 'Full award adjustment' }));
  fireEvent.change(edit.getByLabelText('Full award XP'), {
    target: { value: '400' },
  });
  fireEvent.change(edit.getByLabelText('Reason'), {
    target: { value: 'Recorded DM cap' },
  });
  fireEvent.click(edit.getByRole('button', { name: 'Apply' }));
  expect(screen.getByRole('button', { name: 'Confirm award' })).toBeEnabled();
  expect(
    awardValues(within(screen.getByRole('table', { name: 'XP award' })))[0]
  ).toBe('400 *');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm award' }));
  expect(screen.getAllByRole('table', { name: 'XP award' })).toHaveLength(1);
  expect(
    within(screen.getByRole('dialog', { name: 'XP award' })).getByRole(
      'heading',
      { name: 'At the synthetic refuge' }
    )
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: 'Award name' })
  ).not.toBeInTheDocument();
  const original = JSON.parse(JSON.stringify(current.xp?.events[0]));
  expect(
    screen.queryByRole('button', { name: 'Edit Mira XP bonus' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit award…' }));
  fireEvent.change(screen.getByLabelText('Award name'), {
    target: { value: 'Corrected synthetic award' },
  });
  fireEvent.keyDown(screen.getByLabelText('Award name'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('button', { name: 'Edit Mira XP bonus' }));
  edit = within(screen.getByRole('dialog', { name: 'XP bonus' }));
  fireEvent.change(edit.getByLabelText('XP bonus %'), {
    target: { value: '10' },
  });
  fireEvent.click(edit.getByRole('button', { name: 'Apply' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Adjust Mira full award' })
  );
  edit = within(screen.getByRole('dialog', { name: 'Full award adjustment' }));
  fireEvent.change(edit.getByLabelText('Full award XP'), {
    target: { value: '' },
  });
  fireEvent.click(edit.getByRole('button', { name: 'Apply' }));
  expect(
    awardValues(within(screen.getByRole('table', { name: 'XP award' })))
  ).toEqual(['507', '507', '507', '461', '507']);
  fireEvent.click(screen.getByRole('button', { name: 'Confirm changes' }));
  expect(current.xp?.events).toHaveLength(2);
  expect(
    screen.getByRole('button', { name: /^Corrected synthetic award Confirmed/ })
  ).toBeInTheDocument();
  expect(current.xp?.events[0]).toEqual(original);
  expect(parseCampaign(serializeCampaign(current)).xp?.events).toEqual(
    current.xp?.events
  );
});

test('timeline events and awards open modals without automatically showing an award or changing its history', () => {
  let current = parseCampaign(JSON.stringify(replay.confirmed));
  const before = serializeCampaign(current);
  function Harness() {
    const [d, setDoc] = useState(current);
    return (
      <CampaignXp
        onConfirmExtension={async () => undefined}
        document={d}
        sessionId="session-2"
        onChange={(change) => {
          const next = parseCampaign(serializeCampaign(change(d)));
          validateHistoryTransition(d, next, '');
          current = next;
          setDoc(next);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  expect(
    screen.queryByRole('table', { name: 'XP award' })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: /^At the synthetic refuge Confirmed/ })
  );
  let award = within(screen.getByRole('dialog', { name: 'XP award' }));
  expect(award.getByRole('table', { name: 'XP award' })).toBeInTheDocument();
  fireEvent.click(award.getByRole('button', { name: 'Close award' }));
  expect(
    screen.queryByRole('table', { name: 'XP award' })
  ).not.toBeInTheDocument();
  expect(serializeCampaign(current)).toBe(before);
  fireEvent.click(
    screen.getByRole('button', { name: /^Later alarm fungus Pending/ })
  );
  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'XP event review' })).getByRole(
      'button',
      { name: 'Cancel' }
    )
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: /^At the synthetic refuge Confirmed/ })
  );
  award = within(screen.getByRole('dialog', { name: 'XP award' }));
  fireEvent.click(award.getByRole('button', { name: 'Edit award…' }));
  expect(screen.queryByLabelText('Reason for changes')).not.toBeInTheDocument();
  expect(current.xp?.events).toEqual(JSON.parse(before).xp.events);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(
    screen.queryByRole('dialog', { name: 'XP award' })
  ).not.toBeInTheDocument();
  expect(current.xp?.events).toEqual(JSON.parse(before).xp.events);
});

test('live recipient decisions preview, cancel, and confirm without changing the source', () => {
  let current = xpCastleDraft();
  current = confirmXpAward(
    current,
    'refuge-point',
    previewXpAward(current, 'refuge-point').fingerprint,
    'castle-confirmed',
    '2026-11-07T12:00:00.000Z'
  );
  const source = pendingFungus(current);
  current = saveXpReward(current, source);
  current = saveXpPoint(current, {
    ...newXpPoint(current, 'session-2', 'split'),
    label: 'Split shrieker',
  });
  current = selectXpRewards(current, 'split', [source.id]);
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignXp
        document={doc}
        sessionId="session-2"
        onConfirmExtension={async () => undefined}
        onChange={(change) => {
          const next = parseCampaign(serializeCampaign(change(doc)));
          validateHistoryTransition(doc, next, '');
          current = next;
          setDoc(next);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  const open = () => {
    fireEvent.click(screen.getByRole('button', { name: /^Split shrieker/ }));
    return within(screen.getByRole('dialog', { name: 'XP award' }));
  };
  let dialog = open();
  const choose = () => {
    fireEvent.change(
      dialog.getByLabelText('Later alarm fungus: settlement for Tal'),
      { target: { value: 'forfeit' } }
    );
    fireEvent.change(
      dialog.getByLabelText('Later alarm fungus: settlement for Oren'),
      { target: { value: 'later' } }
    );
  };
  choose();
  expect(dialog.getByRole('row', { name: /^Awarded/ })).toHaveTextContent(
    '250023'
  );
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  expect(xpLedger(current).events).toHaveLength(1);
  dialog = open();
  expect(
    dialog.getByLabelText('Later alarm fungus: settlement for Oren')
  ).toHaveValue('award');
  choose();
  fireEvent.click(dialog.getByRole('button', { name: 'Confirm award' }));
  expect(xpLedger(current).events).toHaveLength(2);
  expect(xpLedger(current).events[1]?.rows.map((r) => r.after)).toEqual([
    532, 484,
  ]);
  expect(xpLedger(current).rewards.find((r) => r.id === source.id)).toEqual(
    source
  );
});

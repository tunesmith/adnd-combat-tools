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
  if (!dialog.queryByLabelText('Rename award'))
    fireEvent.keyDown(
      dialog.getByRole('button', { name: 'New award', exact: true }),
      { key: 'F2' }
    );
  fireEvent.change(dialog.getByLabelText('Rename award'), {
    target: { value: label },
  });
  fireEvent.keyDown(dialog.getByLabelText('Rename award'), { key: 'Enter' });
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
  let dialog = within(screen.getByRole('dialog', { name: 'Opening XP' }));
  expect(dialog.getByLabelText('Mira opening XP')).toHaveValue(null);
  fireEvent.click(
    dialog.getByRole('button', { name: 'Set listed unlocked balances to 0' })
  );
  fireEvent.click(
    dialog.getByRole('button', { name: 'Save opening balances' })
  );
  expect(sessionXpBalances(current, 'xp-mira', 'session-1').closing).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: '+ Award point' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Kept warding scroll', exact: true })
  );
  dialog = within(screen.getByRole('dialog', { name: 'XP event review' }));
  expect(
    dialog.queryByLabelText(
      'I reviewed the inputs, participation and eligible recipients'
    )
  ).not.toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Disposition'), {
    target: { value: 'keep' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save XP event' }));
  renameNewAward('At the test refuge');
  expect(screen.queryByLabelText('Position')).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Move At the test refuge earlier' })
  );
  for (const title of [
    'Seventeen tunnel raiders',
    'Recovered coin lots',
    'Kept warding scroll',
  ])
    fireEvent.click(screen.getByLabelText(`Include ${title}`));
  expect(screen.getByLabelText('Include Later alarm fungus')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Edit Mira XP bonus' })
  ).toHaveTextContent('10%');
  expect(
    screen.getByRole('button', { name: 'Edit Nera XP bonus' })
  ).toHaveTextContent('0%');
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
  const preview = within(
    screen.getByRole('region', { name: 'Confirm XP award' })
  );
  expect(awardValues(preview)).toEqual(['507', '507', '507', '461', '507']);
  expect(xpLedger(current).events).toHaveLength(0);
  fireEvent.click(preview.getByRole('button', { name: 'Confirm award' }));
  expect(xpLedger(current).events).toHaveLength(1);
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
  fireEvent.change(adjustment.getByLabelText('Apply to'), {
    target: { value: 'raw' },
  });
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
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
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
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
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
  expect(
    screen.queryByRole('button', { name: 'Confirm award' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
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
  expect(
    screen.queryByRole('button', { name: 'Confirm award' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
  expect(
    awardValues(within(screen.getByRole('table', { name: 'XP award' })))[0]
  ).toBe('400 *');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm award' }));
  expect(screen.getAllByRole('table', { name: 'XP award' })).toHaveLength(1);
  const original = JSON.parse(JSON.stringify(current.xp?.events[0]));
  expect(
    screen.queryByRole('button', { name: 'Edit Mira XP bonus' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit award…' }));
  fireEvent.change(screen.getByLabelText('Reason for changes'), {
    target: { value: 'Remove the historical cap and restore bonus' },
  });
  fireEvent.keyDown(
    within(screen.getByRole('dialog', { name: 'XP award' })).getByRole(
      'button',
      { name: 'At the synthetic refuge', exact: true }
    ),
    { key: 'F2' }
  );
  fireEvent.change(screen.getByLabelText('Rename award'), {
    target: { value: 'Corrected synthetic award' },
  });
  fireEvent.keyDown(screen.getByLabelText('Rename award'), { key: 'Enter' });
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
  fireEvent.click(screen.getByRole('button', { name: 'Preview award' }));
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
  expect(screen.getByLabelText('Reason for changes')).toBeInTheDocument();
  expect(current.xp?.events).toEqual(JSON.parse(before).xp.events);
  fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
  expect(
    screen.queryByRole('dialog', { name: 'XP award' })
  ).not.toBeInTheDocument();
  expect(current.xp?.events).toEqual(JSON.parse(before).xp.events);
});

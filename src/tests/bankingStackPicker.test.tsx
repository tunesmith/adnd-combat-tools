/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import BankTransactionDialog from '../components/desktop/BankTransactionDialog';
import {
  existingBankFixture,
  existingLeg,
  receiptAt,
} from './fixtures/bankingExisting';
import type { BankEntry } from '../helpers/campaignBankingModel';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import type { CampaignDocument } from '../helpers/campaignDocument';
import { newBankMoneyItem } from '../helpers/campaignBanking';

beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `picker-${++id}` },
  });
});
function fixture() {
  const doc = existingBankFixture();
  const holder = doc.workingInventories[0]?.document.characters[0];
  if (!holder) throw Error('Missing fixture holder');
  const a = existingLeg(doc, holder.id, 'electrum-300', 0).item,
    b = existingLeg(doc, holder.id, 'electrum-400', 0).item;
  for (const item of [a, b])
    Object.assign(item, {
      name: '$ - 750 electrum',
      quantity: 42,
      containerId: 'pouch-a',
      dmNotes: 'Secret DM note',
    });
  a.playerNotes = '  from hobgoblins  ';
  b.playerNotes = 'from\n  fire beetles ' + 'x'.repeat(100);
  return { doc, holder, a, b };
}
function open(doc: CampaignDocument, entry?: BankEntry) {
  const onChange = jest.fn(
    (change: (d: CampaignDocument) => CampaignDocument) => {
      doc = change(doc);
      return true;
    }
  );
  render(
    <BankTransactionDialog
      document={doc}
      sessionId="day1"
      entry={entry}
      onChange={onChange}
      onClose={() => undefined}
    />
  );
  return { onChange, current: () => doc };
}
const stack = (row: number) => screen.getByLabelText(`Change ${row} stack`);
const select = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const add = () =>
  fireEvent.click(screen.getByRole('button', { name: '+ Money change' }));
const option = (row: number, id: string) =>
  Array.from(within(stack(row)).getAllByRole<HTMLOptionElement>('option')).find(
    (o) => o.value === id
  );

test('source labels and reciprocal reservations follow visible selections even at zero quantity', () => {
  const { doc, a, b } = fixture();
  const before = JSON.stringify(doc);
  const { onChange } = open(doc);
  select('Change 1 denomination', 'ep');
  expect(option(1, a.id)?.textContent).toBe(
    '$ - 750 electrum · 42 · Pouch A · from hobgoblins'
  );
  expect(option(1, b.id)?.textContent).toMatch(
    /42 · Pouch A · from fire beetles x{1,70}…$/
  );
  expect(stack(1)).not.toHaveTextContent('Secret DM note');
  add();
  expect(stack(1)).toHaveValue(a.id);
  expect(stack(2)).toHaveValue(b.id);
  expect(option(2, a.id)).toBeUndefined();
  expect(option(1, b.id)).toBeUndefined();
  select('Change 2 stack', 'new:pouch-a');
  expect(option(1, b.id)).toBeDefined();
  select('Change 1 stack', b.id);
  expect(option(2, b.id)).toBeUndefined();
  expect(option(2, a.id)).toBeDefined();
  select('Change 2 denomination', 'sp');
  expect(option(2, 'silver-1000')?.textContent).toMatch(/Invisible chest$/);
  select('Change 2 denomination', 'ep');
  expect(stack(2)).toHaveValue(a.id);
  fireEvent.click(screen.getByRole('button', { name: 'Remove change 2' }));
  expect(option(1, a.id)).toBeDefined();
  expect(onChange).not.toHaveBeenCalled();
  expect(JSON.stringify(doc)).toBe(before);
});

test('editing keeps repeated evidence IDs and quantities, including consumed stacks', () => {
  const { doc, holder, a, b } = fixture();
  const gone = { ...a, id: 'spent', playerNotes: 'from the vault' };
  const entry: BankEntry = {
    id: 'posted',
    transactionId: 'training',
    sessionId: 'day1',
    description: 'Training',
    kind: 'purchase',
    status: 'posted',
    effect: 'inventory',
    order: 0,
    replaces: null,
    at: receiptAt,
    changes: [
      {
        holderId: holder.id,
        denomination: 'ep',
        item: { ...a, playerNotes: 'old source', quantity: 750 },
        quantity: -3,
      },
      { holderId: holder.id, denomination: 'ep', item: a, quantity: -5 },
      { holderId: holder.id, denomination: 'ep', item: gone, quantity: -42 },
    ],
  };
  const state = JSON.stringify(entry);
  const { onChange } = open(doc, entry);
  expect(stack(1)).toHaveValue(a.id);
  expect(stack(2)).toHaveValue(a.id);
  expect(stack(3)).toHaveValue('spent');
  expect(option(1, a.id)?.textContent).toContain(
    '42 · available 45 · Pouch A · from hobgoblins'
  );
  expect(option(3, 'spent')?.textContent).toContain(
    '0 · Pouch A · from the vault'
  );
  expect(screen.getByLabelText('Change 1 quantity')).toHaveValue(-3);
  expect(screen.getByLabelText('Change 2 quantity')).toHaveValue(-5);
  expect(option(3, a.id)).toHaveTextContent('available 42');
  add();
  expect(stack(4)).toHaveValue(b.id);
  expect(onChange).not.toHaveBeenCalled();
  expect(JSON.stringify(entry)).toBe(state);
});

test('two new stacks in one container keep distinct IDs and post one transaction', () => {
  const { doc } = fixture();
  const { current, onChange } = open(doc);
  select('Description', 'New lots');
  select('Transaction type', 'income');
  select('Change 1 stack', 'new:pouch-a');
  select('Change 1 quantity', '4');
  add();
  select('Change 2 stack', 'new:pouch-a');
  select('Change 2 quantity', '5');
  select('Session', '4');
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));
  expect(onChange).toHaveBeenCalledTimes(1);
  const changes = current().banking?.entries.at(-1)?.changes ?? [];
  expect(changes.map((c) => [c.item.containerId, c.quantity])).toEqual([
    ['pouch-a', 4],
    ['pouch-a', 5],
  ]);
  expect(new Set(changes.map((c) => c.item.id)).size).toBe(2);
  const inventory =
    current().workingInventories[0]?.document.characters[0]?.inventory;
  for (const c of changes)
    expect(inventory?.find((i) => i.id === c.item.id)?.quantity).toBe(
      c.quantity
    );
  expect(current().xp).toEqual(doc.xp);
});

test('switching to existing income reserves zero-quantity defaults and leaves an exhausted holder unselected', () => {
  const { doc, a, b } = fixture();
  open(doc);
  select('Transaction type', 'income');
  select('Change 1 denomination', 'ep');
  add();
  select('Money in possessions', 'existing');
  expect(stack(1)).toHaveValue(a.id);
  expect(stack(2)).toHaveValue(b.id);
  fireEvent.click(screen.getByRole('button', { name: '+ Stack' }));
  select('Change 3 holder', 'reatha-inventory');
  expect(stack(3)).toHaveValue('');
  expect(option(3, a.id)).toBeUndefined();
  expect(option(3, b.id)).toBeUndefined();
});

test('an equal item ID under another holder is independent of this holder’s reservation', () => {
  const { doc, a } = fixture();
  const other = doc.workingInventories[0]?.document.characters[1];
  if (!other) throw Error('Missing holder');
  other.inventory = [
    {
      ...newBankMoneyItem('ep', a.id),
      quantity: 12,
      playerNotes: 'other holder',
    },
  ];
  open(doc);
  select('Change 1 denomination', 'ep');
  add();
  select('Change 2 holder', other.id);
  expect(stack(1)).toHaveValue(a.id);
  expect(stack(2)).toHaveValue(a.id);
  expect(option(2, a.id)?.textContent).toContain('12 · other holder');
});

test('existing settlement mode chooses distinct incoming defaults when switching multiple rows', () => {
  const { doc, a, b } = fixture();
  open(doc);
  select('Transaction type', 'exchange');
  select('Change 1 denomination', 'ep');
  select('Change 1 quantity', '10');
  add();
  select('Change 2 quantity', '20');
  select('Money in possessions', 'existing');
  expect(stack(1)).toHaveValue(a.id);
  expect(stack(2)).toHaveValue(b.id);
  expect(option(1, b.id)).toHaveTextContent('available 22');
  expect(option(2, a.id)).toHaveTextContent('available 32');
  expect(option(2, b.id)?.textContent).toMatch(
    /^Incoming · .*current 42 · available .*from fire beetles/
  );
});

test('partial payments expose the remainder, full payments hide it, and edits release it', () => {
  const { doc, a, b } = fixture();
  open(doc);
  select('Change 1 denomination', 'ep');
  select('Change 1 quantity', '-12');
  add();
  expect(stack(2)).toHaveValue(b.id);
  expect(option(2, a.id)).toHaveTextContent('available 30');
  select('Change 2 stack', a.id);
  select('Change 2 quantity', '-30');
  add();
  expect(option(3, a.id)).toBeUndefined();
  expect(option(1, a.id)).toHaveTextContent('available 12');
  select('Change 1 quantity', '-10');
  expect(option(3, a.id)).toHaveTextContent('available 2');
  fireEvent.click(screen.getByRole('button', { name: 'Remove change 2' }));
  expect(option(2, a.id)).toHaveTextContent('available 32');
});

test.each(['purchase', 'fee'] as const)(
  'reopens a posted %s with the full training tender even after the stacks were spent',
  (kind) => {
    const { doc, holder } = fixture();
    const before = JSON.stringify(doc);
    const tender = [
      ['diamond', -2],
      ['ep', -750],
      ['ep', -750],
      ['ep', -750],
      ['sp', -1000],
      ['sp', -1000],
      ['sp', -885],
      ['sp', -115],
      ['sp', -415],
      ['sp', -85],
    ] as const;
    const { onChange } = open(doc, {
      id: 'posted',
      transactionId: 'training',
      at: receiptAt,
      sessionId: 'day1',
      kind,
      order: 0,
      status: 'posted',
      effect: 'inventory',
      replaces: null,
      description: 'Training',
      changes: tender.map(([denomination, quantity], i) => ({
        holderId: holder.id,
        denomination,
        quantity,
        item: newBankMoneyItem(denomination, `spent-${i}`),
      })),
    });
    expect(screen.getByLabelText('Payment total')).toHaveTextContent(
      'Payment total: 1,500 gp'
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(JSON.stringify(doc)).toBe(before);
  }
);

test('payment total follows signed draft quantities, independently of save readiness', () => {
  const { doc } = fixture();
  const { onChange } = open(doc);
  const total = () => screen.getByLabelText('Payment total').textContent;
  expect(total()).toBe('Payment total: 0 gp');
  select('Change 1 quantity', '-10');
  add();
  select('Change 2 denomination', 'sp');
  select('Change 2 quantity', '20');
  expect(total()).toBe('Payment total: 9 gp');
  select('Change 2 denomination', 'cp');
  expect(total()).toBe('Payment total: 9.9 gp');
  select('Change 2 quantity', '1001');
  expect(total()).toBe('Payment total: 4.995 gp');
  select('Change 2 quantity', '0.5');
  expect(total()).toBe('Payment total: —');
  select('Change 2 quantity', '');
  expect(total()).toBe('Payment total: 10 gp');
  select('Change 2 denomination', 'gp');
  select('Change 2 stack', 'gold-250');
  select('Change 2 quantity', '-5');
  expect(total()).toBe('Payment total: 15 gp');
  select('Change 2 holder', 'vitameno-inventory');
  expect(total()).toBe('Payment total: 15 gp');
  select('Change 2 quantity', '-9007199254740991');
  expect(total()).toBe('Payment total: —');
  select('Change 2 quantity', '9007199254740992');
  expect(total()).toBe('Payment total: —');
  fireEvent.click(screen.getByLabelText('Remove change 2'));
  expect(total()).toBe('Payment total: 10 gp');
  for (const kind of ['income', 'transfer', 'exchange']) {
    select('Transaction type', kind);
    expect(screen.queryByLabelText('Payment total')).not.toBeInTheDocument();
  }
  select('Transaction type', 'purchase');
  select('Change 1 denomination', 'emerald');
  select('Change 1 quantity', '-3');
  expect(total()).toBe('Payment total: 1,500 gp');
  expect(
    screen.getByRole('button', { name: 'Save transaction' })
  ).toBeDisabled();
  expect(onChange).not.toHaveBeenCalled();
});

test.each([
  ['The Attack', 86, 'emerald', 3, 'new:'],
  ['Act 10', 6, 'pp', 100, 'new:pouch-a'],
  ['Interlude', undefined, 'pp', 100, 'new:'],
] as const)(
  'new Income stacks use the stored number in %s, allowing manual entry',
  (label, sessionNumber, code, quantity, target) => {
    const { doc } = fixture();
    doc.sessions = [
      { id: 'unrelated', label: 'Day 22', sessionNumber: 22 },
      ...doc.sessions.map((s) => ({ ...s, label, sessionNumber })),
    ];
    const h = open(doc);
    select('Description', 'Reviewed income');
    select('Transaction type', 'income');
    select('Change 1 denomination', code);
    select('Change 1 stack', target);
    select('Change 1 quantity', String(quantity));
    const field = screen.getByLabelText('Session');
    if (sessionNumber === undefined) {
      expect(field).toHaveValue(null);
      expect(
        screen.getByRole('button', { name: 'Save transaction' })
      ).toBeDisabled();
      select('Session', '0');
    } else expect(field).toHaveValue(sessionNumber);
    fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));
    expect(h.onChange).toHaveBeenCalledTimes(1);
    const saved = h.current(),
      entry = saved.banking?.entries.at(-1),
      c = entry?.changes[0];
    const day = sessionNumber ?? 0;
    expect(c?.item).toMatchObject({
      day,
      containerId: target === 'new:' ? null : 'pouch-a',
    });
    expect(
      saved.workingInventories[0]?.document.characters[0]?.inventory.find(
        (i) => i.id === c?.item.id
      )
    ).toMatchObject({ day, quantity });
    expect(saved.xp).toEqual(doc.xp);
  }
);

test('editing an Income from another workspace session preserves old stack days and dates only a new destination', () => {
  const { doc } = fixture();
  doc.sessions[0] = { id: 'day1', label: 'Day6', sessionNumber: 6 };
  const first = open(doc);
  select('Transaction type', 'income');
  select('Description', 'Receipt');
  select('Change 1 quantity', '2');
  expect(screen.queryByLabelText('Session')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));
  const saved = first.current(),
    entry = saved.banking?.entries.at(-1);
  if (!entry) throw Error('Missing receipt');
  const retained = entry.changes[0]?.item;
  expect(retained?.day).toBe(0);
  cleanup();
  saved.sessions = [
    { id: 'another', label: 'Day 99', sessionNumber: 99 },
    ...saved.sessions,
  ];
  let edited = saved;
  render(
    <BankTransactionDialog
      document={saved}
      sessionId="another"
      entry={entry}
      onChange={(change) => {
        edited = change(saved);
        return true;
      }}
      onClose={() => undefined}
    />
  );
  expect(screen.queryByLabelText('Session')).toBeNull();
  add();
  select('Change 2 denomination', 'pp');
  select('Change 2 quantity', '100');
  expect(screen.getByLabelText('Session')).toHaveValue(6);
  select('Session', '4');
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));
  const revision = edited.banking?.entries.at(-1);
  expect(revision?.sessionId).toBe('day1');
  expect(revision?.changes.map((c) => c.item.day)).toEqual([0, 4]);
  expect(edited.banking?.entries[0]).toEqual(entry);
  const reopened = parseCampaign(
    serializeCampaign({
      ...edited,
      sessions: edited.sessions.map((s) => ({ ...s, label: 'Day 70' })),
    })
  );
  expect(
    reopened.banking?.entries.at(-1)?.changes.map((c) => c.item.day)
  ).toEqual([0, 4]);
});

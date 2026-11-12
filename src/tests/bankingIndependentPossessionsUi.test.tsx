/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { transferInventorySubtree } from '../helpers/encumbranceStorage';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CampaignBanking from '../components/desktop/CampaignBanking';
import BankTransactionDialog from '../components/desktop/BankTransactionDialog';
import { bankFixture } from './fixtures/bankingKifu';
import {
  staleCarriedMoney,
  staleHolder,
} from './fixtures/bankingStalePossessions';
import { changeWorkingInventory } from '../helpers/campaignWorkingInventory';
import {
  bankBalance,
  bankLedger,
  holderMoney,
  newBankMoneyItem,
} from '../helpers/campaignBanking';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
const holder = 'inventory-vitameno';
function manualCoins(ep: number, gp = 0) {
  const before = bankFixture(),
    work = before.workingInventories.find((w) => w.sessionId === 'day3');
  if (!work) throw Error('Fixture');
  const inventory = JSON.parse(
    JSON.stringify(work.document)
  ) as typeof work.document;
  const character = inventory.characters.find((c) => c.id === holder);
  if (!character) throw Error('Fixture');
  character.inventory = [];
  if (ep)
    character.inventory.push({
      ...newBankMoneyItem('ep', 'left-electrum'),
      quantity: ep,
    });
  if (gp)
    character.inventory.push({
      ...newBankMoneyItem('gp', 'converted-gold'),
      quantity: gp,
    });
  return changeWorkingInventory(before, work.id, 'day3', inventory);
}
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `independent-ui-${++id}` },
  });
});

test('all four transaction types offer the existing-possessions mode and Payment records an already-spent amount once', () => {
  let current = manualCoins(30);
  const before = current;
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignBanking
        document={doc}
        sessionId="day3"
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
  expect(
    screen.queryByRole('button', { name: 'Reconcile possessions to ledger…' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '+ Transaction' }));
  let dialog = within(
    screen.getByRole('dialog', { name: 'Banking transaction' })
  );
  for (const kind of ['income', 'purchase', 'transfer', 'exchange']) {
    fireEvent.change(dialog.getByLabelText('Transaction type'), {
      target: { value: kind },
    });
    expect(dialog.getByLabelText('Money in possessions')).toBeInTheDocument();
  }
  fireEvent.change(dialog.getByLabelText('Transaction type'), {
    target: { value: 'purchase' },
  });
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Repair the lantern' },
  });
  fireEvent.change(dialog.getByLabelText('Money in possessions'), {
    target: { value: 'existing' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 holder'), {
    target: { value: holder },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 denomination'), {
    target: { value: 'ep' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '-20' },
  });
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeEnabled();
  expect(
    dialog.getByText('No remaining reconciliation difference.')
  ).toBeInTheDocument();
  expect(current).toBe(before);
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  expect(bankBalance(current, holder, 'day3').ep).toBe(30);
  expect(current.workingInventories).toEqual(before.workingInventories);
  expect(bankLedger(current).entries).toHaveLength(1);
  expect(bankLedger(current).entries[0]?.effect).toBe('ledger');
  fireEvent.click(screen.getByRole('button', { name: 'Repair the lantern' }));
  dialog = within(screen.getByRole('dialog', { name: 'Banking transaction' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Delete transaction' }));
  expect(bankBalance(current, holder, 'day3').ep).toBe(50);
  expect(current.workingInventories).toEqual(before.workingInventories);
});

test('an already-recorded exchange shows partial progress, previews ledger totals, and leaves converted coins intact', () => {
  let current = manualCoins(0, 25);
  const before = current;
  const onChange = (change: (d: typeof current) => typeof current) => {
    const next = parseCampaign(serializeCampaign(change(current)));
    validateHistoryTransition(current, next, '');
    current = next;
    return true;
  };
  render(
    <BankTransactionDialog
      document={current}
      sessionId="day3"
      onChange={onChange}
      onClose={() => undefined}
    />
  );
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Transaction type'), {
    target: { value: 'exchange' },
  });
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Record the exchange' },
  });
  fireEvent.change(dialog.getByLabelText('Money in possessions'), {
    target: { value: 'existing' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 holder'), {
    target: { value: holder },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 denomination'), {
    target: { value: 'ep' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '-50' },
  });
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeDisabled();
  expect(dialog.getByRole('status')).toHaveTextContent(
    'Still to enter: +25 gp of value.'
  );
  fireEvent.click(dialog.getByRole('button', { name: '+ Money change' }));
  fireEvent.change(dialog.getByLabelText('Change 2 denomination'), {
    target: { value: 'gp' },
  });
  fireEvent.change(dialog.getByLabelText('Change 2 quantity'), {
    target: { value: '25' },
  });
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeEnabled();
  expect(dialog.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  expect(current.workingInventories).toEqual(before.workingInventories);
  expect(bankBalance(current, holder, 'day3')).toMatchObject({ ep: 0, gp: 25 });
});

test('deleting stale coins directly resolves the earlier loss with no special action and no new transaction', () => {
  let doc = staleCarriedMoney();
  const before = doc,
    work = doc.workingInventories.find((w) => w.sessionId === 'day3');
  if (!work) throw Error('Fixture');
  const inventory = JSON.parse(
    JSON.stringify(work.document)
  ) as typeof work.document;
  const character = inventory.characters.find((c) => c.id === staleHolder);
  if (!character) throw Error('Fixture');
  character.inventory = character.inventory.filter(
    (i) => i.id !== 'stale-ep-0'
  );
  doc = changeWorkingInventory(doc, work.id, 'day3', inventory);
  validateHistoryTransition(before, doc, '');
  render(
    <CampaignBanking document={doc} sessionId="day3" onChange={() => true} />
  );
  expect(
    screen.queryByRole('button', { name: 'Reconcile possessions to ledger…' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: 'Balances to reconcile' })
  ).not.toBeInTheDocument();
  expect(bankLedger(doc).entries).toEqual(bankLedger(before).entries);
  expect(holderMoney(inventory, staleHolder).ep).toBe(0);
  expect(bankBalance(doc, staleHolder, 'day3').ep).toBe(0);
});

test('changing an incoming exchange holder after entering quantity chooses that holder’s stack', () => {
  let doc = manualCoins(0, 25);
  const work = doc.workingInventories.find((w) => w.sessionId === 'day3');
  if (!work || work.document.version !== 10) throw Error('Fixture');
  doc = changeWorkingInventory(
    doc,
    work.id,
    'day3',
    transferInventorySubtree(
      work.document,
      'converted-gold',
      holder,
      'inventory-reatha'
    )
  );
  render(
    <BankTransactionDialog
      document={doc}
      sessionId="day3"
      onChange={() => true}
      onClose={() => undefined}
    />
  );
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Transaction type'), {
    target: { value: 'exchange' },
  });
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Exchange and give the gold to another holder' },
  });
  fireEvent.change(dialog.getByLabelText('Money in possessions'), {
    target: { value: 'existing' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 holder'), {
    target: { value: holder },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 denomination'), {
    target: { value: 'ep' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '-50' },
  });
  fireEvent.click(dialog.getByRole('button', { name: '+ Money change' }));
  fireEvent.change(dialog.getByLabelText('Change 2 denomination'), {
    target: { value: 'gp' },
  });
  fireEvent.change(dialog.getByLabelText('Change 2 quantity'), {
    target: { value: '25' },
  });
  fireEvent.change(dialog.getByLabelText('Change 2 holder'), {
    target: { value: 'inventory-reatha' },
  });
  expect(dialog.getByLabelText('Change 2 stack')).toHaveValue('converted-gold');
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeEnabled();
});

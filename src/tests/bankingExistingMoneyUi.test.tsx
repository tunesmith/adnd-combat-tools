/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CampaignBanking from '../components/desktop/CampaignBanking';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  bankBalance,
  bankBoundaryDifference,
  previewBankTransaction,
  commitBankTransaction,
} from '../helpers/campaignBanking';
import {
  existingBankFixture,
  bureauReceipt,
  existingLeg,
  receiptAt,
} from './fixtures/bankingExisting';
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `existing-ui-${++id}` },
  });
});
test('the editor allocates an existing receipt across three stacks, previews the difference and retains its mode on reopen', () => {
  let current = existingBankFixture();
  const before = serializeCampaign(current),
    physical = current.workingInventories;
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignBanking
        document={doc}
        sessionId="day1"
        onChange={(edit) => {
          const next = parseCampaign(serializeCampaign(edit(doc)));
          validateHistoryTransition(doc, next, '');
          current = next;
          setDoc(next);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: '+ Transaction' }));
  let dialog = within(
    screen.getByRole('dialog', { name: 'Banking transaction' })
  );
  expect(
    within(dialog.getByLabelText('Transaction type'))
      .getAllByRole('option')
      .map((o) => o.textContent)
  ).toEqual(['Income', 'Payment', 'Transfer', 'Exchange']);
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Bureau treasure — 750 electrum' },
  });
  fireEvent.change(dialog.getByLabelText('Transaction type'), {
    target: { value: 'income' },
  });
  expect(dialog.getByLabelText('Money in possessions')).toHaveValue('add');
  fireEvent.change(dialog.getByLabelText('Money in possessions'), {
    target: { value: 'existing' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 denomination'), {
    target: { value: 'ep' },
  });
  expect(
    dialog.queryByRole('option', { name: /New stack/ })
  ).not.toBeInTheDocument();
  expect(
    dialog.getByRole('option', { name: /current 300.*available 300/ })
  ).toHaveTextContent('300');
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '300' },
  });
  fireEvent.click(dialog.getByRole('button', { name: '+ Stack' }));
  expect(
    dialog.getByRole('table', { name: 'Proposed ledger balances' })
  ).toHaveTextContent('300');
  expect(
    dialog.getByText('Ledger balances after saving', { selector: 'caption' })
  ).toBeInTheDocument();
  expect(
    dialog.getByText('Still to record', { selector: 'caption' })
  ).toBeInTheDocument();
  expect(dialog.getByLabelText('Change 2 stack')).toHaveValue('electrum-400');
  expect(
    within(dialog.getByLabelText('Change 2 stack')).queryByRole('option', {
      name: /current 300/,
    })
  ).not.toBeInTheDocument();
  expect(dialog.getByText('Enter quantity')).toBeInTheDocument();
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeDisabled();

  fireEvent.change(dialog.getByLabelText('Change 2 denomination'), {
    target: { value: 'ep' },
  });
  fireEvent.change(dialog.getByLabelText('Change 2 stack'), {
    target: { value: 'electrum-400' },
  });
  fireEvent.change(dialog.getByLabelText('Change 2 quantity'), {
    target: { value: '400' },
  });
  fireEvent.click(dialog.getByRole('button', { name: '+ Stack' }));
  expect(dialog.getByLabelText('Change 3 holder')).toHaveValue(
    'vitameno-inventory'
  );
  expect(dialog.getByLabelText('Change 3 denomination')).toHaveValue('ep');
  expect(dialog.getByLabelText('Change 3 stack')).toHaveValue('electrum-50');
  expect(
    dialog.getByRole('table', { name: 'Proposed ledger balances' })
  ).toHaveTextContent('700');

  fireEvent.change(dialog.getByLabelText('Change 3 holder'), {
    target: { value: 'vitameno-inventory' },
  });
  fireEvent.change(dialog.getByLabelText('Change 3 denomination'), {
    target: { value: 'ep' },
  });
  fireEvent.change(dialog.getByLabelText('Change 3 quantity'), {
    target: { value: '50' },
  });
  const projection = within(
    dialog.getByRole('table', { name: 'Proposed ledger balances' })
  );
  expect(projection.getByRole('row', { name: /Reatha/ })).toHaveTextContent(
    '700'
  );
  expect(projection.getByRole('row', { name: /Vitameno/ })).toHaveTextContent(
    '50'
  );
  expect(
    dialog.getByRole('table', { name: 'Remaining differences' })
  ).toHaveTextContent('1,000');
  expect(serializeCampaign(current)).toBe(before);
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  expect(current.banking?.entries).toHaveLength(1);
  expect(current.workingInventories).toEqual(physical);
  expect(bankBalance(current, 'reatha-inventory', 'day1').ep).toBe(700);
  expect(
    screen.getByText(/Income · Already recorded in possessions/)
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Bureau treasure — 750 electrum' })
  );
  dialog = within(screen.getByRole('dialog', { name: 'Banking transaction' }));
  expect(dialog.getByLabelText('Money in possessions')).toBeDisabled();
  expect(dialog.getByLabelText('Money in possessions')).toHaveValue('existing');
  expect(
    dialog.getByRole('table', { name: 'Recorded receipt allocations' })
  ).toHaveTextContent('300');
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeEnabled();
  fireEvent.click(dialog.getByRole('button', { name: 'Delete transaction' }));
  expect(bankBalance(current, 'reatha-inventory', 'day1').ep).toBe(0);
  expect(
    bankBoundaryDifference(current, 'day1').find(
      (r) => r.holderId === 'reatha-inventory'
    )?.difference.ep
  ).toBe(700);
  expect(current.workingInventories).toEqual(physical);
});

test('Banking shows remaining denominations and a visible adjustment action, then hides the section after the final receipt', () => {
  let current = existingBankFixture();
  const silver = {
    transactionId: 'silver',
    sessionId: 'day1',
    description: 'Invisible chest silver',
    kind: 'income' as const,
    receiptMode: 'existing' as const,
    changes: [existingLeg(current, 'reatha-inventory', 'silver-1000', 1000)],
  };
  for (const request of [bureauReceipt(current), silver]) {
    const preview = previewBankTransaction(current, request);
    current = commitBankTransaction(
      current,
      request,
      preview.fingerprint,
      'setup-' + request.transactionId,
      receiptAt
    );
  }
  const physical = current.workingInventories;
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignBanking
        document={doc}
        sessionId="day1"
        onChange={(edit) => {
          const next = parseCampaign(serializeCampaign(edit(doc)));
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
    screen
      .getAllByRole('table')
      .map((table) => table.getAttribute('aria-label'))
  ).toEqual([
    'Ledger balances',
    'Possessions minus ledger',
    'Banking transactions',
  ]);
  expect(
    screen.queryByText('Opening balances and possessions')
  ).not.toBeInTheDocument();
  const outstanding = within(
    screen.getByRole('region', { name: 'Still to record' })
  );
  expect(
    outstanding.getByRole('table', { name: 'Possessions minus ledger' })
  ).toHaveTextContent('250');
  expect(
    outstanding.getByRole('button', {
      name: 'Record remaining difference as adjustment',
    })
  ).toBeVisible();
  expect(screen.queryByText('Transaction history')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '+ Transaction' }));
  const dialog = within(
    screen.getByRole('dialog', { name: 'Banking transaction' })
  );
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Invisible chest gold' },
  });
  fireEvent.change(dialog.getByLabelText('Transaction type'), {
    target: { value: 'income' },
  });
  fireEvent.change(dialog.getByLabelText('Money in possessions'), {
    target: { value: 'existing' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '250' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  expect(
    screen.queryByRole('region', { name: 'Still to record' })
  ).not.toBeInTheDocument();
  expect(
    within(screen.getByRole('table', { name: 'Ledger balances' })).getByRole(
      'row',
      { name: /^Total / }
    )
  ).toHaveTextContent('675');
  expect(current.workingInventories).toEqual(physical);
});

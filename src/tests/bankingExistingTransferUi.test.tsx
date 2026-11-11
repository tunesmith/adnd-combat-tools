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
  bankBoundaryDifference,
  bankGp,
  bankBalance,
  bankLedger,
} from '../helpers/campaignBanking';
import { reviewedDay2Fixture } from './fixtures/bankingExistingTransfer';
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `transfer-ui-${++id}` },
  });
});
test('Transfer offers an existing-possessions mode with paired From/To allocations and stable live balances', () => {
  let current = reviewedDay2Fixture();
  const baseline = current,
    physical = current.workingInventories;
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignBanking
        document={doc}
        sessionId="day2"
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
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Chest money moved to Castle Kifu' },
  });
  fireEvent.change(dialog.getByLabelText('Transaction type'), {
    target: { value: 'transfer' },
  });
  expect(
    dialog.getByRole('option', { name: 'Move in possessions' })
  ).toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Money in possessions'), {
    target: { value: 'existing' },
  });
  expect(
    dialog.getByRole('columnheader', { name: 'From' })
  ).toBeInTheDocument();
  expect(dialog.getByRole('columnheader', { name: 'To' })).toBeInTheDocument();
  expect(
    dialog.getByRole('columnheader', { name: 'Destination stack' })
  ).toBeInTheDocument();
  expect(
    dialog.queryByRole('option', { name: /New stack/ })
  ).not.toBeInTheDocument();
  for (const [index, code, quantity] of [
    [1, 'gp', 250],
    [2, 'sp', 1000],
    [3, 'ep', 300],
    [4, 'ep', 400],
  ] as const) {
    expect(dialog.getByLabelText(`Change ${index} from holder`)).toHaveValue(
      'reatha-inventory'
    );
    expect(dialog.getByLabelText(`Change ${index} holder`)).toHaveValue(
      'castle-storage'
    );
    expect(dialog.getByLabelText(`Change ${index} denomination`)).toHaveValue(
      code
    );
    fireEvent.change(dialog.getByLabelText(`Change ${index} quantity`), {
      target: { value: String(quantity) },
    });
    if (index < 4) {
      fireEvent.click(dialog.getByRole('button', { name: '+ Stack' }));
      expect(
        dialog.getByRole('table', { name: 'Proposed ledger balances' })
      ).toBeInTheDocument();
      expect(
        dialog.getByRole('button', { name: 'Save transaction' })
      ).toBeDisabled();
    }
  }
  expect(dialog.getByRole('status')).toHaveTextContent(
    'No remaining reconciliation difference'
  );
  expect(current).toBe(baseline);
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  expect(bankBoundaryDifference(current, 'day2')).toEqual([]);
  expect(bankGp(bankBalance(current, 'castle-storage', 'day2'))).toBe('650');
  expect(bankGp(bankBalance(current, 'vitameno-inventory', 'day2'))).toBe('25');
  expect(current.workingInventories).toEqual(physical);
  expect(bankLedger(current).entries).toHaveLength(
    bankLedger(baseline).entries.length + 1
  );
  expect(bankLedger(current).entries.at(-1)).toMatchObject({
    kind: 'transfer',
    effect: 'ledger',
    receiptMode: 'existing',
  });
  expect(bankLedger(current).entries.at(-1)?.changes).toHaveLength(8);
  expect(current.xp).toEqual(baseline.xp);
  fireEvent.click(
    screen.getByRole('button', { name: 'Chest money moved to Castle Kifu' })
  );
  dialog = within(screen.getByRole('dialog', { name: 'Banking transaction' }));
  expect(dialog.getByLabelText('Money in possessions')).toHaveValue('existing');
  expect(
    dialog.getByRole('table', { name: 'Recorded transfer allocations' })
  ).toHaveTextContent('Recorded ledger balance');
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeEnabled();
  expect(dialog.getByLabelText('Change 1 quantity')).toHaveValue(250);
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
});

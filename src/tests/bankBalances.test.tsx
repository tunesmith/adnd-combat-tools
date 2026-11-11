/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import BankBalances from '../components/desktop/BankBalances';
import { zeroBankAmounts } from '../helpers/campaignBankingModel';
test('denomination totals and the GP corner sum exactly across the holders', () => {
  render(
    <BankBalances
      showTotals
      caption="Money in possessions"
      rows={[
        {
          id: 'reatha',
          label: 'Reatha',
          amounts: { ...zeroBankAmounts(), ep: 700, sp: 1000, gp: 250 },
        },
        {
          id: 'vitameno',
          label: 'Vitameno',
          amounts: { ...zeroBankAmounts(), ep: 50 },
        },
      ]}
    />
  );
  const table = within(screen.getByRole('table', { name: 'Banking balances' }));
  expect(
    table.getByRole('columnheader', { name: 'Total (GP)' })
  ).toBeInTheDocument();
  expect(table.getByRole('row', { name: /^Reatha/ })).toHaveTextContent('650');
  expect(table.getByRole('row', { name: /^Vitameno/ })).toHaveTextContent('25');
  expect(
    within(table.getByRole('row', { name: /^Total / }))
      .getAllByRole('cell')
      .map((c) => c.textContent)
  ).toEqual(['0', '1,000', '750', '250', '0', '0', '0', '675']);
});
test('unknown quantities stay unknown in totals while known fractions and large sums remain exact', () => {
  const { rerender } = render(
    <BankBalances
      showTotals
      rows={[
        {
          id: 'a',
          label: 'First',
          amounts: { ...zeroBankAmounts(), cp: null, sp: 8 },
        },
        {
          id: 'b',
          label: 'Second',
          amounts: { ...zeroBankAmounts(), cp: 1, sp: 12 },
        },
      ]}
    />
  );
  let total = within(screen.getByRole('row', { name: /^Total / }));
  expect(total.getAllByRole('cell').map((c) => c.textContent)).toEqual([
    'Unknown',
    '20',
    '0',
    '0',
    '0',
    '0',
    '0',
    'Unknown',
  ]);
  rerender(
    <BankBalances
      showTotals
      rows={[
        {
          id: 'a',
          label: 'First',
          amounts: { ...zeroBankAmounts(), gp: Number.MAX_SAFE_INTEGER },
        },
        {
          id: 'b',
          label: 'Second',
          amounts: { ...zeroBankAmounts(), gp: 1, sp: 8 },
        },
      ]}
    />
  );
  total = within(screen.getByRole('row', { name: /^Total / }));
  expect(total.getAllByRole('cell').at(-1)).toHaveTextContent(
    '9007199254740992.4'
  );
});

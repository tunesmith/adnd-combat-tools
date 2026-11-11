/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CampaignBanking from '../components/desktop/CampaignBanking';
import { bankFixture } from './fixtures/bankingKifu';
import { holderMoney } from '../helpers/campaignBanking';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `bank-ui-${++id}` },
  });
});
test('one editor previews purchases, rejects selected-stack shortfalls and reverses edit/delete without touching another holder', () => {
  let current = bankFixture();
  const original = current;
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
  fireEvent.click(screen.getByRole('button', { name: '+ Transaction' }));
  let dialog = within(
    screen.getByRole('dialog', { name: 'Banking transaction' })
  );
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Synthetic store purchase' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 holder'), {
    target: { value: 'castle-kifu-storage' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '-251' },
  });
  expect(dialog.getByRole('alert')).toHaveTextContent('Insufficient');
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeDisabled();
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '-1' },
  });
  expect(
    dialog.getByRole('table', { name: 'Proposed possessions' })
  ).toHaveTextContent('249');
  expect(current).toBe(original);
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Synthetic store purchase' })
  );
  dialog = within(screen.getByRole('dialog', { name: 'Banking transaction' }));
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '-2' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  let inventory = current.workingInventories.find(
    (w) => w.sessionId === 'day3'
  )?.document;
  if (!inventory) throw Error('Fixture');
  expect(holderMoney(inventory, 'castle-kifu-storage').gp).toBe(248);
  expect(holderMoney(inventory, 'inventory-vitameno').ep).toBe(50);
  fireEvent.click(
    screen.getByRole('button', { name: 'Synthetic store purchase' })
  );
  dialog = within(screen.getByRole('dialog', { name: 'Banking transaction' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Delete transaction' }));
  inventory = current.workingInventories.find(
    (w) => w.sessionId === 'day3'
  )?.document;
  if (!inventory) throw Error('Fixture');
  expect(holderMoney(inventory, 'castle-kifu-storage').gp).toBe(250);
  expect(
    screen.queryByRole('button', { name: 'Synthetic store purchase' })
  ).not.toBeInTheDocument();
});

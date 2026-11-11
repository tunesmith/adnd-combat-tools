/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { zeroBankAmounts } from '../helpers/campaignBankingModel';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CampaignBanking from '../components/desktop/CampaignBanking';
import { bankFixture } from './fixtures/bankingKifu';
import {
  holderMoney,
  newBankMoneyItem,
  saveBankOpenings,
} from '../helpers/campaignBanking';
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

test('unfinished ordinary transfers show known physical progress and stay unsavable until both sides balance', () => {
  let current = bankFixture();
  current = {
    ...current,
    workingInventories: current.workingInventories.map((w) =>
      w.sessionId === 'day3'
        ? {
            ...w,
            document: {
              ...w.document,
              storageLocations:
                w.document.version === 10
                  ? w.document.storageLocations.map((h) => ({
                      ...h,
                      inventory: h.inventory.flatMap((item) =>
                        item.id === 'castle-ep'
                          ? [
                              { ...item, quantity: 300 },
                              { ...item, id: 'castle-ep-400', quantity: 400 },
                            ]
                          : [item]
                      ),
                    }))
                  : [],
            },
          }
        : w
    ),
  };
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
  const dialog = within(
    screen.getByRole('dialog', { name: 'Banking transaction' })
  );
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Take money to the store' },
  });
  fireEvent.change(dialog.getByLabelText('Transaction type'), {
    target: { value: 'transfer' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 holder'), {
    target: { value: 'castle-kifu-storage' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 denomination'), {
    target: { value: 'ep' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '-300' },
  });
  const progress = () =>
    within(dialog.getByRole('table', { name: 'Proposed possessions' }));
  expect(progress().queryByText('Unknown')).not.toBeInTheDocument();
  expect(
    progress().getByRole('row', { name: /Castle Kifu/ })
  ).toHaveTextContent('400');
  expect(dialog.getByRole('status')).toHaveTextContent(
    'Still to enter: +300 ep'
  );
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeDisabled();
  fireEvent.click(dialog.getByRole('button', { name: '+ Money change' }));
  expect(progress().queryByText('Unknown')).not.toBeInTheDocument();
  expect(
    progress().getByRole('row', { name: /Castle Kifu/ })
  ).toHaveTextContent('400');
  fireEvent.change(dialog.getByLabelText('Change 2 stack'), {
    target: { value: 'castle-ep-400' },
  });
  fireEvent.change(dialog.getByLabelText('Change 2 quantity'), {
    target: { value: '-400' },
  });
  expect(dialog.getByRole('status')).toHaveTextContent(
    'Still to enter: +700 ep'
  );
  expect(
    progress().getByRole('row', { name: /Castle Kifu/ })
  ).toHaveTextContent('300');
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeDisabled();
  expect(current).toBe(original);
  fireEvent.click(dialog.getByRole('button', { name: '+ Money change' }));
  fireEvent.change(dialog.getByLabelText('Change 3 holder'), {
    target: { value: 'inventory-reatha' },
  });
  fireEvent.change(dialog.getByLabelText('Change 3 quantity'), {
    target: { value: '700' },
  });
  expect(progress().queryByText('Unknown')).not.toBeInTheDocument();
  expect(dialog.queryByText(/Still to enter/)).not.toBeInTheDocument();
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeEnabled();
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  const inventory = current.workingInventories.find(
    (w) => w.sessionId === 'day3'
  )?.document;
  if (!inventory) throw Error('Fixture');
  expect(holderMoney(inventory, 'inventory-reatha').ep).toBe(700);
  expect(holderMoney(inventory, 'castle-kifu-storage').ep).toBe(0);
});

test('an exchange keeps its live balances through incomplete rows and reports the exact GP value still needed', () => {
  let current = bankFixture();
  current = {
    ...current,
    workingInventories: current.workingInventories.map((w) =>
      w.sessionId === 'day3'
        ? {
            ...w,
            document: {
              ...w.document,
              characters: w.document.characters.map((h) =>
                h.id === 'inventory-reatha'
                  ? {
                      ...h,
                      inventory: [
                        {
                          ...newBankMoneyItem('ep', 'exchange-ep'),
                          quantity: 280,
                        },
                        {
                          ...newBankMoneyItem('gp', 'exchange-gp'),
                          quantity: 189,
                        },
                        {
                          ...newBankMoneyItem('sp', 'exchange-sp'),
                          quantity: 8,
                        },
                      ],
                    }
                  : h
              ),
            },
          }
        : w
    ),
  };
  const opening = current.banking?.openings.find(
    (o) => o.holderId === 'inventory-reatha'
  );
  if (!opening) throw Error('Fixture');
  current = saveBankOpenings(current, [
    {
      ...opening,
      sessionId: 'day3',
      phase: 'before',
      amounts: { ...zeroBankAmounts(), ep: 280, gp: 189, sp: 8 },
    },
  ]);
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
  const dialog = within(
    screen.getByRole('dialog', { name: 'Banking transaction' })
  );
  fireEvent.change(dialog.getByLabelText('Description'), {
    target: { value: 'Exchange coins for three diamonds' },
  });
  fireEvent.change(dialog.getByLabelText('Transaction type'), {
    target: { value: 'exchange' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 denomination'), {
    target: { value: 'ep' },
  });
  fireEvent.change(dialog.getByLabelText('Change 1 quantity'), {
    target: { value: '-280' },
  });
  const progress = () =>
    within(dialog.getByRole('table', { name: 'Proposed possessions' }));
  expect(progress().queryByText('Unknown')).not.toBeInTheDocument();
  expect(progress().getByRole('row', { name: /Reatha/ })).toHaveTextContent(
    '189.4'
  );
  expect(dialog.getByRole('status')).toHaveTextContent(
    'Still to enter: +140 gp of value'
  );
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeDisabled();
  fireEvent.click(dialog.getByRole('button', { name: '+ Money change' }));
  expect(progress().getByRole('row', { name: /Reatha/ })).toHaveTextContent(
    '189.4'
  );
  fireEvent.change(dialog.getByLabelText('Change 2 denomination'), {
    target: { value: 'diamond' },
  });
  fireEvent.change(dialog.getByLabelText('Change 2 quantity'), {
    target: { value: '3' },
  });
  expect(dialog.getByRole('status')).toHaveTextContent(
    'Still to enter: -160 gp of value'
  );
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeDisabled();
  fireEvent.click(dialog.getByRole('button', { name: '+ Money change' }));
  fireEvent.change(dialog.getByLabelText('Change 3 denomination'), {
    target: { value: 'gp' },
  });
  fireEvent.change(dialog.getByLabelText('Change 3 quantity'), {
    target: { value: '-160' },
  });
  expect(progress().getByRole('row', { name: /Reatha/ })).toHaveTextContent(
    '329.4'
  );
  expect(dialog.queryByText(/Still to enter/)).not.toBeInTheDocument();
  expect(
    dialog.getByRole('button', { name: 'Save transaction' })
  ).toBeEnabled();
  expect(current).toBe(original);
  fireEvent.click(dialog.getByRole('button', { name: 'Save transaction' }));
  const inventory = current.workingInventories.find(
    (w) => w.sessionId === 'day3'
  )?.document;
  if (!inventory) throw Error('Fixture');
  expect(holderMoney(inventory, 'inventory-reatha')).toEqual({
    ...zeroBankAmounts(),
    gp: 29,
    sp: 8,
    diamond: 3,
  });
});

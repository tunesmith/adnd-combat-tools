/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import EncumbranceApp from '../components/encumbrance/EncumbranceApp';
import { syntheticInventory } from './fixtures/campaignB1';
import type { EncumbranceDocument } from '../types/encumbrance';
test('controlled editor updates its owner through quantity, note and nested-container transfer changes', () => {
  let current: EncumbranceDocument = syntheticInventory();
  const original = JSON.stringify(current);
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <EncumbranceApp
        mode="dm"
        campaign={{
          document: doc,
          onDocumentChange: (next) => {
            current = next;
            setDoc(next);
          },
          onExport: jest.fn(),
        }}
      />
    );
  }
  render(<Harness />);
  expect(
    screen.queryByRole('button', { name: 'File' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Export standalone DM JSON…' })
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit Blue lantern stones' })
  );
  let dialog = screen.getByRole('dialog', { name: 'Blue lantern stones' });
  fireEvent.change(within(dialog).getByLabelText('Quantity'), {
    target: { value: '6' },
  });
  const notes = within(dialog).getByLabelText('DM Notes');
  fireEvent.change(notes, { target: { value: 'Controlled working note' } });
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Edit Lantern pack' }));
  dialog = screen.getByRole('dialog', { name: 'Lantern pack' });
  const select = within(dialog).getByLabelText('Held by');
  const control = select.closest('[class*="-control"]') || select.parentElement;
  if (!control) throw new Error('Missing select');
  fireEvent.mouseDown(control);
  const option =
    screen.queryByRole('option', { name: 'Tal' }) ||
    screen.getAllByText('Tal').pop();
  if (!option) throw new Error('Missing transfer option');
  fireEvent.click(option);
  fireEvent.keyDown(window, { key: 'Escape' });
  if (current.kind !== 'adnd-encumbrance-dm') throw new Error('Expected DM');
  expect(current.characters[0]?.inventory).toEqual([]);
  expect(current.characters[1]?.inventory).toHaveLength(3);
  expect(
    current.characters[1]?.inventory.find((i) => i.id === 'gem')?.quantity
  ).toBe(6);
  expect(
    current.characters[1]?.inventory.find((i) => i.id === 'gem')?.containerId
  ).toBe('case');
  expect(
    current.characters[1]?.inventory.find((i) => i.id === 'gem')?.dmNotes
  ).toBe('Controlled working note');
  expect(original).toContain('"quantity":2');
});

test('a synchronously rejected controlled edit does not remain displayed as accepted', () => {
  const change = jest.fn(() => false);
  render(
    <EncumbranceApp
      mode="dm"
      campaign={{
        document: syntheticInventory(),
        onDocumentChange: change,
        onExport: jest.fn(),
      }}
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit Blue lantern stones' })
  );
  const quantity = within(
    screen.getByRole('dialog', { name: 'Blue lantern stones' })
  ).getByLabelText('Quantity');
  fireEvent.change(quantity, { target: { value: '99' } });
  expect(change).toHaveBeenCalled();
  expect(quantity).toHaveValue(2);
});

/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import EncumbranceApp from '../components/encumbrance/EncumbranceApp';
import { storageInventory } from './fixtures/storageInventory';
import type { EncumbranceDocument } from '../types/encumbrance';
function choose(label: string, value: string) {
  const select = screen.getByLabelText(label);
  const control = select.closest('[class*="-control"]') || select.parentElement;
  if (!control) throw new Error('Missing select');
  fireEvent.mouseDown(control);
  const option =
    screen.queryByRole('option', { name: value }) ||
    screen.getAllByText(value).pop();
  if (!option) throw new Error('Missing option');
  fireEvent.click(option);
}
test('compact campaign storage UI renames, protects nonempty removal, transfers, and creates storage without character controls', () => {
  let current: EncumbranceDocument = storageInventory();
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
  fireEvent.click(
    screen.getByRole('button', { name: 'Synthetic Castle', exact: true })
  );
  expect(screen.queryByText(/^STR /)).not.toBeInTheDocument();
  expect(screen.queryByText('Move', { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText('Band', { exact: true })).not.toBeInTheDocument();
  expect(screen.getByText('Stored possessions')).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit Synthetic Castle' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Remove location' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Move or remove all items'
  );
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Moon Castle' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save location' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Invisible chest' }));
  choose('Held by', 'Tal');
  // Immediately editing after transfer must reach the new holder.
  fireEvent.change(screen.getByLabelText('DM Notes'), {
    target: { value: 'Transferred chest note' },
  });
  fireEvent.keyDown(window, { key: 'Escape' });
  if (current.kind !== 'adnd-encumbrance-dm') throw new Error('Expected DM');
  expect(current.storageLocations[0]?.inventory).toEqual([]);
  expect(current.characters[1]?.inventory).toHaveLength(5);
  expect(
    current.characters[1]?.inventory.find((i) => i.id === 'pack')?.dmNotes
  ).toBe('Transferred chest note');
  fireEvent.click(screen.getByRole('button', { name: 'Tal', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Invisible chest' }));
  choose('Held by', 'Storage · Moon Castle');
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.click(
    screen.getByRole('button', { name: 'All possessions', exact: true })
  );
  expect(screen.getAllByText('Storage · Moon Castle').length).toBeGreaterThan(
    0
  );
  fireEvent.click(screen.getByRole('button', { name: '+ Storage' }));
  const dialog = within(
    screen.getByRole('dialog', { name: 'Storage location' })
  );
  expect(dialog.queryByText(/Strength/)).not.toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Name'), {
    target: { value: 'Empty vault' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save location' }));
  expect(
    screen.getByRole('button', { name: 'Empty vault', exact: true })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Empty vault' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove location' }));
  expect(
    screen.queryByRole('button', { name: 'Empty vault', exact: true })
  ).not.toBeInTheDocument();
});

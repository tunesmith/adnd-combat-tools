/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import EncumbranceApp from '../components/encumbrance/EncumbranceApp';
import { storageInventory } from './fixtures/storageInventory';
import {
  parseEncumbranceDocument,
  stringifyEncumbranceDocument,
} from '../helpers/encumbranceDocument';
import type { EncumbranceDocument } from '../types/encumbrance';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw Error('Missing fixture');
  return value;
}

test('character tabs drag and keyboard reorder through accepted edits, preserving selection and every holder value on export/reimport', () => {
  const initial = storageInventory();
  const first = initial.characters[0];
  if (!first) throw Error('fixture');
  initial.characters = [
    first,
    { ...first, id: 'second', name: 'Second', inventory: [] },
    { ...first, id: 'third', name: 'Third', inventory: [] },
  ];
  initial.activeCharacterId = 'second';
  let current: EncumbranceDocument = initial;
  function Harness() {
    const [document, setDocument] = useState(current);
    return (
      <EncumbranceApp
        mode="dm"
        campaign={{
          document,
          onDocumentChange: (next) => {
            current = next;
            setDocument(next);
          },
          onExport: () => undefined,
        }}
      />
    );
  }
  const view = render(<Harness />);
  const tabs = () =>
    within(screen.getByRole('group', { name: 'Characters' })).getAllByRole(
      'button'
    );
  fireEvent.dragStart(required(tabs()[2]), {
    dataTransfer: { setData: jest.fn(), effectAllowed: '' },
  });
  fireEvent.dragOver(required(tabs()[0]));
  fireEvent.drop(required(tabs()[0]));
  expect(tabs().map((t) => t.textContent)).toEqual([
    'Third',
    first.name,
    'Second',
  ]);
  const third = required(tabs()[0]);
  third.focus();
  fireEvent.keyDown(third, { key: 'ArrowRight', altKey: true, shiftKey: true });
  expect(tabs().map((t) => t.textContent)).toEqual([
    first.name,
    'Third',
    'Second',
  ]);
  expect(third).toHaveFocus();
  if (current.kind !== 'adnd-encumbrance-dm') throw Error('fixture');
  expect(current.activeCharacterId).toBe('second');
  expect(current.storageLocations).toEqual(initial.storageLocations);
  expect(
    [...current.characters].sort((a, b) => a.id.localeCompare(b.id))
  ).toEqual([...initial.characters].sort((a, b) => a.id.localeCompare(b.id)));
  const reopened = parseEncumbranceDocument(
    stringifyEncumbranceDocument(current)
  );
  expect(reopened).toEqual(current);
  view.unmount();
  current = reopened;
  render(<Harness />);
  expect(tabs().map((t) => t.textContent)).toEqual([
    first.name,
    'Third',
    'Second',
  ]);
});
test.each([0, 1])(
  '%i character inventories do not offer a drag target',
  (count) => {
    const document = storageInventory();
    document.characters = document.characters.slice(0, count);
    document.activeCharacterId =
      document.characters[0]?.id ?? document.storageLocations[0]?.id ?? '';
    render(
      <EncumbranceApp
        mode="dm"
        campaign={{
          document,
          onDocumentChange: jest.fn(),
          onExport: jest.fn(),
        }}
      />
    );
    const buttons = within(
      screen.getByRole('group', { name: 'Characters' })
    ).queryAllByRole('button');
    expect(buttons).toHaveLength(count);
    buttons.forEach((button) =>
      expect(button).toHaveAttribute('draggable', 'false')
    );
  }
);

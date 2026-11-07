/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EncumbranceApp from '../components/encumbrance/EncumbranceApp';
import { syntheticInventory } from './fixtures/campaignB1';
test('historical inventory retains character tabs, All possessions and sorting without accepting edits', () => {
  const document = syntheticInventory(),
    before = JSON.stringify(document),
    onDocumentChange = jest.fn();
  render(
    <EncumbranceApp
      mode="dm"
      campaign={{
        document,
        readOnly: true,
        onDocumentChange,
        onExport: jest.fn(),
      }}
    />
  );
  expect(
    screen.queryByRole('combobox', { name: 'Character' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Edit Blue lantern stones' })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Tal', exact: true }));
  expect(
    screen.queryByRole('button', { name: 'Edit Blue lantern stones' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'All possessions' }));
  expect(
    screen.getByRole('button', { name: 'Edit Blue lantern stones for Mira' })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Sort by Item' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mira', exact: true }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit Blue lantern stones' })
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Add Item' })
  ).not.toBeInTheDocument();
  expect(onDocumentChange).not.toHaveBeenCalled();
  expect(JSON.stringify(document)).toBe(before);
});

/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VersionToolbar from '../components/desktop/VersionToolbar';
test('checkpoint naming and restore confirmation remain deliberate secondary actions', () => {
  const capture = jest.fn(),
    restore = jest.fn(),
    select = jest.fn();
  const props = {
    versions: [
      { id: 'past', title: 'Before battle', time: '2026-11-04T12:00:00.000Z' },
    ],
    onSelect: select,
    onCapture: capture,
    onRestore: restore,
  };
  const view = render(<VersionToolbar {...props} value="" />);
  fireEvent.click(screen.getByLabelText('Version actions'));
  fireEvent.click(screen.getByText('Capture checkpoint…'));
  fireEvent.change(screen.getByLabelText('Checkpoint name'), {
    target: { value: 'Camp' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Capture checkpoint', exact: true })
  );
  expect(capture).toHaveBeenCalledWith('Camp');
  view.rerender(<VersionToolbar {...props} value="past" />);
  fireEvent.click(screen.getByLabelText('Version actions'));
  fireEvent.click(screen.getByText('Restore this version…'));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(restore).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Return to current' }));
  expect(select).toHaveBeenCalledWith('');
});

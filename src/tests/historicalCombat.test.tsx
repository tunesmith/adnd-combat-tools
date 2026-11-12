/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoricalCombat from '../components/desktop/HistoricalCombat';
import { syntheticCombat } from './fixtures/campaignB1';
afterEach(() => jest.restoreAllMocks());
test('historical tracker navigates rounds locally and cannot edit or persist them', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const storage = jest.spyOn(Storage.prototype, 'setItem');
  const url = jest.spyOn(window.history, 'replaceState');
  const state = syntheticCombat(),
    before = JSON.stringify(state);
  render(<HistoricalCombat state={state} />);
  const notes = screen.getByPlaceholderText(
    'Anything you want to remember when you revisit this round later.'
  );
  expect(notes).toHaveValue('The invented second round.');
  expect(notes).toBeDisabled();
  fireEvent.change(notes, { target: { value: 'Attempted historical edit' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Round' }), {
    target: { value: '0' },
  });
  expect(
    screen.getByPlaceholderText(
      'Anything you want to remember when you revisit this round later.'
    )
  ).toHaveValue('An invented encounter at Lantern Gate.');
  expect(JSON.stringify(state)).toBe(before);
  expect(storage).not.toHaveBeenCalled();
  expect(url).not.toHaveBeenCalled();
  expect(
    screen.queryByText(
      'All rounds, cells, declarations, and source-scoped identities'
    )
  ).not.toBeInTheDocument();
});

test('campaign history replaces the editor for inspection and returns without a mutation', async () => {
  const { default: CampaignCombats } = await import(
    '../components/desktop/CampaignCombats'
  );
  const { parseCampaign } = await import('../helpers/campaignDocument');
  const { createWorkingCombat } = await import(
    '../helpers/campaignWorkingCombat'
  );
  const baseline = (await import('./fixtures/campaignSnapshots.json')).default;
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const doc = createWorkingCombat(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    'Current encounter',
    syntheticCombat(),
    { kind: 'import', recordId: 'combat-1', revisionId: 'combat-r1' },
    'current'
  );
  const onChange = jest.fn(() => true),
    onEdit = jest.fn(() => true);
  render(
    <CampaignCombats
      onCreateEncounter={() => Promise.resolve()}
      document={doc}
      sessionId="session-1"
      active
      editorVersion={0}
      onChange={onChange}
      onEdit={onEdit}
    />
  );
  fireEvent.change(screen.getByRole('combobox', { name: 'Version' }), {
    target: { value: 'combat-r1' },
  });
  expect(screen.getByText('Historical · read only')).toBeInTheDocument();
  expect(
    screen.getByPlaceholderText(
      'Anything you want to remember when you revisit this round later.'
    )
  ).toBeDisabled();
  fireEvent.change(screen.getByRole('combobox', { name: 'Round' }), {
    target: { value: '0' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Return to current' }));
  expect(
    screen.getByPlaceholderText(
      'Anything you want to remember when you revisit this round later.'
    )
  ).not.toBeDisabled();
  expect(onChange).not.toHaveBeenCalled();
  expect(onEdit).not.toHaveBeenCalled();
});

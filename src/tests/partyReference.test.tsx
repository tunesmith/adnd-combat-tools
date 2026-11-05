/** @jest-environment jsdom */
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PartyReference from '../components/desktop/PartyReference';
import { parseCampaign } from '../helpers/campaignDocument';
import { emptyProfile, updatePartyProfile } from '../helpers/campaignParty';
import baseline from './fixtures/campaignB1V2.json';

test('calculated rows use the rules table and only manual rows accept numeric targets', () => {
  const calculated = updatePartyProfile(
    parseCampaign(JSON.stringify(baseline)),
    {
      ...emptyProfile('session-1', 'cleric'),
      characterClass: 'cleric',
      baseLevel: 6,
      overrides: [5, null, null, null, null],
    },
    { id: 'cleric', name: 'Cleric', player: '', notes: '' }
  );
  const initial = updatePartyProfile(
    calculated,
    {
      ...emptyProfile('session-1', 'creature'),
      overrides: [null, null, null, null, 16],
    },
    { id: 'creature', name: 'Sentinel', player: '', notes: '' }
  );
  function Workspace() {
    const [document, setDocument] = useState(initial);
    return (
      <PartyReference
        document={document}
        sessionId="session-1"
        onChange={(change) => {
          setDocument(change);
          return true;
        }}
      />
    );
  }
  render(<Workspace />);
  expect(screen.getByRole('cell', { name: '9' })).toBeInTheDocument();
  expect(screen.queryByRole('cell', { name: '5' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cleric' }));
  let dialog = screen.getByRole('dialog');
  expect(within(dialog).queryByLabelText('Poison')).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

  expect(screen.getByRole('cell', { name: '16' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sentinel' }));
  dialog = screen.getByRole('dialog');
  const spell = within(dialog).getByRole('spinbutton', { name: 'Spell' });
  expect(spell).toHaveValue(16);
  fireEvent.change(spell, { target: { value: '17' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }));
  expect(screen.getByRole('cell', { name: '17' })).toBeInTheDocument();
});

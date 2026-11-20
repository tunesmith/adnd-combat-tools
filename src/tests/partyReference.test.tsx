/** @jest-environment jsdom */
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PartyReference from '../components/desktop/PartyReference';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  copyPartyProfile,
  emptyProfile,
  updatePartyProfile,
} from '../helpers/campaignParty';
import baseline from './fixtures/campaignSnapshots.json';

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
  expect(
    screen.queryByRole('button', { name: '+ Character' })
  ).not.toBeInTheDocument();
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

test('saving-throw reminders preserve legacy notes, separate sources from triggers and carry independently', () => {
  let accepted = updatePartyProfile(
    parseCampaign(JSON.stringify(baseline)),
    {
      ...emptyProfile('session-1', 'shep'),
      characterClass: 'druid',
      baseLevel: 7,
      saveNotes: ['', '', 'An unconverted note'],
      saveReminders: [
        {
          id: 'woodland',
          instruction: 'Immune to woodland creatures’ charm spells.',
          source: 'Druid',
        },
        {
          id: 'class',
          bonus: '+2',
          appliesWhen: 'Fire or lightning',
          source: 'Druid',
        },
      ],
    },
    { id: 'shep', name: 'Shep', player: '', notes: '' }
  );
  function Workspace() {
    const [document, setDocument] = useState(accepted);
    return (
      <PartyReference
        document={document}
        sessionId="session-1"
        onChange={(change) => {
          accepted = parseCampaign(serializeCampaign(change(document)));
          setDocument(accepted);
          return true;
        }}
      />
    );
  }
  render(<Workspace />);
  const reminders = () =>
    within(screen.getByRole('list', { name: 'Shep — add to the roll' }));
  const beforeRoll = screen.getByRole('list', {
    name: 'Shep — before the roll',
  });
  expect(beforeRoll).toHaveTextContent(
    'Immune to woodland creatures’ charm spells.'
  );
  expect(
    screen
      .getByRole('list', { name: 'Shep — add to the roll' })
      .compareDocumentPosition(beforeRoll) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(reminders().queryByText(/woodland/)).toBeNull();
  expect(reminders().getByText('Druid')).toBeVisible();
  expect(reminders().getByText('Fire or lightning')).toBeVisible();
  expect(
    screen.getByText('An unconverted note', { exact: false })
  ).toBeVisible();
  const edit = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Shep' }));
    return within(screen.getByRole('dialog'));
  };
  let dialog = edit();
  expect(dialog.getByLabelText('New reminder type')).toHaveValue('bonus');
  fireEvent.click(dialog.getByRole('button', { name: 'Remove reminder 2' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  expect(reminders().getByText('+2')).toBeVisible();

  dialog = edit();
  fireEvent.change(dialog.getByLabelText('Bonus'), {
    target: { value: '+3 (or +4)' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save profile' }));
  const profile = accepted.party?.profiles.find(
    (p) => p.characterId === 'shep'
  );
  if (!profile) throw Error('Missing profile');
  const next = copyPartyProfile(profile, 'session-2');
  expect(next.saveReminders).toEqual(profile.saveReminders);
  expect(next.saveReminders?.[0]).not.toBe(profile.saveReminders?.[0]);
  expect(profile.saveReminders?.[0]).toEqual({
    id: 'woodland',
    instruction: 'Immune to woodland creatures’ charm spells.',
    source: 'Druid',
  });
  expect(profile.saveNotes[2]).toBe('An unconverted note');
  expect(reminders().getByText('+3 (or +4)')).toBeVisible();
  dialog = edit();
  fireEvent.click(dialog.getByRole('button', { name: 'Remove reminder 1' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Save profile' }));
  expect(
    screen.queryByRole('list', { name: 'Shep — before the roll' })
  ).toBeNull();
});

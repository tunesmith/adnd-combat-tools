/** @jest-environment jsdom */
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PartyReference from '../components/desktop/PartyReference';
import { parseCampaign } from '../helpers/campaignDocument';
import fixture from './fixtures/campaignProfiles.json';

test('dense profile modal drafts cancel, save shared data, and retain reference and rules fields', () => {
  const initial = parseCampaign(JSON.stringify(fixture));
  let accepted = initial;
  const changes = jest.fn();
  function Harness() {
    const [document, setDocument] = useState(initial);
    const [view, setView] = useState<'session' | 'saves'>('session');
    return (
      <>
        <button
          onClick={() => setView(view === 'session' ? 'saves' : 'session')}
        >
          Switch view
        </button>
        <PartyReference
          document={document}
          sessionId="one"
          view={view}
          onChange={(change) => {
            accepted = change(document);
            setDocument(accepted);
            changes();
            return true;
          }}
        />
      </>
    );
  }
  render(<Harness />);
  const table = within(
    screen.getByRole('table', { name: 'Session characters' })
  );
  expect(table.getByText('18/64')).toBeInTheDocument();
  expect(table.getByText('18/00')).toBeInTheDocument();
  expect(table.getByText('-5%')).toBeInTheDocument();
  expect(table.getByText('Player 3 · Nonbinary · 0 yrs')).toBeInTheDocument();
  expect(table.getByText('Player 2 · Male')).toBeInTheDocument();
  const name = screen.getByRole('button', { name: 'Nera Elm' });
  name.focus();
  fireEvent.click(name);
  let dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByLabelText('Melee hit')).toHaveValue('+2');
  expect(dialog.getByLabelText('Melee damage')).toHaveValue('+3');
  expect(dialog.getByLabelText('Reaction %')).toHaveValue('-5');
  expect(dialog.getByRole('checkbox', { name: '+10% XP bonus' })).toBeChecked();
  fireEvent.change(dialog.getByLabelText('Max HP'), { target: { value: '0' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  expect(changes).not.toHaveBeenCalled();
  expect(name).toHaveFocus();
  fireEvent.click(name);
  dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Race'), { target: { value: 'Elf' } });
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(changes).not.toHaveBeenCalled();
  fireEvent.click(name);
  dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Max HP'), { target: { value: '0' } });
  fireEvent.change(dialog.getByLabelText('Exceptional STR (01–00)'), {
    target: { value: '00' },
  });
  fireEvent.change(dialog.getByLabelText('Reaction %'), {
    target: { value: '-10' },
  });
  fireEvent.change(dialog.getByLabelText('Melee hit'), {
    target: { value: '+' },
  });
  fireEvent.change(dialog.getByLabelText('Melee hit'), {
    target: { value: '+4' },
  });
  fireEvent.blur(dialog.getByLabelText('Melee hit'));
  expect(dialog.getByLabelText('Melee hit')).toHaveValue('+4');
  fireEvent.click(dialog.getByRole('checkbox', { name: '+10% XP bonus' }));
  fireEvent.change(dialog.getByLabelText('Base level'), {
    target: { value: '9' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save profile' }));
  const profile = accepted.party?.profiles[0];
  expect(profile?.reference?.maxHp).toBe(0);
  expect(profile?.reference?.attributes.strength.exceptional).toBe(100);
  expect(profile?.reference?.bonuses.meleeHit).toBe(4);
  expect(profile?.reference?.bonuses.xpPercent).toBe(0);
  expect(profile?.saveNotes).toEqual(initial.party?.profiles[0]?.saveNotes);
  expect(profile?.adjustment).toEqual(initial.party?.profiles[0]?.adjustment);
  expect(profile?.saveBasis).toBe('printed');
  expect(profile?.baseLevel).toBe(9);
  fireEvent.click(screen.getByRole('button', { name: 'Switch view' }));
  expect(
    screen.getByRole('heading', { name: 'Saving throws' })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Nera Elm' }));
  expect(
    within(screen.getByRole('dialog')).getByLabelText('Max HP')
  ).toHaveValue(0);
});

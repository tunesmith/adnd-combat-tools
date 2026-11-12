/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateEncounterDialog from '../components/desktop/CreateEncounterDialog';
import { parseCampaign } from '../helpers/campaignDocument';
import { createWorkingCombat } from '../helpers/campaignWorkingCombat';
import { syntheticCombat } from './fixtures/campaignB1';
import baseline from './fixtures/campaignB1V2.json';
const makeDoc = () =>
  createWorkingCombat(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    'Giant Rats',
    syntheticCombat(),
    { kind: 'empty' },
    'rats'
  );
beforeEach(() =>
  Object.defineProperty(global, 'crypto', {
    configurable: true,
    value: {
      randomUUID: jest
        .fn()
        .mockReturnValueOnce('new')
        .mockReturnValueOnce('checkpoint'),
    },
  })
);
test('defaults to selected party, offers Empty, submits once, and asks for name once', async () => {
  const doc = makeDoc(),
    close = jest.fn();
  let finish: (() => void) | undefined;
  const create = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  render(
    <CreateEncounterDialog
      document={doc}
      sessionId="session-1"
      selectedId="rats"
      onCreate={create}
      onClose={close}
    />
  );
  expect(screen.getByLabelText('Start with')).toHaveValue('rats');
  expect(screen.getByRole('option', { name: 'Empty' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Hobgoblins' },
  });
  fireEvent.submit(screen.getByRole('dialog'));
  fireEvent.submit(screen.getByRole('dialog'));
  expect(create).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
  finish?.();
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});
test('no encounters defaults to Empty and cancel makes no change', () => {
  const doc = makeDoc();
  doc.workingCombats = [];
  const close = jest.fn(),
    create = jest.fn();
  render(
    <CreateEncounterDialog
      document={doc}
      sessionId="session-1"
      onCreate={create}
      onClose={close}
    />
  );
  expect(screen.getByLabelText('Start with')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(create).not.toHaveBeenCalled();
});
test('rejected acceptance stays open and allows retry', async () => {
  const create = jest
    .fn()
    .mockRejectedValueOnce(new Error('Source unavailable'))
    .mockResolvedValueOnce(undefined);
  const close = jest.fn();
  render(
    <CreateEncounterDialog
      document={makeDoc()}
      sessionId="session-1"
      onCreate={create}
      onClose={close}
    />
  );
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Empty' },
  });
  fireEvent.submit(screen.getByRole('dialog'));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Source unavailable'
  );
  expect(close).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole('dialog'));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});

test('choosing the full party overrides a selected subset and uses accepted current HP', async () => {
  const state = syntheticCombat();
  const last = state.rounds[state.rounds.length - 1];
  const member = last?.party[0],
    status = last?.partyStates[0];
  if (!last || !member || !status) throw new Error('Missing fixture');
  last.party = Array.from({ length: 5 }, (_, i) => ({
    ...member,
    key: i + 1,
    name: `PC ${i + 1}`,
  }));
  last.partyStates = last.party.map(() => ({ ...status, hp: '1' }));
  last.enemies = [];
  last.enemyStates = [];
  last.cells = [];
  last.actions = [];
  let doc = createWorkingCombat(
    makeDoc(),
    'session-1',
    'Fire Beetles',
    state,
    { kind: 'empty' },
    'beetles'
  );
  const close = jest.fn();
  render(
    <CreateEncounterDialog
      document={doc}
      sessionId="session-1"
      selectedId="rats"
      onCreate={async (change) => {
        doc = change(doc);
      }}
      onClose={close}
    />
  );
  expect(screen.getByLabelText('Start with')).toHaveValue('rats');
  expect(
    screen.getByRole('option', { name: /Fire Beetles.*5 party members/ })
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Start with'), {
    target: { value: 'beetles' },
  });
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Hobgoblins' },
  });
  const acceptedSource = doc.workingCombats.find((c) => c.id === 'beetles');
  const currentHp =
    acceptedSource?.state.rounds[acceptedSource.state.rounds.length - 1]
      ?.partyStates[0];
  if (!currentHp) throw new Error('Missing fixture');
  currentHp.hp = '4';
  fireEvent.submit(screen.getByRole('dialog'));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  const created = doc.workingCombats.find((c) => c.title === 'Hobgoblins');
  expect(created?.state.rounds[0]?.party).toHaveLength(5);
  expect(created?.state.rounds[0]?.partyStates[0]?.hp).toBe('4');
  expect(doc.workspace.combatSelections?.['session-1']).toBe(created?.id);
});

/** @jest-environment jsdom */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom';
import CreateEncounterDialog from '../components/desktop/CreateEncounterDialog';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import type { CampaignDocument } from '../helpers/campaignDocument';
import { changePreparedEnemy } from '../helpers/campaignPreparedEnemies';
import { createBaseCombatant } from '../helpers/trackerState';
import { createWorkingCombat } from '../helpers/campaignWorkingCombat';
import { syntheticCombat } from './fixtures/campaignB1';
import baseline from './fixtures/campaignSnapshots.json';
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

test('editing a prepared enemy saves or cancels independently of the encounter draft', async () => {
  let accepted = makeDoc();
  for (const name of ['Cube 1', 'Cube 2']) {
    const { key: _key, ...combatant } = createBaseCombatant(0, 'enemy', name);
    accepted = changePreparedEnemy(accepted, 'session-1', undefined, {
      id: name,
      combatant: { ...combatant, name, maxHp: '24' },
      notes: 'Wait by the door',
    });
  }
  function Harness() {
    const [document, setDocument] = useState(accepted);
    const [open, setOpen] = useState(true);
    return open ? (
      <CreateEncounterDialog
        document={document}
        sessionId="session-1"
        onCreate={async (
          change: (doc: CampaignDocument) => CampaignDocument
        ) => {
          accepted = parseCampaign(serializeCampaign(change(accepted)));
          setDocument(accepted);
        }}
        onClose={() => setOpen(false)}
      />
    ) : null;
  }
  render(<Harness />);
  const draft = () =>
    within(screen.getByRole('dialog', { name: 'Create encounter' }));
  const editor = () =>
    within(screen.getByRole('dialog', { name: 'Edit prepared enemy' }));
  fireEvent.change(draft().getByLabelText('Name'), {
    target: { value: 'Ambush' },
  });
  fireEvent.change(draft().getByLabelText('Start with'), {
    target: { value: 'rats' },
  });
  fireEvent.click(draft().getByRole('checkbox', { name: 'Cube 1' }));
  const verifyDraft = () => {
    expect(draft().getByLabelText('Name')).toHaveValue('Ambush');
    expect(draft().getByLabelText('Start with')).toHaveValue('rats');
    expect(draft().getByRole('checkbox', { name: 'Cube 1' })).toBeChecked();
    expect(draft().getByRole('checkbox', { name: 'Cube 2' })).not.toBeChecked();
  };
  fireEvent.click(draft().getByRole('button', { name: 'Edit Cube 1' }));
  fireEvent.change(editor().getByLabelText('Max HP'), {
    target: { value: '31' },
  });
  fireEvent.change(editor().getByLabelText('DM notes'), {
    target: { value: 'Check surprise' },
  });
  fireEvent.click(editor().getByRole('button', { name: 'Save and return' }));
  await waitFor(verifyDraft);
  fireEvent.click(draft().getByRole('button', { name: 'Edit Cube 1' }));
  fireEvent.change(editor().getByLabelText('Max HP'), {
    target: { value: '99' },
  });
  fireEvent.click(editor().getByRole('button', { name: 'Cancel' }));
  verifyDraft();
  fireEvent.click(draft().getByRole('button', { name: 'Create encounter' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  const encounter = accepted.workingCombats.find((c) => c.title === 'Ambush');
  expect(accepted.workspace.combatSelections?.['session-1']).toBe(
    encounter?.id
  );
  const round = encounter?.state.rounds[0];
  expect(round?.enemies).toMatchObject([{ name: 'Cube 1', maxHp: '31' }]);
  expect(round?.enemyStates).toMatchObject([
    { hp: '31', notes: 'Check surprise' },
  ]);
  expect(round?.cells[0]).toHaveLength(round?.party.length ?? 0);
  expect(accepted.sessions[0]?.preparedEnemies).toHaveLength(2);
});

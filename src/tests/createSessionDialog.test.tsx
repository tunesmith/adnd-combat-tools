/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateSessionDialog from '../components/desktop/CreateSessionDialog';
import type { CampaignDocument } from '../helpers/campaignDocument';
import { parseCampaign } from '../helpers/campaignDocument';
import { createWorkingCombat } from '../helpers/campaignWorkingCombat';
import { syntheticCombat } from './fixtures/campaignB1';
function fixture() {
  let doc: CampaignDocument = {
    ...parseCampaign(
      JSON.stringify({
        kind: 'adnd-campaign',
        schemaVersion: 1,
        id: 'synthetic',
        title: 'Test',
        notes: '',
      })
    ),
    sessions: [{ id: 's1', label: 'At gate', notes: 'Prior notes' }],
  };
  for (const id of ['prepared', 'ongoing', 'finished', 'legacy'])
    doc = createWorkingCombat(
      doc,
      's1',
      id,
      syntheticCombat(),
      { kind: 'empty' },
      id
    );
  doc.workingCombats = doc.workingCombats.map((c) => ({
    ...c,
    status:
      c.id === 'prepared'
        ? 'prepared'
        : c.id === 'ongoing'
        ? 'in-progress'
        : c.id === 'finished'
        ? 'finished'
        : 'unspecified',
  }));
  return doc;
}
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `generated-${++id}` },
  });
});
test('all encounters start unchecked, inventory is unavailable when missing, and Cancel changes nothing', () => {
  const doc = fixture(),
    before = JSON.stringify(doc),
    start = jest.fn(),
    close = jest.fn();
  render(
    <CreateSessionDialog
      document={doc}
      sessionId="s1"
      onCreate={start}
      onClose={close}
    />
  );
  for (const name of ['ongoing', 'prepared', 'finished', 'legacy'])
    expect(
      screen.getByRole('checkbox', { name: new RegExp(name) })
    ).not.toBeChecked();
  expect(
    screen.queryByRole('checkbox', { name: 'Current inventory' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('checkbox', { name: 'Copy session notes' })
  ).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(start).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalled();
  expect(JSON.stringify(doc)).toBe(before);
});
test('review names both sessions and repeated confirmation cannot submit twice while queued', async () => {
  let finish: () => void = () => undefined;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const doc = fixture();
  const start = jest.fn(
      (_change: (doc: CampaignDocument) => CampaignDocument) => pending
    ),
    close = jest.fn();
  render(
    <CreateSessionDialog
      document={doc}
      sessionId="s1"
      onCreate={start}
      onClose={close}
    />
  );
  fireEvent.change(screen.getByLabelText('Session name'), {
    target: { value: 'After gate' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Copy session notes' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'ongoing' }));
  expect(
    screen.getByText('Carry 1 encounter · session notes')
  ).toBeInTheDocument();
  const confirm = screen.getByRole('button', { name: 'Create session' });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(start).toHaveBeenCalledTimes(1);
  const change = start.mock.calls[0]?.[0];
  if (!change) throw new Error('Missing session change');
  const next = change(doc);
  expect(next.sessions[1]?.continuation?.combatInstanceIds).toEqual([
    'ongoing',
  ]);
  expect(next.sessions[1]?.continuation?.inventoryId).toBeNull();
  expect(next.sessions[1]?.notes).toBe('Prior notes');
  finish();
  await waitFor(() => expect(close).toHaveBeenCalled());
});
test('a changed source fails with a recoverable review and no partial transfer', async () => {
  const doc = fixture(),
    changed = {
      ...doc,
      sessions: doc.sessions.map((s) => ({ ...s, notes: 'Changed' })),
    };
  const start = jest.fn(
    async (change: (doc: CampaignDocument) => CampaignDocument) => {
      change(changed);
    }
  );
  render(
    <CreateSessionDialog
      document={doc}
      sessionId="s1"
      onCreate={start}
      onClose={jest.fn()}
    />
  );
  fireEvent.change(screen.getByLabelText('Session name'), {
    target: { value: 'Next' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'ongoing' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create session' }));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Source session changed'
    )
  );
  expect(changed.sessions).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
});

/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import DesktopWorkspace from '../components/desktop/DesktopWorkspace';
import { xpCastleDraft, xpAt } from './fixtures/xpCampaign';
import { confirmXpAward, previewXpAward } from '../helpers/campaignXp';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import type { DocumentState } from '../types/campaignStorage';
afterEach(() => {
  delete window.campaignStorage;
});
test.each([false, true])(
  'session tab gestures preserve active identity and respect confirmed XP lock (%s)',
  async (locked) => {
    let doc = xpCastleDraft();
    doc.workspace.view = 'session';
    if (locked)
      doc = confirmXpAward(
        doc,
        'refuge-point',
        previewXpAward(doc, 'refuge-point').fingerprint,
        'confirmed',
        xpAt
      );
    const events = JSON.stringify(doc.xp?.events);
    let native: DocumentState = {
      document: doc,
      path: null,
      recentPath: null,
      dirty: false,
      busy: false,
      token: 1,
      epoch: 1,
      status: '',
      error: null,
    };
    const mutate = jest.fn(
      async (
        id: string,
        epoch: number,
        change: (current: typeof doc) => typeof doc
      ) => {
        if (
          !native.document ||
          id !== native.document.id ||
          epoch !== native.epoch
        )
          return null;
        const next = parseCampaign(serializeCampaign(change(native.document)));
        validateHistoryTransition(native.document, next, '');
        native = { ...native, document: next, token: native.token + 1 };
        return native;
      }
    );
    window.campaignStorage = {
      getState: async () => native,
      discardRejectedEdits: async () => native,
      subscribe: () => () => undefined,
      mutate,
      replace: async (document) => ({ ...native, document }),
      pickSource: async () => null,
      exportSource: async () => false,
      exportWorking: async () => false,
      edit: async () => undefined,
      command: async () => undefined,
    };
    render(<DesktopWorkspace />);
    const first = await screen.findByRole('button', {
      name: 'First expedition',
      exact: true,
    });
    const second = screen.getByRole('button', {
      name: 'Return and descent',
      exact: true,
    });
    expect(first).toHaveAttribute('draggable', String(!locked));
    const dataTransfer = {
      setData: jest.fn(),
      effectAllowed: '',
      dropEffect: '',
    };
    fireEvent.dragStart(first, { dataTransfer });
    fireEvent.dragOver(second, { dataTransfer });
    fireEvent.drop(second, { dataTransfer });
    if (locked) {
      expect(mutate).not.toHaveBeenCalled();
      expect(native.document?.sessions.map((s) => s.id)).toEqual([
        'session-1',
        'session-2',
      ]);
    } else {
      await waitFor(() =>
        expect(native.document?.sessions.map((s) => s.id)).toEqual([
          'session-2',
          'session-1',
        ])
      );
      expect(
        within(screen.getByLabelText('Sessions'))
          .getAllByRole('button')
          .slice(0, 2)
          .map((b) => b.textContent)
      ).toEqual(['Return and descent', 'First expedition']);
      expect(native.document?.workspace.sessionId).toBe('session-2');
      fireEvent.keyDown(first, {
        key: 'ArrowLeft',
        altKey: true,
        shiftKey: true,
      });
      await waitFor(() =>
        expect(native.document?.sessions.map((s) => s.id)).toEqual([
          'session-1',
          'session-2',
        ])
      );
    }
    expect(JSON.stringify(native.document?.xp?.events)).toBe(events);
  }
);

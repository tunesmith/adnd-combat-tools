/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import CampaignSaveStatus from '../components/desktop/CampaignSaveStatus';
import type { DocumentState } from '../types/campaignStorage';
const clean: DocumentState = {
  document: null,
  path: null,
  recentPath: null,
  busy: false,
  dirty: false,
  epoch: 1,
  token: 0,
  status: 'No unsaved changes',
  error: null,
  saveCount: 0,
};
afterEach(() => jest.useRealTimers());
test('clean state is quiet; successful save briefly confirms and edits remain visible', () => {
  jest.useFakeTimers();
  const { rerender } = render(<CampaignSaveStatus state={clean} />);
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  rerender(
    <CampaignSaveStatus state={{ ...clean, busy: true, activity: 'save' }} />
  );
  expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  rerender(<CampaignSaveStatus state={{ ...clean, saveCount: 1 }} />);
  expect(screen.getByRole('status')).toHaveTextContent('Saved');
  act(() => {
    jest.advanceTimersByTime(2500);
  });
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  rerender(
    <CampaignSaveStatus state={{ ...clean, saveCount: 1, dirty: true }} />
  );
  expect(screen.getByRole('status')).toHaveTextContent('Edited');
});
test('cancelled or failed saves do not show success', () => {
  const { rerender } = render(
    <CampaignSaveStatus state={{ ...clean, busy: true, activity: 'saveAs' }} />
  );
  rerender(<CampaignSaveStatus state={clean} />);
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  rerender(
    <CampaignSaveStatus
      state={{ ...clean, error: 'Write failed', dirty: true }}
    />
  );
  expect(screen.getByRole('status')).toHaveTextContent('Edited');
  expect(screen.getByRole('status')).not.toHaveTextContent('Saved');
});
test('queued editing, command flush, and recoverable failures are distinguishable', () => {
  const queued = (phase: 'editing' | 'waiting') => ({
    ...clean,
    queue: { phase, queued: 1, error: null },
  });
  const { rerender } = render(<CampaignSaveStatus state={queued('editing')} />);
  expect(screen.getByRole('status')).toHaveTextContent('Editing…');
  rerender(<CampaignSaveStatus state={queued('waiting')} />);
  expect(screen.getByRole('status')).toHaveTextContent('Waiting for edits…');
  rerender(<CampaignSaveStatus state={{ ...clean, error: 'Rejected edit' }} />);
  expect(screen.getByRole('status')).toHaveTextContent('needs attention');
  rerender(
    <CampaignSaveStatus state={{ ...clean, saveCount: 1, dirty: true }} />
  );
  expect(screen.getByRole('status')).toHaveTextContent('Edited');
  expect(screen.getByRole('status')).not.toHaveTextContent('Saved');
});

import { useEffect, useRef, useState } from 'react';
import type {
  DocumentState,
  EditQueueStatus,
} from '../../types/campaignStorage';
export default function CampaignSaveStatus({
  state,
  pending,
  hasError = false,
  queuePhase,
}: {
  state: DocumentState | null;
  pending: boolean;
  hasError?: boolean;
  queuePhase?: EditQueueStatus['phase'];
}) {
  const [showSaved, setShowSaved] = useState(false);
  const previousSave = useRef(0);
  useEffect(() => {
    const count = state?.saveCount || 0;
    const saved = count > previousSave.current;
    previousSave.current = count;
    setShowSaved(saved);
    if (!saved) return;
    const timer = window.setTimeout(() => setShowSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [state?.saveCount, state?.epoch]);
  const saving =
    state?.busy && (state.activity === 'save' || state.activity === 'saveAs');
  const opening =
    state?.busy && (state.activity === 'open' || state.activity === 'reopen');
  const blocked = Boolean(state?.error || hasError);
  const text = blocked
    ? 'Edited — needs attention'
    : saving
    ? 'Saving…'
    : opening
    ? 'Opening…'
    : queuePhase === 'waiting'
    ? 'Waiting for edits…'
    : pending || queuePhase === 'editing'
    ? 'Editing…'
    : state?.dirty
    ? 'Edited'
    : showSaved && !state?.error && !hasError
    ? 'Saved'
    : '';
  return <span role="status">{text}</span>;
}

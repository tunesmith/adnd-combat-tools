import type {
  CampaignStorage,
  DocumentCommand,
  DocumentState,
} from '../types/campaignStorage';

export async function createTauriStorage(): Promise<CampaignStorage | null> {
  const native = window.__TAURI__;
  if (!native) return null;
  const { invoke } = native.core;
  const { listen } = native.event;
  let pending: Promise<void> = Promise.resolve();
  let editError: unknown = null;
  const listeners = new Set<(state: DocumentState) => void>();
  const command = async (action: DocumentCommand | 'openPending') => {
    await pending;
    if (editError) throw editError;
    await invoke('campaign_command', { command: action });
  };
  await listen<DocumentState>('campaign-state', ({ payload }) => {
    listeners.forEach((listener) => listener(payload));
  });
  await listen<DocumentCommand | 'openPending'>(
    'campaign-action',
    ({ payload }) => {
      void command(payload).catch(() => undefined);
    }
  );
  return {
    mutate: (id, epoch, change) => {
      const operation = pending.then(async () => {
        if (editError) throw editError;
        const current = await invoke<DocumentState>('campaign_state');
        if (current.epoch !== epoch || current.document?.id !== id) return null;
        const document = change(current.document);
        return invoke<DocumentState>('campaign_replace', {
          id,
          token: current.token,
          text: JSON.stringify(document),
        });
      });
      pending = operation.then(
        () => {
          editError = null;
        },
        (error) => {
          editError = error;
        }
      );
      return operation;
    },
    exportWorking: async (id, epoch, workingId) => {
      await pending;
      if (editError) throw editError;
      return invoke('campaign_export_working', { id, epoch, workingId });
    },
    replace: (document, token, purpose) => {
      const replacement = pending.then(() => {
        if (editError) throw editError;
        return invoke<DocumentState>('campaign_replace', {
          id: document.id,
          token,
          purpose,
          text: JSON.stringify(document),
        });
      });
      pending = replacement.then(
        () => undefined,
        () => undefined
      );
      return replacement;
    },
    pickSource: () => invoke('campaign_pick_source'),
    exportSource: (id, recordId, revisionId) =>
      invoke('campaign_export', { id, recordId, revisionId }),
    getState: () => invoke<DocumentState>('campaign_state'),
    discardRejectedEdits: async () => {
      await pending;
      editError = null;
      return invoke<DocumentState>('campaign_state');
    },
    edit(title, notes) {
      const edit = pending.then(() =>
        invoke<void>('campaign_edit', { title, notes })
      );
      pending = edit.then(
        () => {
          editError = null;
        },
        (error) => {
          editError = error;
        }
      );
      return edit;
    },
    command,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
      };
      event: {
        listen<T>(
          event: string,
          handler: (event: { payload: T }) => void
        ): Promise<() => void>;
      };
    };
  }
}

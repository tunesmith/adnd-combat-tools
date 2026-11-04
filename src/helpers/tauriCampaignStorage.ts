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
  const listeners = new Set<(state: DocumentState) => void>();
  const command = async (action: DocumentCommand | 'openPending') => {
    await pending;
    await invoke('campaign_command', { command: action });
  };
  await listen<DocumentState>('campaign-state', ({ payload }) => {
    listeners.forEach((listener) => listener(payload));
  });
  await listen<DocumentCommand | 'openPending'>(
    'campaign-action',
    ({ payload }) => {
      void command(payload);
    }
  );
  return {
    getState: () => invoke<DocumentState>('campaign_state'),
    edit(title, notes) {
      const edit = pending.then(() =>
        invoke<void>('campaign_edit', { title, notes })
      );
      pending = edit.catch(() => undefined);
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

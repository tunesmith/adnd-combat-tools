import type {
  CampaignStorage,
  DocumentCommand,
  DocumentState,
  EditQueueStatus,
} from '../types/campaignStorage';
import type { CampaignDocument } from './campaignDocument';

type Job<T> = { run: () => Promise<T>; key?: string };
type Draft = {
  key: string;
  change: (document: CampaignDocument) => CampaignDocument;
  release: () => void;
  result: Promise<DocumentState | null>;
};
const EDIT_DELAY_MS = 180;

export async function createTauriStorage(): Promise<CampaignStorage | null> {
  const native = window.__TAURI__;
  if (!native) return null;
  const { invoke } = native.core;
  const { listen } = native.event;
  let pending: Promise<void> = Promise.resolve();
  let editError: unknown = null;
  let commandError: unknown = null;
  let failed: Job<unknown>[] = [];
  let draft: Draft | undefined;
  let depth = 0;
  let commandTask: Promise<void> | undefined;
  let commandAction: string | undefined;
  let recovering: Promise<DocumentState> | undefined;
  let composing: Promise<void> | undefined;
  let endComposition: (() => void) | undefined;
  const listeners = new Set<(state: DocumentState) => void>();
  const statusListeners = new Set<(status: EditQueueStatus) => void>();
  let status: EditQueueStatus = { phase: 'idle', queued: 0, error: null };
  function publish(
    phase?: EditQueueStatus['phase'],
    error = editError || commandError
  ) {
    status = {
      phase:
        phase ||
        (error
          ? 'failed'
          : commandTask
          ? 'waiting'
          : depth
          ? 'editing'
          : 'idle'),
      queued: depth,
      rejected: failed.length > 0,
      error: error ? String(error) : null,
    };
    statusListeners.forEach((listener) => listener(status));
  }
  let diagnosticCount = 0;
  function trace(name: string, start: number, count = depth) {
    if (window.__CAMPAIGN_DIAGNOSTICS__ && diagnosticCount++ < 1000)
      void invoke('campaign_diagnostic', {
        name,
        ms: performance.now() - start,
        count,
      }).catch(() => undefined);
  }
  // React's input event already updates the tracker snapshot; do not blur the field.
  // Commands issued during IME composition wait for its final input event.
  document.addEventListener(
    'compositionstart',
    () => {
      if (!composing)
        composing = new Promise<void>((resolve) => {
          endComposition = resolve;
        });
    },
    true
  );
  document.addEventListener(
    'compositionend',
    () => {
      window.setTimeout(() => {
        endComposition?.();
        composing = undefined;
        endComposition = undefined;
      }, 0);
    },
    true
  );
  function flush() {
    const entry = draft;
    draft = undefined;
    entry?.release();
  }
  function remember(job: Job<unknown>) {
    if (job.key && failed[failed.length - 1]?.key === job.key)
      failed[failed.length - 1] = job;
    else failed.push(job);
  }
  function enqueue<T>(job: Job<T>, recoverable = true): Promise<T> {
    commandError = null;
    const enqueued = performance.now();
    depth++;
    trace('enqueue', enqueued);
    publish();
    const operation = pending.then(async () => {
      trace('queue_wait', enqueued);
      const started = performance.now();
      try {
        if (editError) throw editError;
        return await job.run();
      } catch (error) {
        if (recoverable) {
          remember(job);
          editError = error;
        } else commandError = error;
        publish('failed', error);
        throw error;
      } finally {
        depth--;
        trace('operation', started);
      }
    });
    pending = operation.then(
      () => {
        publish();
      },
      () => {
        publish();
      }
    );
    return operation;
  }
  function command(action: DocumentCommand | 'openPending'): Promise<void> {
    if (commandTask) {
      if (commandAction === action) return commandTask;
      return Promise.reject(
        new Error(
          'A document command is already in progress. Wait for it to finish.'
        )
      );
    }
    commandAction = action;
    flush();
    const dispatch = () => {
      flush();
      return enqueue(
        {
          run: async () => {
            publish('command');
            const start = performance.now();
            await invoke('campaign_command', { command: action });
            trace('command_complete', start);
          },
        },
        false
      );
    };
    const operation = composing ? composing.then(dispatch) : dispatch();
    commandTask = operation.finally(() => {
      commandTask = undefined;
      commandAction = undefined;
      // Keep a command failure visible until the next deliberate operation.
      if (status.phase !== 'failed') publish();
    });
    publish('waiting');
    return commandTask;
  }
  await listen<DocumentState>('campaign-state', ({ payload }) => {
    listeners.forEach((listener) => listener(payload));
  });
  await listen<DocumentCommand | 'openPending'>(
    'campaign-action',
    ({ payload }) => {
      void command(payload).catch((error) => publish('failed', error));
    }
  );
  async function apply(
    id: string,
    epoch: number,
    change: (d: CampaignDocument) => CampaignDocument
  ) {
    const current = await invoke<DocumentState>('campaign_state');
    if (current.epoch !== epoch || current.document?.id !== id) return null;
    const start = performance.now();
    const document = change(current.document);
    const text = JSON.stringify(document);
    trace('serialize', start, text.length);
    return invoke<DocumentState>('campaign_replace', {
      id,
      token: current.token,
      text,
    });
  }
  return {
    mutate: (id, epoch, change, combat) => {
      const key = combat
        ? JSON.stringify([
            id,
            epoch,
            combat.sessionId,
            combat.combatId,
            combat.generation,
          ])
        : undefined;
      if (key && draft?.key === key) {
        draft.change = change;
        trace('coalesced', performance.now());
        return draft.result;
      }
      flush();
      if (!key) return enqueue({ run: () => apply(id, epoch, change) });
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const timer = window.setTimeout(release, EDIT_DELAY_MS);
      const entry: Draft = {
        key,
        change,
        release: () => {
          window.clearTimeout(timer);
          release();
        },
        result: Promise.resolve(null),
      };
      draft = entry;
      entry.result = enqueue({
        key,
        run: async () => {
          await gate;
          if (composing) await composing;
          if (draft === entry) draft = undefined;
          return apply(id, epoch, entry.change);
        },
      });
      // A rejected predecessor can prevent run() from clearing the draft slot.
      void entry.result
        .finally(() => {
          if (draft === entry) draft = undefined;
        })
        .catch(() => undefined);
      return entry.result;
    },
    exportWorking: async (id, epoch, workingId) => {
      flush();
      return enqueue(
        {
          run: () =>
            invoke<boolean>('campaign_export_working', {
              id,
              epoch,
              workingId,
            }),
        },
        false
      );
    },
    replace: (document, token, purpose) => {
      flush();
      return enqueue({
        run: () =>
          invoke<DocumentState>('campaign_replace', {
            id: document.id,
            token,
            purpose,
            text: JSON.stringify(document),
          }),
      });
    },
    pickSource: () => invoke('campaign_pick_source'),
    exportSource: (id, recordId, revisionId) =>
      invoke('campaign_export', { id, recordId, revisionId }),
    getState: () => invoke<DocumentState>('campaign_state'),
    retryRejectedEdits: () => {
      if (recovering) return recovering;
      flush();
      const retry = pending.then(async () => {
        const jobs = failed;
        failed = [];
        editError = null;
        commandError = null;
        publish('editing');
        for (let i = 0; i < jobs.length; i++) {
          try {
            await jobs[i]?.run();
          } catch (error) {
            failed = jobs.slice(i);
            editError = error;
            publish('failed');
            throw error;
          }
        }
        const accepted = await invoke<DocumentState>('campaign_state');
        publish();
        return accepted;
      });
      pending = retry.then(
        () => undefined,
        () => undefined
      );
      recovering = retry.finally(() => {
        recovering = undefined;
      });
      return recovering;
    },
    discardRejectedEdits: () => {
      flush();
      const discard = pending.then(async () => {
        const accepted = await invoke<DocumentState>('campaign_state');
        failed = [];
        editError = null;
        commandError = null;
        publish();
        return accepted;
      });
      pending = discard.then(
        () => undefined,
        () => undefined
      );
      return discard;
    },
    edit(title, notes) {
      flush();
      return enqueue({
        run: () => invoke<void>('campaign_edit', { title, notes }),
      });
    },
    command,
    subscribeStatus(listener) {
      statusListeners.add(listener);
      listener(status);
      return () => {
        statusListeners.delete(listener);
      };
    },
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
    __CAMPAIGN_DIAGNOSTICS__?: boolean;
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

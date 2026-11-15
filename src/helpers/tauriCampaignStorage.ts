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
  changes: Map<string, (document: CampaignDocument) => CampaignDocument>;
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
  let failure: unknown = null;
  let failed: Job<unknown>[] = [];
  let draft: Draft | undefined;
  let depth = 0;
  let commandTask: Promise<void> | undefined;
  let commandAction: string | undefined;
  let recovering: Promise<DocumentState> | undefined;
  let composing: Promise<void> | undefined;
  let endComposition: (() => void) | undefined;
  const listeners = new Set<(state: DocumentState) => void>();
  let accepted: DocumentState | undefined;
  let optimistic: CampaignDocument | undefined;
  let editorVersion = 0;
  let status: EditQueueStatus = { phase: 'idle', queued: 0, error: null };
  function publish(phase?: EditQueueStatus['phase'], error = failure) {
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
    if (!depth && !failed.length && !recovering) optimistic = undefined;
    if (accepted) {
      const next = view(accepted);
      listeners.forEach((listener) => listener(next));
    }
  }
  function view(state: DocumentState): DocumentState {
    return {
      ...state,
      document: optimistic || state.document,
      dirty: !!optimistic || state.dirty,
      error: status.error || state.error,
      queue: status,
      editorVersion,
    };
  }
  function accept(next: DocumentState): DocumentState {
    if (
      accepted &&
      (next.epoch < accepted.epoch ||
        (next.epoch === accepted.epoch && next.token < accepted.token))
    )
      return accepted;
    if (
      accepted &&
      (next.epoch !== accepted.epoch ||
        next.document?.id !== accepted.document?.id)
    ) {
      optimistic = undefined;
      failed = [];
      failure = null;
      editorVersion++;
    }
    accepted = next;
    publish();
    return next;
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
    if (!failed.length) failure = null;
    const owner = accepted;
    const enqueued = performance.now();
    depth++;
    trace('enqueue', enqueued);
    publish();
    const operation = pending.then(async () => {
      trace('queue_wait', enqueued);
      const started = performance.now();
      try {
        if (failed.length) throw failure;
        return await job.run();
      } catch (error) {
        if (
          owner &&
          accepted &&
          (owner.epoch !== accepted.epoch ||
            owner.document?.id !== accepted.document?.id)
        )
          throw error;
        if (recoverable) remember(job);
        failure = error;
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
      const error = new Error(
        'A document command is already in progress. Wait for it to finish.'
      );
      publish('failed', error);
      return Promise.reject(error);
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
    accept(payload);
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
    const result = accept(
      await invoke<DocumentState>('campaign_replace', {
        id,
        token: current.token,
        text,
      })
    );
    return result.epoch === epoch && result.document?.id === id ? result : null;
  }
  return {
    flushEdits: flush,
    mutate: (id, epoch, change, edit, options) => {
      if (
        accepted &&
        (accepted.epoch !== epoch ||
          accepted.document?.id !== id ||
          (options?.editorVersion !== undefined &&
            options.editorVersion !== editorVersion))
      )
        return Promise.resolve(null);
      if (accepted?.document && options?.preview !== false) {
        try {
          const before = optimistic || accepted.document;
          const next = change(before);
          // Membership changes replace inventory editors, just like an explicit discard.
          const members = (doc: CampaignDocument) =>
            JSON.stringify(
              doc.workingInventories.map((w) => [
                w.id,
                w.document.characters.map((c) => c.id),
              ])
            );
          if (
            before.workingInventories !== next.workingInventories &&
            members(before) !== members(next)
          )
            editorVersion++;
          optimistic = next;
        } catch {
          // The preview may be stale. Decide against accepted native state below.
        }
      }
      const inventory = edit && 'workingId' in edit ? edit : undefined;
      const key = inventory
        ? JSON.stringify([
            'inventory',
            id,
            epoch,
            inventory.sessionId,
            inventory.workingId,
            editorVersion,
          ])
        : edit && 'combatId' in edit
        ? JSON.stringify([
            'combat',
            id,
            epoch,
            edit.sessionId,
            edit.combatId,
            edit.generation,
            editorVersion,
          ])
        : undefined;
      const field = inventory
        ? JSON.stringify([
            inventory.holderId,
            inventory.itemId,
            inventory.fields,
          ])
        : 'combat';
      if (key && draft?.key === key) {
        // Field patches are absolute. Keep the last write in its actual order.
        draft.changes.delete(field);
        draft.changes.set(field, change);
        trace('coalesced', performance.now());
        publish();
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
        changes: new Map([[field, change]]),
        release: () => {
          window.clearTimeout(timer);
          release();
        },
        result: Promise.resolve(null),
      };
      draft = entry;
      entry.result = enqueue({
        // Failed inventory batches can contain different fields. Retry each in order.
        key: inventory ? undefined : key,
        run: async () => {
          await gate;
          if (composing) await composing;
          if (draft === entry) draft = undefined;
          return apply(id, epoch, (doc) => {
            entry.changes.forEach((patch) => {
              doc = patch(doc);
            });
            return doc;
          });
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
      if (composing) await composing;
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
          }).then(accept),
      });
    },
    pickSource: () => invoke('campaign_pick_source'),
    exportSource: (id, recordId, revisionId) =>
      invoke('campaign_export', { id, recordId, revisionId }),
    getState: async () =>
      view(accept(await invoke<DocumentState>('campaign_state'))),
    retryRejectedEdits: () => {
      if (recovering) return recovering;
      flush();
      const retry = pending.then(async () => {
        const jobs = failed;
        failed = [];
        failure = null;
        publish('editing');
        for (let i = 0; i < jobs.length; i++) {
          try {
            await jobs[i]?.run();
          } catch (error) {
            failed = jobs.slice(i);
            failure = error;
            publish('failed');
            throw error;
          }
        }
        return accept(await invoke<DocumentState>('campaign_state'));
      });
      pending = retry.then(
        () => undefined,
        () => undefined
      );
      recovering = retry.finally(() => {
        recovering = undefined;
        publish();
      });
      return recovering;
    },
    discardRejectedEdits: () => {
      flush();
      const discarded = optimistic;
      const discard = pending.then(async () => {
        const current = await invoke<DocumentState>('campaign_state');
        failed = [];
        failure = null;
        if (optimistic === discarded) optimistic = undefined;
        editorVersion++;
        return accept(current);
      });
      pending = discard.then(
        () => undefined,
        () => undefined
      );
      return discard;
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

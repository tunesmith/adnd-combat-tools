import type { CampaignDocument } from '../helpers/campaignDocument';

export type DocumentCommand =
  | 'new'
  | 'open'
  | 'save'
  | 'saveAs'
  | 'close'
  | 'reopen'
  | 'quit';
export interface DocumentState {
  document: CampaignDocument | null;
  queue?: EditQueueStatus;
  editorVersion?: number;
  path: string | null;
  recentPath: string | null;
  dirty: boolean;
  busy: boolean;
  activity?: string | null;
  saveCount?: number;
  token: number;
  epoch: number;
  status: string;
  error: string | null;
}
export interface CombatEditKey {
  combatId: string;
  sessionId: string;
  generation: number;
}
export interface EditQueueStatus {
  phase: 'idle' | 'editing' | 'waiting' | 'command' | 'failed';
  queued: number;
  rejected?: boolean;
  error: string | null;
}
/** No paths or filesystem primitives are accepted from the renderer. */
export interface CampaignStorage {
  getState(): Promise<DocumentState>;
  retryRejectedEdits?(): Promise<DocumentState>;
  discardRejectedEdits(): Promise<DocumentState>;
  mutate(
    id: string,
    epoch: number,
    change: (document: CampaignDocument) => CampaignDocument,
    combat?: CombatEditKey,
    options?: { editorVersion?: number; preview?: boolean }
  ): Promise<DocumentState | null>;
  exportWorking(id: string, epoch: number, workingId: string): Promise<boolean>;
  replace(
    document: CampaignDocument,
    token: number,
    purpose?: 'import' | 'activate-source'
  ): Promise<DocumentState>;
  pickSource(): Promise<{ name: string; text: string } | null>;
  exportSource(
    id: string,
    recordId: string,
    revisionId: string
  ): Promise<boolean>;
  command(command: DocumentCommand): Promise<void>;
  subscribe(listener: (state: DocumentState) => void): () => void;
}

declare global {
  interface Window {
    campaignStorage?: CampaignStorage;
  }
}

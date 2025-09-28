import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
} from '../dungeon/domain/outcome';
import type { ChamberRoomContents } from '../tables/dungeon/chamberRoomContents';
import type { PartySummary } from '../dungeon/helpers/party/formatPartyResult';

export type DungeonAction = 'passage' | 'door';

export type DungeonParagraph = {
  kind: 'paragraph';
  text: string;
};

export type DungeonHeading = {
  kind: 'heading';
  level?: 2 | 3 | 4;
  text: string;
};

export type DungeonBulletList = {
  kind: 'bullet-list';
  items: string[];
};

export type DungeonCharacterPartyMessage = {
  kind: 'character-party';
  summary: PartySummary;
  display: 'detail' | 'compact';
};

export type DungeonMessage =
  | DungeonParagraph
  | DungeonHeading
  | DungeonBulletList
  | DungeonCharacterPartyMessage;

export type RollTraceItem = {
  table: string;
  roll: number;
  result: string;
  children?: RollTraceItem[];
};

export type DungeonRollTrace = {
  kind: 'roll-trace';
  items: RollTraceItem[];
};

export type DungeonRenderable = DungeonMessage | DungeonRollTrace;

export type TablePreviewEntry = {
  range: string;
  label: string;
};

export type DungeonTablePreview = {
  kind: 'table-preview';
  id: string; // stable identifier, e.g., table name
  targetId?: string; // unique path for this occurrence in the outcome tree
  title: string;
  sides: number;
  entries: TablePreviewEntry[];
  context?: TableContext;
};

export type TableContext =
  | { kind: 'exits'; length: number; width: number; isRoom: boolean }
  | { kind: 'doorChain'; existing: DoorChainLaterality[] }
  | { kind: 'wandering'; level: number }
  | { kind: 'unusualSize'; extra: number; isRoom?: boolean }
  | {
      kind: 'exit';
      exitType: 'door' | 'passage';
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    }
  | {
      kind: 'exitDirection';
      index: number;
      total: number;
      origin: 'room' | 'chamber';
    }
  | {
      kind: 'exitAlternative';
      exitType: 'door' | 'passage';
    }
  | {
      kind: 'chamberDimensions';
      forcedContents?: ChamberRoomContents;
      level?: number;
    };

export type DungeonRenderNode = DungeonRenderable | DungeonTablePreview;

export type DungeonStep = {
  action: DungeonAction;
  roll?: number;
  outcome?: DungeonOutcomeNode;
  messages: DungeonRenderNode[];
  renderCache?: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
  pendingCount?: number;
};

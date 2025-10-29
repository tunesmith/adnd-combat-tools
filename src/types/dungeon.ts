import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
} from '../dungeon/domain/outcome';
import type { ChamberRoomContents } from '../tables/dungeon/chamberRoomContents';
import type { TreasureSword } from '../tables/dungeon/treasureSwords';
import type { TreasureSwordAlignment } from '../tables/dungeon/treasureSwordAlignment';
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

export type IounStoneListEntry = {
  index: number;
  color: string;
  shape: string;
  effect: string;
  status: 'active' | 'duplicate' | 'dead';
  duplicateOf?: number;
};

export type IounStonesSummary = {
  count: number;
  countRoll: number;
  stones: IounStoneListEntry[];
};

export type DungeonIounStonesMessage = {
  kind: 'ioun-stones';
  summary: IounStonesSummary;
  display: 'detail' | 'compact';
};

export type PrayerBeadsBreakdownEntry = {
  label: string;
  count: number;
};

export type PrayerBeadsSummary = {
  totalBeads: number;
  semiPrecious: number;
  fancy: number;
  specialCount: number;
  breakdown: PrayerBeadsBreakdownEntry[];
};

export type DungeonPrayerBeadsMessage = {
  kind: 'prayer-beads';
  summary: PrayerBeadsSummary;
  display: 'detail' | 'compact';
};

export type RobeOfUsefulItemsSummaryEntry = {
  label: string;
  count: number;
  category: 'base' | 'extra';
};

export type RobeOfUsefulItemsSummary = {
  totalPatches: number;
  basePatchCount: number;
  extraPatchCount: number;
  requestedExtraPatchCount: number;
  entries: RobeOfUsefulItemsSummaryEntry[];
};

export type DungeonRobeOfUsefulItemsMessage = {
  kind: 'robe-of-useful-items';
  summary: RobeOfUsefulItemsSummary;
  display: 'detail' | 'compact';
};

export type DungeonMessage =
  | DungeonParagraph
  | DungeonHeading
  | DungeonBulletList
  | DungeonCharacterPartyMessage
  | DungeonIounStonesMessage
  | DungeonPrayerBeadsMessage
  | DungeonRobeOfUsefulItemsMessage;

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
  autoCollapse?: boolean;
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
    }
  | {
      kind: 'chamberContents';
      level: number;
    }
  | {
      kind: 'treasure';
      level: number;
      withMonster: boolean;
      rollIndex?: number;
      totalRolls?: number;
    }
  | {
      kind: 'treasureProtection';
      treasureRoll?: number;
    }
  | {
      kind: 'treasureContainer';
    }
  | {
      kind: 'treasureMagic';
      level: number;
      treasureRoll: number;
      rollIndex?: number;
    }
  | {
      kind: 'treasureSword';
      sword: TreasureSword;
      rollIndex?: number;
      languageRolls?: number[];
      luckBladeWishes?: number;
    }
  | {
      kind: 'treasureSwordAlignment';
      variant: 'standard' | 'chaotic' | 'lawful';
      sword?: TreasureSword;
    }
  | {
      kind: 'treasureSwordPrimaryAbility';
      slotKey?: string;
      rollIndex?: number;
      tableVariant?: 'standard' | 'restricted';
      ignoreHigh?: boolean;
    }
  | {
      kind: 'treasureSwordExtraordinaryPower';
      slotKey?: string;
      rollIndex?: number;
      tableVariant?: 'standard' | 'restricted';
      ignoreHigh?: boolean;
      alignment?: TreasureSwordAlignment;
    }
  | {
      kind: 'treasureSwordSpecialPurpose';
      slotKey?: string;
      rollIndex?: number;
      parentSlotKey?: string;
      alignment?: TreasureSwordAlignment;
      alignmentReady?: boolean;
    }
  | {
      kind: 'treasureSwordSpecialPurposePower';
      slotKey?: string;
      rollIndex?: number;
      parentSlotKey?: string;
      alignment?: TreasureSwordAlignment;
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

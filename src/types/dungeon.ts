import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
} from '../dungeon/domain/outcome';
import type { ChamberRoomContents } from '../dungeon/features/environment/roomsChambers/roomsChambersTable';
import type { TreasureSword } from '../dungeon/features/treasure/swords/swordsTables';
import type { TreasureSwordAlignment } from '../dungeon/features/treasure/swords/swordsAlignmentTable';
import type { PartySummary } from '../dungeon/helpers/party/formatPartyResult';

export type DungeonAction = 'passage' | 'door';
export type DungeonRollSource = 'manual' | 'auto';

export type DungeonReplayItem =
  | {
      kind: 'root-step';
      feedStep: number;
      action: DungeonAction;
      roll: number;
      rollSource: DungeonRollSource;
      detailMode: boolean;
      level: number;
    }
  | {
      kind: 'preview-resolution';
      feedStep: number;
      tableId: string;
      targetId: string;
      title: string;
      roll: number;
      rollSource: DungeonRollSource;
    };

export type DungeonReplayInfo = {
  app: 'adnd-combat-tools';
  page: 'dungeon';
  version: string;
  seed: string;
  items: DungeonReplayItem[];
};

type DungeonParagraph = {
  kind: 'paragraph';
  text: string;
};

type DungeonHeading = {
  kind: 'heading';
  level?: 2 | 3 | 4;
  text: string;
};

type DungeonBulletList = {
  kind: 'bullet-list';
  items: string[];
};

type DungeonCharacterPartyMessage = {
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

type DungeonIounStonesMessage = {
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

type DungeonPrayerBeadsMessage = {
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

type DungeonRobeOfUsefulItemsMessage = {
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

type DungeonRenderable = DungeonMessage | DungeonRollTrace;

type TablePreviewEntry = {
  range: string;
  label: string;
};

type DungeonTablePreviewBase = {
  kind: 'table-preview';
  id: string; // stable identifier, e.g., table name
  title: string;
  sides: number;
  entries: TablePreviewEntry[];
  context?: TableContext;
  autoCollapse?: boolean;
};

export type DungeonTablePreview = DungeonTablePreviewBase & {
  targetId?: never;
};

export type RootDungeonTablePreview = DungeonTablePreview;

export type TargetedDungeonTablePreview = DungeonTablePreviewBase & {
  targetId: string;
};

export type AnyDungeonTablePreview =
  | RootDungeonTablePreview
  | TargetedDungeonTablePreview;

type RollIndexContext = {
  rollIndex?: number;
};

type ExitType = 'door' | 'passage';
type ExitOrigin = 'room' | 'chamber';

type LevelContext<Kind extends string> = {
  kind: Kind;
  level: number;
};

type ExitIndexContext<Kind extends 'exit' | 'exitDirection'> = {
  kind: Kind;
  index: number;
  total: number;
  origin: ExitOrigin;
};

type TreasureRollContext<Kind extends string> = LevelContext<Kind> &
  RollIndexContext & {
    treasureRoll: number;
  };

type TreasureSwordSlotContext<Kind extends string> = {
  kind: Kind;
  slotKey?: string;
} & RollIndexContext;

type TreasureSwordVariantContext<Kind extends string> =
  TreasureSwordSlotContext<Kind> & {
    tableVariant?: 'standard' | 'restricted';
    ignoreHigh?: boolean;
  };

type TreasureSwordAlignedSlotContext<Kind extends string> =
  TreasureSwordSlotContext<Kind> & {
    alignment?: TreasureSwordAlignment;
  };

type TreasureSwordParentedContext<Kind extends string> =
  TreasureSwordAlignedSlotContext<Kind> & {
    parentSlotKey?: string;
  };

type TreasureSwordAlignmentReadyContext<Kind extends string> =
  TreasureSwordAlignedSlotContext<Kind> & {
    alignmentReady?: boolean;
  };

type NavigationTableContext =
  | { kind: 'exits'; length: number; width: number; isRoom: boolean }
  | { kind: 'doorChain'; existing: DoorChainLaterality[] }
  | LevelContext<'wandering'>
  | { kind: 'unusualSize'; extra: number; isRoom?: boolean }
  | (ExitIndexContext<'exit'> & {
      exitType: ExitType;
    })
  | ExitIndexContext<'exitDirection'>
  | {
      kind: 'exitAlternative';
      exitType: ExitType;
    };

type EnvironmentTableContext =
  | {
      kind: 'chamberDimensions';
      forcedContents?: ChamberRoomContents;
      level?: number;
    }
  | LevelContext<'chamberContents'>;

type TreasureTableContext =
  | (LevelContext<'treasure'> &
      RollIndexContext & {
        withMonster: boolean;
        totalRolls?: number;
      })
  | {
      kind: 'treasureProtection';
      treasureRoll?: number;
    }
  | {
      kind: 'treasureContainer';
    }
  | TreasureRollContext<'treasureMagic'>
  | ({
      kind: 'treasureSword';
      sword: TreasureSword;
      alignmentRoll?: number;
      languageRolls?: number[];
      primaryAbilityRolls?: number[];
      extraordinaryPowerRolls?: number[];
      dragonSlayerColorRoll?: number;
      luckBladeWishes?: number;
    } & RollIndexContext)
  | {
      kind: 'treasureSwordAlignment';
      variant: 'standard' | 'chaotic' | 'lawful';
      sword?: TreasureSword;
    }
  | TreasureSwordVariantContext<'treasureSwordPrimaryAbility'>
  | (TreasureSwordVariantContext<'treasureSwordExtraordinaryPower'> & {
      alignment?: TreasureSwordAlignment;
    })
  | (TreasureSwordParentedContext<'treasureSwordSpecialPurpose'> & {
      alignmentReady?: boolean;
    })
  | TreasureSwordParentedContext<'treasureSwordSpecialPurposePower'>
  | TreasureSwordAlignmentReadyContext<'treasureSwordDragonSlayerColor'>;

export type TableContext =
  | NavigationTableContext
  | EnvironmentTableContext
  | TreasureTableContext;

export type DungeonRenderNode = DungeonRenderable | AnyDungeonTablePreview;

export function isDungeonTablePreview(
  node: DungeonRenderNode
): node is AnyDungeonTablePreview {
  return node.kind === 'table-preview';
}

export function isTargetedDungeonTablePreview(
  preview: DungeonRenderNode
): preview is TargetedDungeonTablePreview;
export function isTargetedDungeonTablePreview(
  preview: AnyDungeonTablePreview
): preview is TargetedDungeonTablePreview;
export function isTargetedDungeonTablePreview(
  preview: DungeonRenderNode | AnyDungeonTablePreview
): preview is TargetedDungeonTablePreview {
  return (
    preview.kind === 'table-preview' &&
    typeof preview.targetId === 'string' &&
    preview.targetId.length > 0
  );
}

export function getDungeonTablePreviewTargetKey(
  preview: AnyDungeonTablePreview
): string {
  return isTargetedDungeonTablePreview(preview) ? preview.targetId : preview.id;
}

export function ensureTargetedDungeonTablePreview(
  preview: AnyDungeonTablePreview,
  fallbackTargetId: string
): TargetedDungeonTablePreview {
  return isTargetedDungeonTablePreview(preview)
    ? preview
    : { ...preview, targetId: fallbackTargetId };
}

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

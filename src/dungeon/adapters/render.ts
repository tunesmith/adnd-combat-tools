import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import {
  renderPeriodicCheckDetail,
  renderPeriodicCheckCompact,
  renderWanderingWhereFromDetail,
  renderWanderingWhereFromCompactNodes,
  buildWanderingWhereFromPreview,
} from './render/periodicOutcome';
import {
  renderDoorLocationDetail,
  renderPeriodicDoorOnlyDetail,
  buildDoorLocationPreview,
  buildPeriodicDoorOnlyPreview,
} from './render/doorLocation';
import {
  renderDoorBeyondDetail,
  renderDoorBeyondCompact,
} from './render/doorBeyond';
import {
  renderSidePassagesDetail,
  renderSidePassagesCompactNodes,
  buildSidePassagePreview,
} from './render/sidePassage';
import {
  renderPassageTurnsDetail,
  renderPassageTurnsCompactNodes,
  buildPassageTurnPreview,
} from './render/passageTurns';
import {
  renderPassageWidthDetail,
  renderPassageWidthCompactNodes,
  buildPassageWidthPreview,
} from './render/passageWidth';
import {
  renderRoomDimensionsDetail,
  renderRoomDimensionsCompactNodes,
  buildRoomDimensionsPreview,
} from './render/roomDimensions';
import {
  renderChamberDimensionsDetail,
  describeChamberDimensions,
  renderChamberDimensionsCompact,
  buildChamberDimensionsPreview,
} from './render/chamberDimensions';
import {
  renderCircularPoolDetail,
  renderCircularPoolCompact,
  buildCircularPoolPreview,
} from './render/circularPools';
import {
  renderCircularMagicPoolDetail,
  renderCircularMagicPoolCompact,
  buildCircularMagicPoolPreview,
} from './render/magicPool';
import {
  renderTransmuteTypeDetail,
  renderTransmuteTypeCompact,
  buildTransmuteTypePreview,
} from './render/transmuteType';
import {
  renderPoolAlignmentDetail,
  renderPoolAlignmentCompact,
  buildPoolAlignmentPreview,
} from './render/poolAlignment';
import {
  renderTransporterLocationDetail,
  renderTransporterLocationCompact,
  buildTransporterLocationPreview,
} from './render/transporterLocation';
import {
  renderSpecialPassageDetail,
  renderSpecialPassageCompactNodes,
  renderGalleryStairLocationDetail,
  renderGalleryStairLocationCompact,
  renderGalleryStairOccurrenceDetail,
  renderGalleryStairOccurrenceCompact,
  renderRiverConstructionDetail,
  renderRiverConstructionCompact,
  buildSpecialPassagePreview,
  buildGalleryStairLocationPreview,
  buildGalleryStairOccurrencePreview,
  buildStreamConstructionPreview,
  buildRiverConstructionPreview,
  buildRiverBoatBankPreview,
} from './render/specialPassage';
import {
  renderChasmDepthDetail,
  renderChasmConstructionDetail,
  renderJumpingPlaceWidthDetail,
  buildChasmDepthPreview,
  buildChasmConstructionPreview,
  buildJumpingPlaceWidthPreview,
} from './render/chasm';
import {
  renderStairsDetail,
  renderStairsCompactNodes,
  buildStairsPreview,
} from './render/stairs';
import {
  renderEgressDetail,
  renderEgressCompact,
  buildEgressPreview,
} from './render/egress';
import {
  renderChuteDetail,
  renderChuteCompact,
  buildChutePreview,
} from './render/chute';
import {
  renderNumberOfExitsDetail,
  renderNumberOfExitsCompact,
  buildNumberOfExitsPreview,
} from './render/numberOfExits';
import {
  renderUnusualSizeDetail,
  renderUnusualSizeCompact,
  buildUnusualSizePreview,
} from './render/unusualSize';
import {
  renderUnusualShapeDetail,
  renderUnusualShapeCompact,
  buildUnusualShapePreview,
} from './render/unusualShape';
import {
  renderChamberRoomContentsDetail,
  renderChamberRoomContentsCompact,
  buildChamberRoomContentsPreview,
} from './render/chamberRoomContents';
import {
  renderChamberRoomStairsDetail,
  renderChamberRoomStairsCompact,
  buildChamberRoomStairsPreview,
} from './render/chamberRoomStairs';
import {
  renderTrickTrapDetail,
  buildTrickTrapPreview,
} from './render/trickTrap';
import {
  buildMonsterPreview,
  renderMonsterDetailNodes,
  renderMonsterCompactNodes,
} from './render/monsters';
import {
  renderTreasureDetail,
  renderTreasureCompactNodes,
  buildTreasurePreview,
} from './render/treasure';
import {
  renderTreasureContainerDetail,
  renderTreasureContainerCompact,
  buildTreasureContainerPreview,
} from './render/treasureContainer';
import {
  renderTreasureProtectionTypeDetail,
  renderTreasureProtectionTypeCompact,
  renderTreasureProtectionGuardedByDetail,
  renderTreasureProtectionHiddenByDetail,
  buildTreasureProtectionTypePreview,
  buildTreasureProtectionGuardedByPreview,
  buildTreasureProtectionHiddenByPreview,
} from './render/treasureProtection';
import {
  renderTreasureMagicCategoryDetail,
  renderTreasureMagicCategoryCompact,
  buildTreasureMagicCategoryPreview,
} from './render/treasureMagic';
import {
  renderTreasurePotionDetail,
  renderTreasurePotionCompact,
  buildTreasurePotionPreview,
  renderTreasurePotionAnimalControlDetail,
  renderTreasurePotionAnimalControlCompact,
  buildTreasurePotionAnimalControlPreview,
  renderTreasurePotionDragonControlDetail,
  renderTreasurePotionDragonControlCompact,
  buildTreasurePotionDragonControlPreview,
  renderTreasurePotionGiantControlDetail,
  renderTreasurePotionGiantControlCompact,
  buildTreasurePotionGiantControlPreview,
  renderTreasurePotionGiantStrengthDetail,
  renderTreasurePotionGiantStrengthCompact,
  buildTreasurePotionGiantStrengthPreview,
  renderTreasurePotionHumanControlDetail,
  renderTreasurePotionHumanControlCompact,
  buildTreasurePotionHumanControlPreview,
  renderTreasurePotionUndeadControlDetail,
  renderTreasurePotionUndeadControlCompact,
  buildTreasurePotionUndeadControlPreview,
} from './render/treasurePotion';
import {
  renderTreasureScrollDetail,
  renderTreasureScrollCompact,
  buildTreasureScrollPreview,
  renderTreasureScrollProtectionElementalsDetail,
  renderTreasureScrollProtectionElementalsCompact,
  buildTreasureScrollProtectionElementalsPreview,
  renderTreasureScrollProtectionLycanthropesDetail,
  renderTreasureScrollProtectionLycanthropesCompact,
  buildTreasureScrollProtectionLycanthropesPreview,
} from './render/treasureScroll';
import {
  renderTreasureRingDetail,
  renderTreasureRingCompact,
  buildTreasureRingPreview,
  renderTreasureRingContrarinessDetail,
  renderTreasureRingContrarinessCompact,
  buildTreasureRingContrarinessPreview,
  renderTreasureRingElementalCommandDetail,
  renderTreasureRingElementalCommandCompact,
  buildTreasureRingElementalCommandPreview,
  renderTreasureRingProtectionDetail,
  renderTreasureRingProtectionCompact,
  buildTreasureRingProtectionPreview,
  renderTreasureRingRegenerationDetail,
  renderTreasureRingRegenerationCompact,
  buildTreasureRingRegenerationPreview,
  renderTreasureRingTelekinesisDetail,
  renderTreasureRingTelekinesisCompact,
  buildTreasureRingTelekinesisPreview,
  renderTreasureRingThreeWishesDetail,
  renderTreasureRingThreeWishesCompact,
  buildTreasureRingThreeWishesPreview,
  renderTreasureRingWizardryDetail,
  renderTreasureRingWizardryCompact,
  buildTreasureRingWizardryPreview,
} from './render/treasureRing';
import {
  renderTreasureRodStaffWandDetail,
  renderTreasureRodStaffWandCompact,
  buildTreasureRodStaffWandPreview,
} from './render/treasureRodStaffWand';
import {
  renderTreasureMiscMagicE1Detail,
  renderTreasureMiscMagicE1Compact,
  buildTreasureMiscMagicE1Preview,
} from './render/treasureMiscMagicE1';
import {
  renderTreasureStaffSerpentDetail,
  renderTreasureStaffSerpentCompact,
  buildTreasureStaffSerpentPreview,
} from './render/treasureStaffSerpent';
import { isTableContext } from '../helpers/outcomeTree';
import {
  buildCircularContentsPreview,
  renderCircularContentsCompact,
  renderCircularContentsDetail,
} from './render/circularContents';
import type { AppendPreviewFn } from './render/shared';
import {
  renderIllusionaryWallNatureDetail,
  renderIllusionaryWallNatureCompact,
  buildIllusionaryWallNaturePreview,
} from './render/illusionaryWallNature';
import {
  renderGasTrapEffectDetail,
  renderGasTrapEffectCompact,
  buildGasTrapEffectPreview,
} from './render/gasTrapEffect';
import {
  renderPassageExitLocationDetail,
  renderPassageExitLocationCompact,
  renderDoorExitLocationDetail,
  renderDoorExitLocationCompact,
  renderExitDirectionDetail,
  renderExitDirectionCompact,
  renderExitAlternativeDetail,
  renderExitAlternativeCompact,
  buildPassageExitLocationPreview,
  buildDoorExitLocationPreview,
  buildExitDirectionPreview,
  buildExitAlternativePreview,
} from './render/exitLocation';

type OutcomeEventKind = OutcomeEventNode['event']['kind'];

type RenderDetailFn = (
  node: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
) => DungeonRenderNode[];

type RenderCompactFn = (
  node: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
) => DungeonRenderNode[];

type RenderAdapter = {
  renderDetail: RenderDetailFn;
  renderCompact: RenderCompactFn;
};

const NO_COMPACT_RENDER: RenderCompactFn = (_node, _append) => [];

const withoutAppend =
  (
    renderer: (node: OutcomeEventNode) => DungeonRenderNode[]
  ): RenderCompactFn =>
  (node, _append) =>
    renderer(node);

const renderStairsDetailWithChamberSummary: RenderDetailFn = (node, append) =>
  renderStairsDetail(node, append, {
    renderChamberSummary: describeChamberDimensions,
  });

const renderStairsCompactWithChamberSummary: RenderCompactFn = withoutAppend(
  (node) =>
    renderStairsCompactNodes(node, {
      renderChamberSummary: describeChamberDimensions,
    })
);

const monsterAdapter: RenderAdapter = {
  renderDetail: renderMonsterDetailNodes,
  renderCompact: renderMonsterCompactNodes,
};

const RENDER_ADAPTERS: Partial<Record<OutcomeEventKind, RenderAdapter>> = {
  periodicCheck: {
    renderDetail: renderPeriodicCheckDetail,
    renderCompact: withoutAppend(renderPeriodicCheckCompact),
  },
  doorBeyond: {
    renderDetail: renderDoorBeyondDetail,
    renderCompact: withoutAppend(renderDoorBeyondCompact),
  },
  doorLocation: {
    renderDetail: renderDoorLocationDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  periodicCheckDoorOnly: {
    renderDetail: renderPeriodicDoorOnlyDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  sidePassages: {
    renderDetail: renderSidePassagesDetail,
    renderCompact: withoutAppend(renderSidePassagesCompactNodes),
  },
  passageTurns: {
    renderDetail: renderPassageTurnsDetail,
    renderCompact: withoutAppend(renderPassageTurnsCompactNodes),
  },
  passageWidth: {
    renderDetail: renderPassageWidthDetail,
    renderCompact: withoutAppend(renderPassageWidthCompactNodes),
  },
  roomDimensions: {
    renderDetail: renderRoomDimensionsDetail,
    renderCompact: withoutAppend(renderRoomDimensionsCompactNodes),
  },
  chamberDimensions: {
    renderDetail: renderChamberDimensionsDetail,
    renderCompact: withoutAppend(renderChamberDimensionsCompact),
  },
  circularContents: {
    renderDetail: renderCircularContentsDetail,
    renderCompact: renderCircularContentsCompact,
  },
  circularPool: {
    renderDetail: renderCircularPoolDetail,
    renderCompact: renderCircularPoolCompact,
  },
  circularMagicPool: {
    renderDetail: renderCircularMagicPoolDetail,
    renderCompact: renderCircularMagicPoolCompact,
  },
  transmuteType: {
    renderDetail: renderTransmuteTypeDetail,
    renderCompact: withoutAppend(renderTransmuteTypeCompact),
  },
  poolAlignment: {
    renderDetail: renderPoolAlignmentDetail,
    renderCompact: withoutAppend(renderPoolAlignmentCompact),
  },
  transporterLocation: {
    renderDetail: renderTransporterLocationDetail,
    renderCompact: withoutAppend(renderTransporterLocationCompact),
  },
  specialPassage: {
    renderDetail: renderSpecialPassageDetail,
    renderCompact: withoutAppend(renderSpecialPassageCompactNodes),
  },
  galleryStairLocation: {
    renderDetail: renderGalleryStairLocationDetail,
    renderCompact: renderGalleryStairLocationCompact,
  },
  galleryStairOccurrence: {
    renderDetail: renderGalleryStairOccurrenceDetail,
    renderCompact: withoutAppend(renderGalleryStairOccurrenceCompact),
  },
  riverConstruction: {
    renderDetail: renderRiverConstructionDetail,
    renderCompact: renderRiverConstructionCompact,
  },
  chasmDepth: {
    renderDetail: renderChasmDepthDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  chasmConstruction: {
    renderDetail: renderChasmConstructionDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  jumpingPlaceWidth: {
    renderDetail: renderJumpingPlaceWidthDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  stairs: {
    renderDetail: renderStairsDetailWithChamberSummary,
    renderCompact: renderStairsCompactWithChamberSummary,
  },
  egress: {
    renderDetail: renderEgressDetail,
    renderCompact: withoutAppend(renderEgressCompact),
  },
  chute: {
    renderDetail: renderChuteDetail,
    renderCompact: withoutAppend(renderChuteCompact),
  },
  numberOfExits: {
    renderDetail: renderNumberOfExitsDetail,
    renderCompact: withoutAppend(renderNumberOfExitsCompact),
  },
  unusualShape: {
    renderDetail: renderUnusualShapeDetail,
    renderCompact: withoutAppend(renderUnusualShapeCompact),
  },
  unusualSize: {
    renderDetail: renderUnusualSizeDetail,
    renderCompact: withoutAppend(renderUnusualSizeCompact),
  },
  chamberRoomContents: {
    renderDetail: renderChamberRoomContentsDetail,
    renderCompact: renderChamberRoomContentsCompact,
  },
  chamberRoomStairs: {
    renderDetail: renderChamberRoomStairsDetail,
    renderCompact: renderChamberRoomStairsCompact,
  },
  trickTrap: {
    renderDetail: renderTrickTrapDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  treasure: {
    renderDetail: renderTreasureDetail,
    renderCompact: withoutAppend(renderTreasureCompactNodes),
  },
  treasureContainer: {
    renderDetail: renderTreasureContainerDetail,
    renderCompact: withoutAppend(renderTreasureContainerCompact),
  },
  treasureProtectionType: {
    renderDetail: renderTreasureProtectionTypeDetail,
    renderCompact: renderTreasureProtectionTypeCompact,
  },
  treasureProtectionGuardedBy: {
    renderDetail: renderTreasureProtectionGuardedByDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  treasureProtectionHiddenBy: {
    renderDetail: renderTreasureProtectionHiddenByDetail,
    renderCompact: NO_COMPACT_RENDER,
  },
  treasureMagicCategory: {
    renderDetail: renderTreasureMagicCategoryDetail,
    renderCompact: renderTreasureMagicCategoryCompact,
  },
  treasurePotion: {
    renderDetail: renderTreasurePotionDetail,
    renderCompact: renderTreasurePotionCompact,
  },
  treasurePotionAnimalControl: {
    renderDetail: renderTreasurePotionAnimalControlDetail,
    renderCompact: renderTreasurePotionAnimalControlCompact,
  },
  treasurePotionDragonControl: {
    renderDetail: renderTreasurePotionDragonControlDetail,
    renderCompact: renderTreasurePotionDragonControlCompact,
  },
  treasurePotionGiantControl: {
    renderDetail: renderTreasurePotionGiantControlDetail,
    renderCompact: renderTreasurePotionGiantControlCompact,
  },
  treasurePotionGiantStrength: {
    renderDetail: renderTreasurePotionGiantStrengthDetail,
    renderCompact: renderTreasurePotionGiantStrengthCompact,
  },
  treasurePotionHumanControl: {
    renderDetail: renderTreasurePotionHumanControlDetail,
    renderCompact: renderTreasurePotionHumanControlCompact,
  },
  treasurePotionUndeadControl: {
    renderDetail: renderTreasurePotionUndeadControlDetail,
    renderCompact: renderTreasurePotionUndeadControlCompact,
  },
  treasureScroll: {
    renderDetail: renderTreasureScrollDetail,
    renderCompact: renderTreasureScrollCompact,
  },
  treasureScrollProtectionElementals: {
    renderDetail: renderTreasureScrollProtectionElementalsDetail,
    renderCompact: renderTreasureScrollProtectionElementalsCompact,
  },
  treasureScrollProtectionLycanthropes: {
    renderDetail: renderTreasureScrollProtectionLycanthropesDetail,
    renderCompact: renderTreasureScrollProtectionLycanthropesCompact,
  },
  treasureRing: {
    renderDetail: renderTreasureRingDetail,
    renderCompact: renderTreasureRingCompact,
  },
  treasureRingContrariness: {
    renderDetail: renderTreasureRingContrarinessDetail,
    renderCompact: renderTreasureRingContrarinessCompact,
  },
  treasureRingElementalCommand: {
    renderDetail: renderTreasureRingElementalCommandDetail,
    renderCompact: renderTreasureRingElementalCommandCompact,
  },
  treasureRingProtection: {
    renderDetail: renderTreasureRingProtectionDetail,
    renderCompact: renderTreasureRingProtectionCompact,
  },
  treasureRingRegeneration: {
    renderDetail: renderTreasureRingRegenerationDetail,
    renderCompact: renderTreasureRingRegenerationCompact,
  },
  treasureRingTelekinesis: {
    renderDetail: renderTreasureRingTelekinesisDetail,
    renderCompact: renderTreasureRingTelekinesisCompact,
  },
  treasureRingThreeWishes: {
    renderDetail: renderTreasureRingThreeWishesDetail,
    renderCompact: renderTreasureRingThreeWishesCompact,
  },
  treasureRingWizardry: {
    renderDetail: renderTreasureRingWizardryDetail,
    renderCompact: renderTreasureRingWizardryCompact,
  },
  treasureRodStaffWand: {
    renderDetail: renderTreasureRodStaffWandDetail,
    renderCompact: renderTreasureRodStaffWandCompact,
  },
  treasureMiscMagicE1: {
    renderDetail: renderTreasureMiscMagicE1Detail,
    renderCompact: renderTreasureMiscMagicE1Compact,
  },
  treasureStaffSerpent: {
    renderDetail: renderTreasureStaffSerpentDetail,
    renderCompact: renderTreasureStaffSerpentCompact,
  },
  wanderingWhereFrom: {
    renderDetail: renderWanderingWhereFromDetail,
    renderCompact: withoutAppend(renderWanderingWhereFromCompactNodes),
  },
  illusionaryWallNature: {
    renderDetail: renderIllusionaryWallNatureDetail,
    renderCompact: renderIllusionaryWallNatureCompact,
  },
  gasTrapEffect: {
    renderDetail: renderGasTrapEffectDetail,
    renderCompact: renderGasTrapEffectCompact,
  },
  passageExitLocation: {
    renderDetail: renderPassageExitLocationDetail,
    renderCompact: renderPassageExitLocationCompact,
  },
  doorExitLocation: {
    renderDetail: renderDoorExitLocationDetail,
    renderCompact: renderDoorExitLocationCompact,
  },
  exitDirection: {
    renderDetail: renderExitDirectionDetail,
    renderCompact: renderExitDirectionCompact,
  },
  exitAlternative: {
    renderDetail: renderExitAlternativeDetail,
    renderCompact: renderExitAlternativeCompact,
  },
  monsterLevel: monsterAdapter,
  monsterOne: monsterAdapter,
  monsterTwo: monsterAdapter,
  monsterThree: monsterAdapter,
  monsterFour: monsterAdapter,
  monsterFive: monsterAdapter,
  monsterSix: monsterAdapter,
  dragonThree: monsterAdapter,
  dragonFourYounger: monsterAdapter,
  dragonFourOlder: monsterAdapter,
  dragonFiveYounger: monsterAdapter,
  dragonFiveOlder: monsterAdapter,
  dragonSix: monsterAdapter,
  human: monsterAdapter,
} as const;

type PendingPreviewBuilder = (
  tableId: string,
  context?: TableContext
) => DungeonTablePreview | undefined;

const PENDING_PREVIEW_FACTORIES: Record<string, PendingPreviewBuilder> = {
  doorLocation: buildDoorLocationPreview,
  periodicCheckDoorOnly: buildPeriodicDoorOnlyPreview,
  sidePassages: buildSidePassagePreview,
  passageTurns: buildPassageTurnPreview,
  passageWidth: buildPassageWidthPreview,
  roomDimensions: buildRoomDimensionsPreview,
  chamberDimensions: buildChamberDimensionsPreview,
  numberOfExits: (tableId, context) =>
    buildNumberOfExitsPreview(tableId, context),
  unusualShape: buildUnusualShapePreview,
  unusualSize: (tableId, context) => buildUnusualSizePreview(tableId, context),
  chamberRoomContents: buildChamberRoomContentsPreview,
  chamberRoomStairs: buildChamberRoomStairsPreview,
  stairs: buildStairsPreview,
  specialPassage: buildSpecialPassagePreview,
  egress: buildEgressPreview,
  chute: buildChutePreview,
  wanderingWhereFrom: buildWanderingWhereFromPreview,
  galleryStairLocation: buildGalleryStairLocationPreview,
  galleryStairOccurrence: buildGalleryStairOccurrencePreview,
  circularContents: buildCircularContentsPreview,
  circularPool: buildCircularPoolPreview,
  circularMagicPool: buildCircularMagicPoolPreview,
  transmuteType: buildTransmuteTypePreview,
  poolAlignment: buildPoolAlignmentPreview,
  transporterLocation: buildTransporterLocationPreview,
  streamConstruction: buildStreamConstructionPreview,
  riverConstruction: buildRiverConstructionPreview,
  riverBoatBank: buildRiverBoatBankPreview,
  chasmDepth: buildChasmDepthPreview,
  chasmConstruction: buildChasmConstructionPreview,
  jumpingPlaceWidth: buildJumpingPlaceWidthPreview,
  trickTrap: buildTrickTrapPreview,
  illusionaryWallNature: buildIllusionaryWallNaturePreview,
  gasTrapEffect: buildGasTrapEffectPreview,
  treasure: buildTreasurePreview,
  treasureContainer: buildTreasureContainerPreview,
  treasureProtectionType: buildTreasureProtectionTypePreview,
  treasureProtectionGuardedBy: buildTreasureProtectionGuardedByPreview,
  treasureProtectionHiddenBy: buildTreasureProtectionHiddenByPreview,
  treasureMagicCategory: buildTreasureMagicCategoryPreview,
  treasurePotion: buildTreasurePotionPreview,
  treasurePotionAnimalControl: buildTreasurePotionAnimalControlPreview,
  treasurePotionDragonControl: buildTreasurePotionDragonControlPreview,
  treasurePotionGiantControl: buildTreasurePotionGiantControlPreview,
  treasurePotionGiantStrength: buildTreasurePotionGiantStrengthPreview,
  treasurePotionHumanControl: buildTreasurePotionHumanControlPreview,
  treasurePotionUndeadControl: buildTreasurePotionUndeadControlPreview,
  treasureScroll: buildTreasureScrollPreview,
  treasureScrollProtectionElementals:
    buildTreasureScrollProtectionElementalsPreview,
  treasureScrollProtectionLycanthropes:
    buildTreasureScrollProtectionLycanthropesPreview,
  treasureRing: buildTreasureRingPreview,
  treasureRingContrariness: buildTreasureRingContrarinessPreview,
  treasureRingElementalCommand: buildTreasureRingElementalCommandPreview,
  treasureRingProtection: buildTreasureRingProtectionPreview,
  treasureRingRegeneration: buildTreasureRingRegenerationPreview,
  treasureRingTelekinesis: buildTreasureRingTelekinesisPreview,
  treasureRingThreeWishes: buildTreasureRingThreeWishesPreview,
  treasureRingWizardry: buildTreasureRingWizardryPreview,
  treasureRodStaffWand: buildTreasureRodStaffWandPreview,
  treasureMiscMagicE1: buildTreasureMiscMagicE1Preview,
  treasureStaffSerpent: buildTreasureStaffSerpentPreview,
  passageExitLocation: buildPassageExitLocationPreview,
  doorExitLocation: buildDoorExitLocationPreview,
  exitDirection: buildExitDirectionPreview,
  exitAlternative: buildExitAlternativePreview,
};

const MONSTER_PREVIEW_BASES = [
  'monsterLevel',
  'monsterOne',
  'monsterTwo',
  'monsterThree',
  'monsterFour',
  'monsterFive',
  'monsterSix',
  'dragonThree',
  'dragonFourYounger',
  'dragonFourOlder',
  'dragonFiveYounger',
  'dragonFiveOlder',
  'dragonSix',
  'human',
];

for (const base of MONSTER_PREVIEW_BASES) {
  PENDING_PREVIEW_FACTORIES[base] = (tableId, context) =>
    buildMonsterPreview(tableId, context);
}

function withTargetId(
  preview: DungeonTablePreview,
  fallback: string
): DungeonTablePreview {
  if (preview.targetId && preview.targetId.length > 0) return preview;
  return { ...preview, targetId: fallback };
}

function previewKey(preview: DungeonTablePreview): string {
  return preview.targetId && preview.targetId.length > 0
    ? preview.targetId
    : preview.id;
}

function appendPendingPreviews(
  outcome: DungeonOutcomeNode,
  collector: DungeonRenderNode[],
  seenPreviews?: Set<string>
): void {
  if (outcome.type !== 'event') return;
  const children = outcome.children;
  if (!children || !Array.isArray(children)) return;
  for (const child of children) {
    if (child.type !== 'pending-roll') continue;
    const preview = previewForPending(child);
    if (!preview) continue;
    const normalized = withTargetId(preview, child.id ?? child.table);
    const key = previewKey(normalized);
    if (seenPreviews && seenPreviews.has(key)) continue;
    const alreadyPresent = collector.some((node) => {
      if (node.kind !== 'table-preview') return false;
      const existingKey = previewKey(node);
      return existingKey === key;
    });
    if (!alreadyPresent) {
      collector.push(normalized);
      if (seenPreviews) seenPreviews.add(key);
    }
  }
}

function previewForEventNode(
  node: OutcomeEventNode
): DungeonTablePreview | undefined {
  const event = node.event;
  let tableId: string | undefined;
  let context: TableContext | undefined;
  switch (event.kind) {
    case 'periodicCheck':
      tableId = 'periodicCheck';
      break;
    case 'doorBeyond':
      tableId = 'doorBeyond';
      break;
    case 'doorLocation':
      tableId = `doorLocation:${event.sequence}`;
      break;
    case 'periodicCheckDoorOnly':
      tableId = `periodicCheckDoorOnly:${event.sequence}`;
      break;
    case 'sidePassages':
      tableId = 'sidePassages';
      break;
    case 'passageTurns':
      tableId = 'passageTurns';
      break;
    case 'passageWidth':
      tableId = 'passageWidth';
      break;
    case 'roomDimensions':
      tableId = 'roomDimensions';
      break;
    case 'chamberDimensions':
      tableId = 'chamberDimensions';
      break;
    case 'circularContents':
      tableId = 'circularContents';
      break;
    case 'circularPool':
      tableId = 'circularPool';
      break;
    case 'circularMagicPool':
      tableId = 'circularMagicPool';
      break;
    case 'transmuteType':
      tableId = 'transmuteType';
      break;
    case 'poolAlignment':
      tableId = 'poolAlignment';
      break;
    case 'transporterLocation':
      tableId = 'transporterLocation';
      break;
    case 'specialPassage':
      tableId = 'specialPassage';
      break;
    case 'stairs':
      tableId = 'stairs';
      break;
    case 'trickTrap':
      tableId = 'trickTrap';
      break;
    case 'illusionaryWallNature':
      tableId = 'illusionaryWallNature';
      break;
    case 'gasTrapEffect':
      tableId = 'gasTrapEffect';
      break;
    case 'treasureMagicCategory': {
      const treasureMagic = event;
      tableId = 'treasureMagicCategory';
      context = {
        kind: 'treasureMagic',
        level: treasureMagic.level,
        treasureRoll: treasureMagic.treasureRoll,
        rollIndex: treasureMagic.rollIndex,
      };
      break;
    }
    case 'treasurePotion': {
      const potion = event;
      tableId = 'treasurePotion';
      context = {
        kind: 'treasureMagic',
        level: potion.level,
        treasureRoll: potion.treasureRoll,
        rollIndex: potion.rollIndex,
      };
      break;
    }
    case 'treasurePotionDragonControl': {
      const dragon = event;
      tableId = 'treasurePotionDragonControl';
      context = {
        kind: 'treasureMagic',
        level: dragon.level,
        treasureRoll: dragon.treasureRoll,
        rollIndex: dragon.rollIndex,
      };
      break;
    }
    case 'treasurePotionGiantControl': {
      const giant = event;
      tableId = 'treasurePotionGiantControl';
      context = {
        kind: 'treasureMagic',
        level: giant.level,
        treasureRoll: giant.treasureRoll,
        rollIndex: giant.rollIndex,
      };
      break;
    }
    case 'treasurePotionGiantStrength': {
      const strength = event;
      tableId = 'treasurePotionGiantStrength';
      context = {
        kind: 'treasureMagic',
        level: strength.level,
        treasureRoll: strength.treasureRoll,
        rollIndex: strength.rollIndex,
      };
      break;
    }
    case 'treasurePotionHumanControl': {
      const human = event;
      tableId = 'treasurePotionHumanControl';
      context = {
        kind: 'treasureMagic',
        level: human.level,
        treasureRoll: human.treasureRoll,
        rollIndex: human.rollIndex,
      };
      break;
    }
    case 'treasurePotionUndeadControl': {
      const undead = event;
      tableId = 'treasurePotionUndeadControl';
      context = {
        kind: 'treasureMagic',
        level: undead.level,
        treasureRoll: undead.treasureRoll,
        rollIndex: undead.rollIndex,
      };
      break;
    }
    case 'treasureScroll': {
      const scrollEvent = event;
      tableId = 'treasureScroll';
      context = {
        kind: 'treasureMagic',
        level: scrollEvent.level,
        treasureRoll: scrollEvent.treasureRoll,
        rollIndex: scrollEvent.rollIndex,
      };
      break;
    }
    case 'treasureScrollProtectionElementals':
      tableId = 'treasureScrollProtectionElementals';
      break;
    case 'treasureScrollProtectionLycanthropes':
      tableId = 'treasureScrollProtectionLycanthropes';
      break;
    case 'treasureRing': {
      const ring = event;
      tableId = 'treasureRing';
      context = {
        kind: 'treasureMagic',
        level: ring.level,
        treasureRoll: ring.treasureRoll,
        rollIndex: ring.rollIndex,
      };
      break;
    }
    case 'treasureRingContrariness':
      tableId = 'treasureRingContrariness';
      break;
    case 'treasureRingElementalCommand':
      tableId = 'treasureRingElementalCommand';
      break;
    case 'treasureRingProtection':
      tableId = 'treasureRingProtection';
      break;
    case 'treasureRingRegeneration':
      tableId = 'treasureRingRegeneration';
      break;
    case 'treasureRingTelekinesis':
      tableId = 'treasureRingTelekinesis';
      break;
    case 'treasureRingThreeWishes':
      tableId = 'treasureRingThreeWishes';
      break;
    case 'treasureRingWizardry':
      tableId = 'treasureRingWizardry';
      break;
    case 'treasureRodStaffWand':
      tableId = 'treasureRodStaffWand';
      break;
    case 'treasureMiscMagicE1':
      tableId = 'treasureMiscMagicE1';
      break;
    case 'treasureStaffSerpent':
      tableId = 'treasureStaffSerpent';
      break;
    case 'treasurePotionAnimalControl': {
      const potionCategory = event;
      tableId = 'treasurePotionAnimalControl';
      context = {
        kind: 'treasureMagic',
        level: potionCategory.level,
        treasureRoll: potionCategory.treasureRoll,
        rollIndex: potionCategory.rollIndex,
      };
      break;
    }
    case 'treasure': {
      const treasure = event;
      tableId = 'treasure';
      context = {
        kind: 'treasure',
        level: treasure.level,
        withMonster: treasure.withMonster,
        rollIndex: treasure.rollIndex,
        totalRolls: treasure.totalRolls,
      };
      break;
    }
    case 'treasureContainer':
      tableId = 'treasureContainer';
      context = { kind: 'treasureContainer' };
      break;
    case 'treasureProtectionType':
      tableId = 'treasureProtectionType';
      context = { kind: 'treasureProtection', treasureRoll: node.roll };
      break;
    case 'treasureProtectionGuardedBy':
      tableId = 'treasureProtectionGuardedBy';
      context = { kind: 'treasureProtection', treasureRoll: node.roll };
      break;
    case 'treasureProtectionHiddenBy':
      tableId = 'treasureProtectionHiddenBy';
      context = { kind: 'treasureProtection', treasureRoll: node.roll };
      break;
    case 'passageExitLocation':
      tableId = 'passageExitLocation';
      break;
    case 'doorExitLocation':
      tableId = 'doorExitLocation';
      break;
    case 'exitDirection':
      tableId = 'exitDirection';
      break;
    case 'exitAlternative':
      tableId = 'exitAlternative';
      break;
    case 'egress':
      tableId = `egress:${event.which}`;
      break;
    case 'chute':
      tableId = 'chute';
      break;
    case 'numberOfExits':
      tableId = 'numberOfExits';
      context = {
        kind: 'exits',
        length: event.context.length,
        width: event.context.width,
        isRoom: event.context.isRoom,
      };
      break;
    case 'unusualShape':
      tableId = 'unusualShape';
      break;
    case 'unusualSize':
      tableId = 'unusualSize';
      break;
    case 'chamberRoomContents':
      if (event.autoResolved) return undefined;
      tableId = 'chamberRoomContents';
      break;
    case 'chamberRoomStairs':
      tableId = 'chamberRoomStairs';
      break;
    case 'wanderingWhereFrom':
      tableId = 'wanderingWhereFrom';
      break;
    case 'galleryStairLocation':
      tableId = 'galleryStairLocation';
      break;
    case 'galleryStairOccurrence':
      tableId = 'galleryStairOccurrence';
      break;
    case 'streamConstruction':
      tableId = 'streamConstruction';
      break;
    case 'riverConstruction':
      tableId = 'riverConstruction';
      break;
    case 'riverBoatBank':
      tableId = 'riverBoatBank';
      break;
    case 'chasmDepth':
      tableId = 'chasmDepth';
      break;
    case 'chasmConstruction':
      tableId = 'chasmConstruction';
      break;
    case 'jumpingPlaceWidth':
      tableId = 'jumpingPlaceWidth';
      break;
    case 'monsterLevel':
      tableId = `monsterLevel:${event.dungeonLevel}`;
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterOne':
      tableId = 'monsterOne';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterTwo':
      tableId = 'monsterTwo';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterThree':
      tableId = 'monsterThree';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterFour':
      tableId = 'monsterFour';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterFive':
      tableId = 'monsterFive';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterSix':
      tableId = 'monsterSix';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonThree':
      tableId = 'dragonThree';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonFourYounger':
      tableId = 'dragonFourYounger';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonFourOlder':
      tableId = 'dragonFourOlder';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonFiveYounger':
      tableId = 'dragonFiveYounger';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonFiveOlder':
      tableId = 'dragonFiveOlder';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonSix':
      tableId = 'dragonSix';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'human':
      tableId = 'human';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    default:
      tableId = undefined;
  }
  if (!tableId) return undefined;
  const preview = previewForPending({
    type: 'pending-roll',
    table: tableId,
    id: node.id,
    context,
  });
  if (!preview) return undefined;
  return withTargetId(preview, node.id ?? tableId);
}

// DETAIL MODE: outcome -> render nodes with previews for staged tables
export function toDetailRender(
  outcome: DungeonOutcomeNode
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const adapter = RENDER_ADAPTERS[outcome.event.kind];
  if (adapter) {
    return adapter.renderDetail(outcome, appendPendingPreviews);
  }
  const monsterNodes = renderMonsterDetailNodes(outcome, appendPendingPreviews);
  if (monsterNodes.length > 0) {
    return monsterNodes;
  }
  return [];
}

export function renderDetailTree(
  outcome: DungeonOutcomeNode,
  includeHeading = true,
  seenPreviews: Set<string> = new Set()
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const preview = previewForEventNode(outcome);
  const nodes: DungeonRenderNode[] = [];
  const pendingPreviewIds = new Set<string>();
  if (Array.isArray(outcome.children)) {
    for (const child of outcome.children) {
      if (child.type !== 'pending-roll') continue;
      const pendingPreview = previewForPending(child);
      if (pendingPreview) {
        const normalizedPending = withTargetId(
          pendingPreview,
          child.id ?? child.table
        );
        pendingPreviewIds.add(previewKey(normalizedPending));
      }
    }
  }
  const hasChildEventSameKind = Array.isArray(outcome.children)
    ? outcome.children.some(
        (child): child is OutcomeEventNode =>
          child.type === 'event' && child.event.kind === outcome.event.kind
      )
    : false;
  if (preview && !hasChildEventSameKind) {
    const normalizedPreview = withTargetId(preview, outcome.id ?? preview.id);
    const key = previewKey(normalizedPreview);
    if (!pendingPreviewIds.has(key) && !seenPreviews.has(key)) {
      nodes.push(normalizedPreview);
      seenPreviews.add(key);
    }
  }
  const detailNodes = includeHeading
    ? toDetailRender(outcome)
    : toDetailRender(outcome).filter((n) => n.kind !== 'heading');
  for (const detailNode of detailNodes) {
    if (detailNode.kind === 'table-preview') {
      const normalized = withTargetId(detailNode, outcome.id ?? detailNode.id);
      const key = previewKey(normalized);
      if (seenPreviews.has(key)) continue;
      nodes.push(normalized);
      seenPreviews.add(key);
    } else {
      nodes.push(detailNode);
    }
  }
  if (!outcome.children) return nodes;
  for (const child of outcome.children) {
    if (child.type !== 'event') continue;
    nodes.push(...renderDetailTree(child, false, seenPreviews));
  }
  return nodes;
}

function previewForPending(p: PendingRoll): DungeonTablePreview | undefined {
  const base = String(p.table.split(':')[0]);
  const factory = PENDING_PREVIEW_FACTORIES[base];
  if (!factory) return undefined;
  const context = isTableContext(p.context) ? p.context : undefined;
  return factory(p.table, context);
}

// COMPACT MODE: outcome -> render nodes with auto-resolved text (no previews)
export function toCompactRender(
  outcome: DungeonOutcomeNode
): DungeonRenderNode[] {
  if (outcome.type !== 'event') return [];
  const adapter = RENDER_ADAPTERS[outcome.event.kind];
  if (adapter) {
    return adapter.renderCompact(outcome, appendPendingPreviews);
  }
  const monsterCompactNodes = renderMonsterCompactNodes(
    outcome,
    appendPendingPreviews
  );
  if (monsterCompactNodes.length > 0) {
    return monsterCompactNodes;
  }
  return [];
}

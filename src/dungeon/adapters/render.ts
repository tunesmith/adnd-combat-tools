import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../domain/outcome';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import { PASSAGE_CONTINUES_SUFFIX } from './render/periodicOutcome';
import {
  renderRoomDimensionsDetail,
  renderRoomDimensionsCompactNodes,
  buildRoomDimensionsPreview,
} from './render/roomDimensions';
import {
  renderChamberDimensionsDetail,
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
  buildMonsterPreview,
  renderMonsterDetailNodes,
  renderMonsterCompactNodes,
} from '../features/monsters/render';
import {
  renderTreasureDetail,
  renderTreasureCompactNodes,
  buildTreasurePreview,
} from './render/treasure';
import {
  renderTreasureArmorShieldsDetail,
  renderTreasureArmorShieldsCompact,
  buildTreasureArmorShieldsPreview,
} from './render/treasureArmorShields';
import {
  renderTreasureSwordsDetail,
  renderTreasureSwordsCompact,
  buildTreasureSwordsPreview,
  renderTreasureSwordKindDetail,
  renderTreasureSwordKindCompact,
  buildTreasureSwordKindPreview,
  renderTreasureSwordUnusualDetail,
  renderTreasureSwordUnusualCompact,
  buildTreasureSwordUnusualPreview,
  renderTreasureSwordPrimaryAbilityDetail,
  renderTreasureSwordPrimaryAbilityCompact,
  buildTreasureSwordPrimaryAbilityPreview,
  renderTreasureSwordExtraordinaryPowerDetail,
  renderTreasureSwordExtraordinaryPowerCompact,
  buildTreasureSwordExtraordinaryPowerPreview,
  renderTreasureSwordSpecialPurposeDetail,
  renderTreasureSwordSpecialPurposeCompact,
  renderTreasureSwordSpecialPurposePowerDetail,
  renderTreasureSwordSpecialPurposePowerCompact,
  buildTreasureSwordSpecialPurposePreview,
  buildTreasureSwordSpecialPurposePowerPreview,
  renderTreasureSwordDragonSlayerColorDetail,
  renderTreasureSwordDragonSlayerColorCompact,
  buildTreasureSwordDragonSlayerColorPreview,
  renderTreasureSwordAlignmentDetail,
  renderTreasureSwordAlignmentCompact,
  buildTreasureSwordAlignmentPreview,
  buildTreasureSwordAlignmentChaoticPreview,
  buildTreasureSwordAlignmentLawfulPreview,
} from './render/treasureSwords';
import {
  renderTreasureMiscWeaponsDetail,
  renderTreasureMiscWeaponsCompact,
  buildTreasureMiscWeaponsPreview,
} from './render/treasureMiscWeapons';
import { isTableContext } from '../helpers/outcomeTree';
import {
  buildCircularContentsPreview,
  renderCircularContentsCompact,
  renderCircularContentsDetail,
} from './render/circularContents';
import type { AppendPreviewFn } from './render/shared';
import {
  ALL_PREVIEW_FACTORIES,
  ALL_RENDER_ADAPTERS,
} from '../features/bundle';

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

const withoutAppend =
  (
    renderer: (node: OutcomeEventNode) => DungeonRenderNode[]
  ): RenderCompactFn =>
  (node, _append) =>
    renderer(node);

const monsterAdapter: RenderAdapter = {
  renderDetail: renderMonsterDetailNodes,
  renderCompact: renderMonsterCompactNodes,
};

const RENDER_ADAPTERS: Partial<Record<OutcomeEventKind, RenderAdapter>> = {
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
  treasure: {
    renderDetail: renderTreasureDetail,
    renderCompact: withoutAppend(renderTreasureCompactNodes),
  },
  treasureArmorShields: {
    renderDetail: renderTreasureArmorShieldsDetail,
    renderCompact: renderTreasureArmorShieldsCompact,
  },
  treasureSwords: {
    renderDetail: renderTreasureSwordsDetail,
    renderCompact: renderTreasureSwordsCompact,
  },
  treasureSwordKind: {
    renderDetail: renderTreasureSwordKindDetail,
    renderCompact: renderTreasureSwordKindCompact,
  },
  treasureSwordUnusual: {
    renderDetail: renderTreasureSwordUnusualDetail,
    renderCompact: renderTreasureSwordUnusualCompact,
  },
  treasureSwordPrimaryAbility: {
    renderDetail: renderTreasureSwordPrimaryAbilityDetail,
    renderCompact: renderTreasureSwordPrimaryAbilityCompact,
  },
  treasureSwordExtraordinaryPower: {
    renderDetail: renderTreasureSwordExtraordinaryPowerDetail,
    renderCompact: renderTreasureSwordExtraordinaryPowerCompact,
  },
  treasureSwordSpecialPurpose: {
    renderDetail: renderTreasureSwordSpecialPurposeDetail,
    renderCompact: renderTreasureSwordSpecialPurposeCompact,
  },
  treasureSwordSpecialPurposePower: {
    renderDetail: renderTreasureSwordSpecialPurposePowerDetail,
    renderCompact: renderTreasureSwordSpecialPurposePowerCompact,
  },
  treasureSwordDragonSlayerColor: {
    renderDetail: renderTreasureSwordDragonSlayerColorDetail,
    renderCompact: renderTreasureSwordDragonSlayerColorCompact,
  },
  treasureSwordAlignment: {
    renderDetail: renderTreasureSwordAlignmentDetail,
    renderCompact: renderTreasureSwordAlignmentCompact,
  },
  treasureMiscWeapons: {
    renderDetail: renderTreasureMiscWeaponsDetail,
    renderCompact: renderTreasureMiscWeaponsCompact,
  },
  monsterFour: monsterAdapter,
  monsterFive: monsterAdapter,
  monsterSix: monsterAdapter,
  monsterSeven: monsterAdapter,
  monsterEight: monsterAdapter,
  monsterNine: monsterAdapter,
  monsterTen: monsterAdapter,
  dragonFourYounger: monsterAdapter,
  dragonFourOlder: monsterAdapter,
  dragonFiveYounger: monsterAdapter,
  dragonFiveOlder: monsterAdapter,
  dragonSix: monsterAdapter,
  dragonSeven: monsterAdapter,
  dragonEight: monsterAdapter,
  dragonNine: monsterAdapter,
  dragonTen: monsterAdapter,
  human: monsterAdapter,
} as const;

Object.assign(RENDER_ADAPTERS, ALL_RENDER_ADAPTERS);

type PendingPreviewBuilder = (
  tableId: string,
  context?: TableContext
) => DungeonTablePreview | undefined;

const PENDING_PREVIEW_FACTORIES: Record<string, PendingPreviewBuilder> = {
  roomDimensions: buildRoomDimensionsPreview,
  chamberDimensions: buildChamberDimensionsPreview,
  unusualShape: buildUnusualShapePreview,
  unusualSize: (tableId, context) => buildUnusualSizePreview(tableId, context),
  chamberRoomContents: buildChamberRoomContentsPreview,
  chamberRoomStairs: buildChamberRoomStairsPreview,
  circularContents: buildCircularContentsPreview,
  circularPool: buildCircularPoolPreview,
  circularMagicPool: buildCircularMagicPoolPreview,
  transmuteType: buildTransmuteTypePreview,
  poolAlignment: buildPoolAlignmentPreview,
  transporterLocation: buildTransporterLocationPreview,
  treasure: buildTreasurePreview,
  treasureArmorShields: buildTreasureArmorShieldsPreview,
  treasureSwords: buildTreasureSwordsPreview,
  treasureSwordKind: buildTreasureSwordKindPreview,
  treasureSwordUnusual: buildTreasureSwordUnusualPreview,
  treasureSwordPrimaryAbility: buildTreasureSwordPrimaryAbilityPreview,
  treasureSwordPrimaryAbilityRestricted:
    buildTreasureSwordPrimaryAbilityPreview,
  treasureSwordExtraordinaryPower: buildTreasureSwordExtraordinaryPowerPreview,
  treasureSwordExtraordinaryPowerRestricted:
    buildTreasureSwordExtraordinaryPowerPreview,
  treasureSwordSpecialPurpose: buildTreasureSwordSpecialPurposePreview,
  treasureSwordSpecialPurposePower:
    buildTreasureSwordSpecialPurposePowerPreview,
  treasureSwordDragonSlayerColor: buildTreasureSwordDragonSlayerColorPreview,
  treasureSwordAlignment: buildTreasureSwordAlignmentPreview,
  treasureSwordAlignmentChaotic: buildTreasureSwordAlignmentChaoticPreview,
  treasureSwordAlignmentLawful: buildTreasureSwordAlignmentLawfulPreview,
  treasureMiscWeapons: buildTreasureMiscWeaponsPreview,
};

Object.assign(PENDING_PREVIEW_FACTORIES, ALL_PREVIEW_FACTORIES);

const MONSTER_PREVIEW_BASES = [
  'monsterFour',
  'monsterFive',
  'monsterSix',
  'monsterSeven',
  'monsterEight',
  'monsterNine',
  'monsterTen',
  'dragonFourYounger',
  'dragonFourOlder',
  'dragonFiveYounger',
  'dragonFiveOlder',
  'dragonSix',
  'dragonSeven',
  'dragonEight',
  'dragonNine',
  'dragonTen',
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

function parseNodeContextFromId(
  id: string | undefined,
  prefix: string
): { slotKey?: string; rollIndex?: number } {
  if (!id || !id.startsWith(prefix)) {
    return {};
  }
  const remainder = id.slice(prefix.length);
  if (!remainder) return {};
  const colonIndex = remainder.indexOf(':');
  if (colonIndex === -1) {
    return { slotKey: remainder };
  }
  const maybeIndex = remainder.slice(0, colonIndex);
  const potentialSlot = remainder.slice(colonIndex + 1);
  const parsedIndex = Number.parseInt(maybeIndex, 10);
  if (Number.isNaN(parsedIndex)) {
    return { slotKey: remainder };
  }
  return {
    slotKey: potentialSlot,
    rollIndex: parsedIndex,
  };
}

function extractTableVariant(result: unknown): 'standard' | 'restricted' {
  if (result && typeof result === 'object') {
    const tableVariant = (result as { tableVariant?: unknown }).tableVariant;
    if (tableVariant === 'restricted') {
      return 'restricted';
    }
  }
  return 'standard';
}

function shouldSuppressPreview(
  parentEvent: OutcomeEvent,
  childEvent: OutcomeEvent
): boolean {
  if (childEvent.kind !== parentEvent.kind) return false;
  if (
    childEvent.kind === 'treasureSwordPrimaryAbility' &&
    parentEvent.kind === 'treasureSwordPrimaryAbility'
  ) {
    const parentVariant = extractTableVariant(parentEvent.result);
    const childVariant = extractTableVariant(childEvent.result);
    if (parentVariant === 'standard' && childVariant === 'restricted') {
      return false;
    }
  }
  if (
    childEvent.kind === 'treasureSwordExtraordinaryPower' &&
    parentEvent.kind === 'treasureSwordExtraordinaryPower'
  ) {
    const parentVariant = extractTableVariant(parentEvent.result);
    const childVariant = extractTableVariant(childEvent.result);
    if (parentVariant === 'standard' && childVariant === 'restricted') {
      return false;
    }
  }
  return true;
}

function abilityPreviewContextFromNode(
  node: OutcomeEventNode,
  variant: 'standard' | 'restricted'
): TableContext | undefined {
  const info = parseNodeContextFromId(node.id, 'treasureSwordPrimaryAbility:');
  if (!info.slotKey && info.rollIndex === undefined) {
    return undefined;
  }
  return {
    kind: 'treasureSwordPrimaryAbility',
    slotKey: info.slotKey,
    rollIndex: info.rollIndex,
    tableVariant: variant,
  };
}

function extraordinaryPreviewContextFromNode(
  node: OutcomeEventNode,
  variant: 'standard' | 'restricted'
): TableContext | undefined {
  const info = parseNodeContextFromId(
    node.id,
    'treasureSwordExtraordinaryPower:'
  );
  if (!info.slotKey && info.rollIndex === undefined) {
    return undefined;
  }
  return {
    kind: 'treasureSwordExtraordinaryPower',
    slotKey: info.slotKey,
    rollIndex: info.rollIndex,
    tableVariant: variant,
  };
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
  let autoCollapse = false;
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
    case 'treasureArmorShields': {
      const armor = event;
      tableId = 'treasureArmorShields';
      context = {
        kind: 'treasureMagic',
        level: armor.level,
        treasureRoll: armor.treasureRoll,
        rollIndex: armor.rollIndex,
      };
      break;
    }
    case 'treasureSwords': {
      const sword = event;
      tableId = 'treasureSwords';
      context = {
        kind: 'treasureMagic',
        level: sword.level,
        treasureRoll: sword.treasureRoll,
        rollIndex: sword.rollIndex,
      };
      break;
    }
    case 'treasureSwordKind':
      tableId = 'treasureSwordKind';
      break;
    case 'treasureSwordUnusual':
      tableId = 'treasureSwordUnusual';
      break;
    case 'treasureSwordPrimaryAbility': {
      const result = event.result;
      const variant =
        result.kind === 'ability'
          ? result.tableVariant
          : result.tableVariant ?? 'standard';
      tableId =
        variant === 'restricted'
          ? 'treasureSwordPrimaryAbilityRestricted'
          : 'treasureSwordPrimaryAbility';
      const abilityContext = abilityPreviewContextFromNode(node, variant);
      if (abilityContext) {
        context = abilityContext;
      }
      if (result.kind === 'ability' || result.kind === 'instruction') {
        autoCollapse = true;
      }
      break;
    }
    case 'treasureSwordExtraordinaryPower': {
      const result = event.result;
      const variant =
        result.kind === 'power'
          ? result.tableVariant
          : result.tableVariant ?? 'standard';
      tableId =
        variant === 'restricted'
          ? 'treasureSwordExtraordinaryPowerRestricted'
          : 'treasureSwordExtraordinaryPower';
      const extraContext = extraordinaryPreviewContextFromNode(node, variant);
      if (extraContext) {
        context = extraContext;
      }
      if (result.kind === 'power' || result.kind === 'instruction') {
        autoCollapse = true;
      }
      break;
    }
    case 'treasureSwordSpecialPurpose': {
      tableId = 'treasureSwordSpecialPurpose';
      const info = parseNodeContextFromId(
        node.id,
        'treasureSwordSpecialPurpose:'
      );
      const alignment = event.result?.alignment;
      context = {
        kind: 'treasureSwordSpecialPurpose',
        slotKey: info.slotKey,
        rollIndex: info.rollIndex,
        alignment,
      };
      autoCollapse = true;
      break;
    }
    case 'treasureSwordSpecialPurposePower': {
      tableId = 'treasureSwordSpecialPurposePower';
      const info = parseNodeContextFromId(
        node.id,
        'treasureSwordSpecialPurposePower:'
      );
      context = {
        kind: 'treasureSwordSpecialPurposePower',
        slotKey: info.slotKey,
        rollIndex: info.rollIndex,
      };
      autoCollapse = true;
      break;
    }
    case 'treasureSwordAlignment': {
      const alignmentSource = event.result.source;
      if (alignmentSource === 'fixed') {
        return undefined;
      }
      if (alignmentSource === 'chaotic') {
        tableId = 'treasureSwordAlignmentChaotic';
      } else if (alignmentSource === 'lawful') {
        tableId = 'treasureSwordAlignmentLawful';
      } else {
        tableId = 'treasureSwordAlignment';
      }
      break;
    }
    case 'treasureMiscWeapons': {
      const weapon = event;
      tableId = 'treasureMiscWeapons';
      context = {
        kind: 'treasureMagic',
        level: weapon.level,
        treasureRoll: weapon.treasureRoll,
        rollIndex: weapon.rollIndex,
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
    case 'treasureBagOfHolding':
      tableId = 'treasureBagOfHolding';
      break;
    case 'treasureBagOfTricks':
      tableId = 'treasureBagOfTricks';
      break;
    case 'treasureBracersOfDefense':
      tableId = 'treasureBracersOfDefense';
      break;
    case 'treasureBucknardsEverfullPurse':
      tableId = 'treasureBucknardsEverfullPurse';
      break;
    case 'treasureHornOfValhallaType':
      tableId = 'treasureHornOfValhallaType';
      break;
    case 'treasureHornOfValhallaAttunement':
      tableId = 'treasureHornOfValhallaAttunement';
      break;
    case 'treasureHornOfValhallaAlignment':
      tableId = 'treasureHornOfValhallaAlignment';
      break;
    case 'treasureArtifactOrRelic':
      tableId = 'treasureArtifactOrRelic';
      break;
    case 'treasureMiscMagicE2':
      tableId = 'treasureMiscMagicE2';
      break;
    case 'treasureCarpetOfFlying':
      tableId = 'treasureCarpetOfFlying';
      break;
    case 'treasureCloakOfProtection':
      tableId = 'treasureCloakOfProtection';
      break;
    case 'treasureCrystalBall':
      tableId = 'treasureCrystalBall';
      break;
    case 'treasureMiscMagicE3':
      tableId = 'treasureMiscMagicE3';
      break;
    case 'treasureMiscMagicE4':
      tableId = 'treasureMiscMagicE4';
      break;
    case 'treasureMiscMagicE5':
      tableId = 'treasureMiscMagicE5';
      break;
    case 'treasureRobeOfTheArchmagi':
      tableId = 'treasureRobeOfTheArchmagi';
      break;
    case 'treasureScarabOfProtectionCurse':
      tableId = 'treasureScarabOfProtectionCurse';
      break;
    case 'treasureScarabOfProtectionCurseResolution':
      tableId = 'treasureScarabOfProtectionCurseResolution';
      break;
    case 'treasureManualOfGolems':
      tableId = 'treasureManualOfGolems';
      break;
    case 'treasureMedallionRange':
      tableId = 'treasureMedallionRange';
      break;
    case 'treasureNecklaceOfMissiles':
      tableId = 'treasureNecklaceOfMissiles';
      break;
    case 'treasurePearlOfPowerEffect':
      tableId = 'treasurePearlOfPowerEffect';
      break;
    case 'treasurePearlOfPowerRecall':
      tableId = 'treasurePearlOfPowerRecall';
      break;
    case 'treasurePearlOfWisdom':
      tableId = 'treasurePearlOfWisdom';
      break;
    case 'treasurePeriaptProofAgainstPoison':
      tableId = 'treasurePeriaptProofAgainstPoison';
      break;
    case 'treasurePhylacteryLongYears':
      tableId = 'treasurePhylacteryLongYears';
      break;
    case 'treasureQuaalFeatherToken':
      tableId = 'treasureQuaalFeatherToken';
      break;
    case 'treasureFigurineOfWondrousPower':
      tableId = 'treasureFigurineOfWondrousPower';
      break;
    case 'treasureFigurineMarbleElephant':
      tableId = 'treasureFigurineMarbleElephant';
      break;
    case 'treasureGirdleOfGiantStrength':
      tableId = 'treasureGirdleOfGiantStrength';
      break;
    case 'treasureInstrumentOfTheBards':
      tableId = 'treasureInstrumentOfTheBards';
      break;
    case 'treasureIronFlask':
      tableId = 'treasureIronFlask';
      break;
    case 'treasureDeckOfManyThings':
      tableId = 'treasureDeckOfManyThings';
      break;
    case 'treasureEyesOfPetrification':
      tableId = 'treasureEyesOfPetrification';
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
    case 'monsterSeven':
      tableId = 'monsterSeven';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterEight':
      tableId = 'monsterEight';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterNine':
      tableId = 'monsterNine';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'monsterTen':
      tableId = 'monsterTen';
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
    case 'dragonSeven':
      tableId = 'dragonSeven';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonEight':
      tableId = 'dragonEight';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonNine':
      tableId = 'dragonNine';
      context = { kind: 'wandering', level: event.dungeonLevel };
      break;
    case 'dragonTen':
      tableId = 'dragonTen';
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
  if (autoCollapse) {
    preview.autoCollapse = true;
  }
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
          child.type === 'event' &&
          shouldSuppressPreview(outcome.event, child.event)
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
    const childRendered = renderDetailTree(child, false, seenPreviews);
    nodes.push(...childRendered);
    // After resolving a Trick/Trap that originates from a periodic check,
    // add the standard continuation note.
    if (
      outcome.event.kind === 'periodicCheck' &&
      child.event.kind === 'trickTrap'
    ) {
      nodes.push({
        kind: 'paragraph',
        text: PASSAGE_CONTINUES_SUFFIX.trimStart(),
      });
    }
  }
  return nodes;
}

function previewForPending(p: PendingRoll): DungeonTablePreview | undefined {
  const base = String(p.table.split(':')[0]);
  const factory = PENDING_PREVIEW_FACTORIES[base];
  if (!factory) return undefined;
  const context = isTableContext(p.context) ? p.context : undefined;
  if (context) {
    const alignmentMissing =
      (base === 'treasureSwordSpecialPurpose' &&
        context.kind === 'treasureSwordSpecialPurpose' &&
        (context.alignment === undefined ||
          context.alignmentReady === false)) ||
      (base === 'treasureSwordSpecialPurposePower' &&
        context.kind === 'treasureSwordSpecialPurposePower' &&
        context.alignment === undefined) ||
      (base === 'treasureSwordDragonSlayerColor' &&
        context.kind === 'treasureSwordDragonSlayerColor' &&
        context.alignmentReady === false);
    if (alignmentMissing) {
      return undefined;
    }
  }
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

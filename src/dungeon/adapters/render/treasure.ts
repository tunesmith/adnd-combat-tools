import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode, TreasureEntry } from '../../domain/outcome';
import {
  treasureWithMonster,
  treasureWithoutMonster,
  TreasureWithoutMonster,
} from '../../../tables/dungeon/treasure';
import { resolvedPotionSentence } from './treasurePotion';
import { resolvedScrollSentence } from './treasureScroll';
import { ringSentence } from './treasureRing';
import { resolveRodStaffWandLabel } from './treasureRodStaffWand';
import {
  buildPreview,
  joinSegments,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { describeTreasureContainerResult } from './treasureContainer';
import {
  describeTreasureProtectionGuardedBy,
  describeTreasureProtectionHiddenBy,
} from './treasureProtection';
import { treasureMiscMagicE1Sentence } from './treasureMiscMagicE1';
import { bagOfHoldingSentence } from './treasureBagOfHolding';
import { bagOfTricksSentence } from './treasureBagOfTricks';
import { bracersSentence } from './treasureBracersOfDefense';
import { purseSentence } from './treasureBucknardsEverfullPurse';
import { artifactSentence } from './treasureArtifactOrRelic';
import { miscMagicE2Sentence } from './treasureMiscMagicE2';
import { cloakSentence } from './treasureCloakOfProtection';
import { TreasureProtectionType } from '../../../tables/dungeon/treasureProtection';
import { BAG_OF_HOLDING_STATS } from '../../../tables/dungeon/treasureBagOfHolding';

export function renderTreasureDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasure') return [];
  const { entries, withMonster, rollIndex, totalRolls } = outcome.event;
  const resolvedMagicDetail = describeResolvedMagic(outcome);

  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: headingLabel(withMonster, rollIndex, totalRolls),
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: entries.map((entry) => {
      const description = describeTreasureEntry(entry);
      const rollLabel =
        rollIndex && totalRolls && totalRolls > 1
          ? `roll ${rollIndex} of ${totalRolls}`
          : 'roll';
      return `${rollLabel}: ${entry.roll} — ${description.label}`;
    }),
  };

  const nodes: DungeonRenderNode[] = [heading, bullet];
  for (const entry of entries) {
    const description = describeTreasureEntry(entry);
    if (entry.command === TreasureWithoutMonster.Magic && resolvedMagicDetail) {
      nodes.push({ kind: 'paragraph', text: resolvedMagicDetail });
    } else {
      nodes.push({ kind: 'paragraph', text: description.detail });
    }
  }

  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasure') return [];
  const withMonster = outcome.event.withMonster ?? false;
  const { rollIndex, totalRolls } = outcome.event;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: headingLabel(withMonster, rollIndex, totalRolls),
  };
  const text = summarizeTreasureCompact(outcome);
  const paragraph: DungeonMessage = { kind: 'paragraph', text };
  return [heading, paragraph];
}

export const buildTreasurePreview: TablePreviewFactory = (tableId, context) => {
  const treasureContext =
    context && context.kind === 'treasure' ? context : undefined;
  const withMonster = treasureContext?.withMonster ?? false;
  const table = withMonster ? treasureWithMonster : treasureWithoutMonster;
  const rollIndex = treasureContext?.rollIndex;
  const totalRolls = treasureContext?.totalRolls;
  const title = headingLabel(withMonster, rollIndex, totalRolls);

  return buildPreview(tableId, {
    title,
    sides: table.sides,
    entries: table.entries.map((entry) => ({
      range: entry.range,
      label: previewLabelForCommand(entry.command),
    })),
    context,
  });
};

export function summarizeTreasureCompact(outcome: OutcomeEventNode): string {
  if (outcome.event.kind !== 'treasure') return '';
  const { entries } = outcome.event;
  const resolvedMagic = describeResolvedMagic(outcome);
  const segments = entries.map((entry) => {
    if (entry.command === TreasureWithoutMonster.Magic && resolvedMagic) {
      return resolvedMagic;
    }
    return describeTreasureEntry(entry).compact;
  });
  const container = findChildEvent(outcome, 'treasureContainer');
  if (container && container.event.kind === 'treasureContainer') {
    const containerText = describeTreasureContainerResult(
      container.event.result
    );
    if (containerText) segments.push(containerText);
  }
  const protection = describeTreasureProtection(outcome);
  if (protection) segments.push(protection);
  return joinSegments(segments).trim();
}

function describeResolvedMagic(outcome: OutcomeEventNode): string | undefined {
  const magic = findChildEvent(outcome, 'treasureMagicCategory');
  if (!magic || magic.event.kind !== 'treasureMagicCategory') return undefined;
  const potion = findChildEvent(magic, 'treasurePotion');
  if (potion && potion.event.kind === 'treasurePotion') {
    return resolvedPotionSentence(potion);
  }
  const scroll = findChildEvent(magic, 'treasureScroll');
  if (scroll && scroll.event.kind === 'treasureScroll') {
    return resolvedScrollSentence(scroll);
  }
  const ring = findChildEvent(magic, 'treasureRing');
  if (ring && ring.event.kind === 'treasureRing') {
    return ringSentence(ring.event.result, ring);
  }
  const rod = findChildEvent(magic, 'treasureRodStaffWand');
  if (rod && rod.event.kind === 'treasureRodStaffWand') {
    const label = resolveRodStaffWandLabel(rod);
    return label.length > 0 ? `There is a ${label}.` : undefined;
  }
  const miscMagicE1 = findChildEvent(magic, 'treasureMiscMagicE1');
  if (miscMagicE1 && miscMagicE1.event.kind === 'treasureMiscMagicE1') {
    const bag = findChildEvent(miscMagicE1, 'treasureBagOfHolding');
    if (bag && bag.event.kind === 'treasureBagOfHolding') {
      const stats = BAG_OF_HOLDING_STATS[bag.event.result];
      return bagOfHoldingSentence(stats);
    }
    const bagOfTricks = findChildEvent(miscMagicE1, 'treasureBagOfTricks');
    if (bagOfTricks && bagOfTricks.event.kind === 'treasureBagOfTricks') {
      return bagOfTricksSentence(bagOfTricks.event.result);
    }
    const bracers = findChildEvent(miscMagicE1, 'treasureBracersOfDefense');
    if (bracers && bracers.event.kind === 'treasureBracersOfDefense') {
      return bracersSentence(bracers.event.result);
    }
    const purse = findChildEvent(miscMagicE1, 'treasureBucknardsEverfullPurse');
    if (purse && purse.event.kind === 'treasureBucknardsEverfullPurse') {
      return purseSentence(purse.event.result);
    }
    const artifact = findChildEvent(miscMagicE1, 'treasureArtifactOrRelic');
    if (artifact && artifact.event.kind === 'treasureArtifactOrRelic') {
      return artifactSentence(artifact.event.result);
    }
    return treasureMiscMagicE1Sentence(miscMagicE1.event.result);
  }
  const miscMagicE2 = findChildEvent(magic, 'treasureMiscMagicE2');
  if (miscMagicE2 && miscMagicE2.event.kind === 'treasureMiscMagicE2') {
    const carpet = findChildEvent(miscMagicE2, 'treasureCarpetOfFlying');
    if (carpet && carpet.event.kind === 'treasureCarpetOfFlying') {
      return `There is a carpet of flying (${carpet.event.result}).`;
    }
    const cloak = findChildEvent(miscMagicE2, 'treasureCloakOfProtection');
    if (cloak && cloak.event.kind === 'treasureCloakOfProtection') {
      return cloakSentence(cloak.event.result);
    }
    return miscMagicE2Sentence(miscMagicE2.event.result);
  }
  return undefined;
}

export function collectTreasureCompactSummaries(
  node: OutcomeEventNode
): string[] {
  const summaries: string[] = [];
  const visited = new Set<OutcomeEventNode>();
  const visit = (current: OutcomeEventNode): void => {
    if (visited.has(current)) return;
    visited.add(current);
    if (current.event.kind === 'treasure') {
      const summary = summarizeTreasureCompact(current);
      if (summary.length > 0) summaries.push(summary);
    }
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };
  visit(node);
  return summaries;
}

type TreasureDescription = {
  label: string;
  detail: string;
  compact: string;
};

function describeTreasureEntry(entry: TreasureEntry): TreasureDescription {
  switch (entry.command) {
    case TreasureWithoutMonster.CopperPerLevel:
    case TreasureWithoutMonster.SilverPerLevel:
    case TreasureWithoutMonster.ElectrumPerLevel:
    case TreasureWithoutMonster.GoldPerLevel:
    case TreasureWithoutMonster.PlatinumPerLevel:
    case TreasureWithoutMonster.GemsPerLevel:
    case TreasureWithoutMonster.JewelryPerLevel:
      return quantifiedDescription(entry);
    case TreasureWithoutMonster.Magic:
      return rewardDescription('There is magical treasure.');
    default:
      return rewardDescription('Treasure.');
  }
}

function quantifiedDescription(entry: TreasureEntry): TreasureDescription {
  const trimmed = entry.display?.trim() ?? 'Treasure';
  const quantity = entry.quantity;
  const verb = quantity === 1 ? 'is' : 'are';
  const detail = quantity
    ? `There ${verb} ${trimmed} here.`
    : `There is ${trimmed}.`;
  return {
    label: trimmed,
    detail: detail.endsWith('.') ? detail : `${detail}.`,
    compact: detail.endsWith('.') ? detail : `${detail}.`,
  };
}

function rewardDescription(base: string): TreasureDescription {
  const normalized = base.endsWith('.') ? base : `${base}.`;
  return {
    label: normalized.replace(/\.$/, ''),
    detail: normalized,
    compact: normalized,
  };
}

function describeTreasureProtection(
  outcome: OutcomeEventNode
): string | undefined {
  const protectionType = findChildEvent(outcome, 'treasureProtectionType');
  if (
    !protectionType ||
    protectionType.event.kind !== 'treasureProtectionType'
  ) {
    return undefined;
  }
  const guard = findChildEvent(protectionType, 'treasureProtectionGuardedBy');
  if (guard && guard.event.kind === 'treasureProtectionGuardedBy') {
    const detail = describeTreasureProtectionGuardedBy(guard.event.result);
    if (detail) return `If desired, the treasure is guarded by ${detail}.`;
  }
  const hidden = findChildEvent(protectionType, 'treasureProtectionHiddenBy');
  if (hidden && hidden.event.kind === 'treasureProtectionHiddenBy') {
    const detail = describeTreasureProtectionHiddenBy(hidden.event.result);
    if (detail) return `If desired, the treasure is hidden ${detail}.`;
  }
  switch (protectionType.event.result) {
    case TreasureProtectionType.Guarded:
      return 'If desired, the treasure is guarded.';
    case TreasureProtectionType.Hidden:
      return 'If desired, the treasure is hidden.';
    default:
      return 'If desired, the treasure is protected.';
  }
}

function previewLabelForCommand(command: TreasureWithoutMonster): string {
  switch (command) {
    case TreasureWithoutMonster.CopperPerLevel:
      return '1,000 copper pieces per level';
    case TreasureWithoutMonster.SilverPerLevel:
      return '1,000 silver pieces per level';
    case TreasureWithoutMonster.ElectrumPerLevel:
      return '750 electrum pieces per level';
    case TreasureWithoutMonster.GoldPerLevel:
      return '250 gold pieces per level';
    case TreasureWithoutMonster.PlatinumPerLevel:
      return '100 platinum pieces per level';
    case TreasureWithoutMonster.GemsPerLevel:
      return '1-4 gems per level';
    case TreasureWithoutMonster.JewelryPerLevel:
      return '1 jewelry item per level';
    case TreasureWithoutMonster.Magic:
      return 'Magic (roll on Magic Items table)';
    default:
      return 'Treasure';
  }
}

function headingLabel(
  withMonster: boolean,
  rollIndex?: number,
  totalRolls?: number
): string {
  const base = withMonster ? 'Treasure (with monster)' : 'Treasure';
  if (totalRolls && totalRolls > 1 && rollIndex) {
    return `${base} — roll ${rollIndex} of ${totalRolls}`;
  }
  return base;
}

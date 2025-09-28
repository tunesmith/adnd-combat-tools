import type { DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureProtectionType,
  TreasureProtectionType,
  treasureProtectionGuardedBy,
  TreasureProtectionGuardedBy,
  treasureProtectionHiddenBy,
  TreasureProtectionHiddenBy,
} from '../../../tables/dungeon/treasureProtection';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

const GUARDED_BY_LABELS: Record<TreasureProtectionGuardedBy, string> = {
  [TreasureProtectionGuardedBy.ContactPoisonContainer]:
    'Contact poison on container',
  [TreasureProtectionGuardedBy.ContactPoisonTreasure]:
    'Contact poison on treasure',
  [TreasureProtectionGuardedBy.PoisonedNeedlesLock]: 'Poisoned needles in lock',
  [TreasureProtectionGuardedBy.PoisonedNeedlesHandles]:
    'Poisoned needles in handles',
  [TreasureProtectionGuardedBy.SpringDartsFront]:
    'Spring darts firing from front of container',
  [TreasureProtectionGuardedBy.SpringDartsTop]:
    'Spring darts firing up from top of container',
  [TreasureProtectionGuardedBy.SpringDartsBottom]:
    'Spring darts firing up from inside bottom of container',
  [TreasureProtectionGuardedBy.BladeAcrossInside]:
    'Blade scything across inside',
  [TreasureProtectionGuardedBy.PoisonousCreaturesInside]:
    'Poisonous insects or reptiles living inside container',
  [TreasureProtectionGuardedBy.GasReleased]:
    'Gas released by opening container',
  [TreasureProtectionGuardedBy.TrapdoorFront]:
    'Trapdoor opening in front of container',
  [TreasureProtectionGuardedBy.TrapdoorSixFeetFront]:
    'Trapdoor opening 6 feet in front of container',
  [TreasureProtectionGuardedBy.StoneBlockDrop]:
    'Stone block dropping in front of the container',
  [TreasureProtectionGuardedBy.SpearsFromWalls]:
    'Spears released from walls when container opened',
  [TreasureProtectionGuardedBy.ExplosiveRunes]: 'Explosive runes',
  [TreasureProtectionGuardedBy.Symbol]: 'Symbol spell',
};

const HIDDEN_BY_LABELS: Record<TreasureProtectionHiddenBy, string> = {
  [TreasureProtectionHiddenBy.Invisibility]: 'Invisibility',
  [TreasureProtectionHiddenBy.Illusion]: 'Illusion',
  [TreasureProtectionHiddenBy.SecretSpaceUnderContainer]:
    'Secret space under container',
  [TreasureProtectionHiddenBy.SecretCompartment]:
    'Secret compartment in container',
  [TreasureProtectionHiddenBy.InsidePlainViewItem]:
    'Inside ordinary item in plain view',
  [TreasureProtectionHiddenBy.Disguised]:
    'Disguised to appear as something else',
  [TreasureProtectionHiddenBy.UnderHeap]: 'Under a heap of trash/dung',
  [TreasureProtectionHiddenBy.UnderLooseStoneFloor]:
    'Under a loose stone in the floor',
  [TreasureProtectionHiddenBy.BehindLooseStoneWall]:
    'Behind a loose stone in the wall',
  [TreasureProtectionHiddenBy.SecretRoomNearby]: 'In a secret room nearby',
};

export function renderTreasureProtectionTypeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureProtectionType') return [];
  const label = TreasureProtectionType[outcome.event.result];
  const nodes: DungeonRenderNode[] = [
    {
      kind: 'heading',
      level: 4,
      text: 'Treasure Protection',
    },
    {
      kind: 'bullet-list',
      items: [`roll: ${outcome.roll} — ${label}`],
    },
  ];
  nodes.push({ kind: 'paragraph', text: baseProtectionText(outcome) });
  const childSummary = describeProtectionChild(outcome);
  if (childSummary) {
    nodes.push({ kind: 'paragraph', text: childSummary });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureProtectionTypeCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureProtectionType') return [];
  const nodes: DungeonRenderNode[] = [
    {
      kind: 'heading',
      level: 4,
      text: 'Treasure Protection',
    },
    { kind: 'paragraph', text: baseProtectionText(outcome) },
  ];
  const childSummary = describeProtectionChild(outcome);
  if (childSummary) {
    nodes.push({ kind: 'paragraph', text: childSummary });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

function baseProtectionText(node: OutcomeEventNode): string {
  if (node.event.kind !== 'treasureProtectionType') return '';
  switch (node.event.result) {
    case TreasureProtectionType.Guarded:
      return 'If desired, the treasure is guarded.';
    case TreasureProtectionType.Hidden:
      return 'If desired, the treasure is hidden.';
    default:
      return 'If desired, the treasure is protected.';
  }
}

function describeProtectionChild(node: OutcomeEventNode): string | undefined {
  const guard = findChildEvent(node, 'treasureProtectionGuardedBy');
  if (guard && guard.event.kind === 'treasureProtectionGuardedBy') {
    const detail = describeTreasureProtectionGuardedBy(guard.event.result);
    return detail
      ? `If desired, the treasure is guarded by ${detail}.`
      : undefined;
  }
  const hidden = findChildEvent(node, 'treasureProtectionHiddenBy');
  if (hidden && hidden.event.kind === 'treasureProtectionHiddenBy') {
    const detail = describeTreasureProtectionHiddenBy(hidden.event.result);
    return detail ? `If desired, the treasure is hidden ${detail}.` : undefined;
  }
  return undefined;
}

export function describeTreasureProtectionGuardedBy(
  result: TreasureProtectionGuardedBy
): string {
  switch (result) {
    case TreasureProtectionGuardedBy.ContactPoisonContainer:
      return 'contact poison on the container';
    case TreasureProtectionGuardedBy.ContactPoisonTreasure:
      return 'contact poison on the treasure';
    case TreasureProtectionGuardedBy.PoisonedNeedlesLock:
      return 'poisoned needles in the lock';
    case TreasureProtectionGuardedBy.PoisonedNeedlesHandles:
      return 'poisoned needles in the handles';
    case TreasureProtectionGuardedBy.SpringDartsFront:
      return 'spring darts firing from the front of the container';
    case TreasureProtectionGuardedBy.SpringDartsTop:
      return 'spring darts firing up from the top of the container';
    case TreasureProtectionGuardedBy.SpringDartsBottom:
      return 'spring darts firing up from inside the bottom of the container';
    case TreasureProtectionGuardedBy.BladeAcrossInside:
      return 'a blade scything across the inside';
    case TreasureProtectionGuardedBy.PoisonousCreaturesInside:
      return 'poisonous insects or reptiles living inside the container';
    case TreasureProtectionGuardedBy.GasReleased:
      return 'gas released by opening the container';
    case TreasureProtectionGuardedBy.TrapdoorFront:
      return 'a trapdoor opening in front of the container';
    case TreasureProtectionGuardedBy.TrapdoorSixFeetFront:
      return 'a trapdoor opening six feet in front of the container';
    case TreasureProtectionGuardedBy.StoneBlockDrop:
      return 'a stone block dropping in front of the container';
    case TreasureProtectionGuardedBy.SpearsFromWalls:
      return 'spears released from the walls when the container is opened';
    case TreasureProtectionGuardedBy.ExplosiveRunes:
      return 'explosive runes';
    case TreasureProtectionGuardedBy.Symbol:
      return 'a Symbol spell';
    default:
      return '';
  }
}

export function describeTreasureProtectionHiddenBy(
  result: TreasureProtectionHiddenBy
): string {
  switch (result) {
    case TreasureProtectionHiddenBy.Invisibility:
      return 'by invisibility';
    case TreasureProtectionHiddenBy.Illusion:
      return 'by an illusion';
    case TreasureProtectionHiddenBy.SecretSpaceUnderContainer:
      return 'in a secret space under the container';
    case TreasureProtectionHiddenBy.SecretCompartment:
      return 'in a secret compartment in the container';
    case TreasureProtectionHiddenBy.InsidePlainViewItem:
      return 'inside an ordinary item in plain view';
    case TreasureProtectionHiddenBy.Disguised:
      return 'by being disguised to appear as something else';
    case TreasureProtectionHiddenBy.UnderHeap:
      return 'under a heap of trash or dung';
    case TreasureProtectionHiddenBy.UnderLooseStoneFloor:
      return 'under a loose stone in the floor';
    case TreasureProtectionHiddenBy.BehindLooseStoneWall:
      return 'behind a loose stone in the wall';
    case TreasureProtectionHiddenBy.SecretRoomNearby:
      return 'in a secret room nearby';
    default:
      return '';
  }
}

export function renderTreasureProtectionGuardedByDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureProtectionGuardedBy') return [];
  const text = describeTreasureProtectionGuardedBy(outcome.event.result);
  const label = GUARDED_BY_LABELS[outcome.event.result];
  return [
    {
      kind: 'bullet-list',
      items: [`roll: ${outcome.roll} — ${label}`],
    },
    {
      kind: 'paragraph',
      text: text.charAt(0).toUpperCase() + text.slice(1) + '.',
    },
  ];
}

export function renderTreasureProtectionHiddenByDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureProtectionHiddenBy') return [];
  const text = describeTreasureProtectionHiddenBy(outcome.event.result);
  const label = HIDDEN_BY_LABELS[outcome.event.result];
  return [
    {
      kind: 'bullet-list',
      items: [`roll: ${outcome.roll} — ${label}`],
    },
    { kind: 'paragraph', text: `Hidden ${text}.` },
  ];
}

export const buildTreasureProtectionTypePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Treasure Protection',
    sides: treasureProtectionType.sides,
    entries: treasureProtectionType.entries.map((entry) => ({
      range: entry.range,
      label: TreasureProtectionType[entry.command] ?? String(entry.command),
    })),
  });

export const buildTreasureProtectionGuardedByPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Treasure Guarded By',
    sides: treasureProtectionGuardedBy.sides,
    entries: treasureProtectionGuardedBy.entries.map((entry) => ({
      range: entry.range,
      label: GUARDED_BY_LABELS[entry.command],
    })),
  });

export const buildTreasureProtectionHiddenByPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Treasure Hidden By/In',
    sides: treasureProtectionHiddenBy.sides,
    entries: treasureProtectionHiddenBy.entries.map((entry) => ({
      range: entry.range,
      label: HIDDEN_BY_LABELS[entry.command],
    })),
  });

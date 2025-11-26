import type { DungeonMessage, DungeonRenderNode } from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  treasureRodsStavesWands,
  TreasureRodStaffWand,
  treasureStaffSerpent,
  TreasureStaffSerpent,
} from './rodStaffWandTables';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

const ROD_STAFF_WAND_LABELS: Record<TreasureRodStaffWand, string> = {
  [TreasureRodStaffWand.RodAbsorption]: 'Rod of Absorption',
  [TreasureRodStaffWand.RodBeguilling]: 'Rod of Beguiling',
  [TreasureRodStaffWand.RodCancellation]: 'Rod of Cancellation',
  [TreasureRodStaffWand.RodLordlyMight]: 'Rod of Lordly Might',
  [TreasureRodStaffWand.RodResurrection]: 'Rod of Resurrection',
  [TreasureRodStaffWand.RodRulership]: 'Rod of Rulership',
  [TreasureRodStaffWand.RodSmiting]: 'Rod of Smiting',
  [TreasureRodStaffWand.StaffCommand]: 'Staff of Command',
  [TreasureRodStaffWand.StaffCuring]: 'Staff of Curing',
  [TreasureRodStaffWand.StaffMagi]: 'Staff of the Magi',
  [TreasureRodStaffWand.StaffPower]: 'Staff of Power',
  [TreasureRodStaffWand.StaffSerpent]: 'Staff of the Serpent',
  [TreasureRodStaffWand.StaffStriking]: 'Staff of Striking',
  [TreasureRodStaffWand.StaffWithering]: 'Staff of Withering',
  [TreasureRodStaffWand.WandConjuration]: 'Wand of Conjuration',
  [TreasureRodStaffWand.WandEnemyDetection]: 'Wand of Enemy Detection',
  [TreasureRodStaffWand.WandFear]: 'Wand of Fear',
  [TreasureRodStaffWand.WandFire]: 'Wand of Fire',
  [TreasureRodStaffWand.WandFrost]: 'Wand of Frost',
  [TreasureRodStaffWand.WandIllumination]: 'Wand of Illumination',
  [TreasureRodStaffWand.WandIllusion]: 'Wand of Illusion',
  [TreasureRodStaffWand.WandLightning]: 'Wand of Lightning',
  [TreasureRodStaffWand.WandMagicDetection]: 'Wand of Magic Detection',
  [TreasureRodStaffWand.WandMetalMineralDetection]:
    'Wand of Metal & Mineral Detection',
  [TreasureRodStaffWand.WandMagicMissiles]: 'Wand of Magic Missiles',
  [TreasureRodStaffWand.WandNegation]: 'Wand of Negation',
  [TreasureRodStaffWand.WandParalyzation]: 'Wand of Paralyzation',
  [TreasureRodStaffWand.WandPolymorphing]: 'Wand of Polymorphing',
  [TreasureRodStaffWand.WandSecretDoorTrap]:
    'Wand of Secret Door & Trap Location',
  [TreasureRodStaffWand.WandWonder]: 'Wand of Wonder',
};

const SERPENT_LABELS: Record<TreasureStaffSerpent, string> = {
  [TreasureStaffSerpent.Python]: 'Python',
  [TreasureStaffSerpent.Adder]: 'Adder',
};

export function renderTreasureRodStaffWandDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRodStaffWand') return [];
  const heading: DungeonMessage = { kind: 'heading', level: 4, text: 'Rod, Staff, or Wand' };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${resolveRodStaffWandLabel(outcome)}`],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: `There is a ${resolveRodStaffWandLabel(outcome)}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRodStaffWandCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRodStaffWand') return [];
  const heading: DungeonMessage = { kind: 'heading', level: 4, text: 'Rod, Staff, or Wand' };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: `There is a ${resolveRodStaffWandLabel(outcome)}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureStaffSerpentDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureStaffSerpent') return [];
  const heading: DungeonMessage = { kind: 'heading', level: 4, text: 'Serpent Form' };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${SERPENT_LABELS[outcome.event.result]}`],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: `The staff transforms into the ${SERPENT_LABELS[outcome.event.result]} form.`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureStaffSerpentCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureStaffSerpent') return [];
  const heading: DungeonMessage = { kind: 'heading', level: 4, text: 'Serpent Form' };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: `The staff transforms into the ${SERPENT_LABELS[outcome.event.result]} form.`,
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureRodStaffWandPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Rod, Staff, or Wand',
    sides: treasureRodsStavesWands.sides,
    entries: treasureRodsStavesWands.entries.map((entry) => ({
      range: entry.range,
      label: ROD_STAFF_WAND_LABELS[entry.command],
    })),
  });

export const buildTreasureStaffSerpentPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Serpent Form',
    sides: treasureStaffSerpent.sides,
    entries: treasureStaffSerpent.entries.map((entry) => ({
      range: entry.range,
      label: SERPENT_LABELS[entry.command],
    })),
  });

export function resolveRodStaffWandLabel(node: OutcomeEventNode): string {
  if (node.event.kind !== 'treasureRodStaffWand') return '';
  const base = ROD_STAFF_WAND_LABELS[node.event.result];
  if (node.event.result !== TreasureRodStaffWand.StaffSerpent) return base;
  const variant = findChildEvent(node, 'treasureStaffSerpent');
  if (variant && variant.event.kind === 'treasureStaffSerpent') {
    return `${base} "${SERPENT_LABELS[variant.event.result]}"`;
  }
  return base;
}

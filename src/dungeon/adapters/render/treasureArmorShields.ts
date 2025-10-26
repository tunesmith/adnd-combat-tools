import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureArmorShields,
  TreasureArmorShield,
} from '../../../tables/dungeon/treasureArmorShields';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const ARMOR_SHIELD_LABELS: Record<TreasureArmorShield, string> = {
  [TreasureArmorShield.ChainMailPlus1]: 'Chain mail +1',
  [TreasureArmorShield.ChainMailPlus2]: 'Chain mail +2',
  [TreasureArmorShield.ChainMailPlus3]: 'Chain mail +3',
  [TreasureArmorShield.LeatherArmorPlus1]: 'Leather armor +1',
  [TreasureArmorShield.PlateMailPlus1]: 'Plate mail +1',
  [TreasureArmorShield.PlateMailPlus2]: 'Plate mail +2',
  [TreasureArmorShield.PlateMailPlus3]: 'Plate mail +3',
  [TreasureArmorShield.PlateMailPlus4]: 'Plate mail +4',
  [TreasureArmorShield.PlateMailPlus5]: 'Plate mail +5',
  [TreasureArmorShield.PlateMailOfEtherealness]: 'Plate mail of Etherealness',
  [TreasureArmorShield.PlateMailOfVulnerability]: 'Plate mail of Vulnerability',
  [TreasureArmorShield.RingMailPlus1]: 'Ring mail +1',
  [TreasureArmorShield.ScaleMailPlus1]: 'Scale mail +1',
  [TreasureArmorShield.ScaleMailPlus2]: 'Scale mail +2',
  [TreasureArmorShield.SplintMailPlus1]: 'Splint mail +1',
  [TreasureArmorShield.SplintMailPlus2]: 'Splint mail +2',
  [TreasureArmorShield.SplintMailPlus3]: 'Splint mail +3',
  [TreasureArmorShield.SplintMailPlus4]: 'Splint mail +4',
  [TreasureArmorShield.StuddedLeatherPlus1]: 'Studded Leather +1',
  [TreasureArmorShield.ShieldPlus1]: 'Shield +1',
  [TreasureArmorShield.ShieldPlus2]: 'Shield +2',
  [TreasureArmorShield.ShieldPlus3]: 'Shield +3',
  [TreasureArmorShield.ShieldPlus4]: 'Shield +4',
  [TreasureArmorShield.ShieldPlus5]: 'Shield +5',
  [TreasureArmorShield.ShieldLargePlus1Plus4VsMissiles]:
    'Shield, large, +1, +4 vs. missiles',
  [TreasureArmorShield.ShieldMinus1MissileAttractor]:
    'Shield -1, missile attractor',
};

export function armorShieldSentence(result: TreasureArmorShield): string {
  return `There is ${ARMOR_SHIELD_LABELS[result]}.`;
}

export function armorShieldLabel(result: TreasureArmorShield): string {
  return ARMOR_SHIELD_LABELS[result];
}

export function renderTreasureArmorShieldsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureArmorShields') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Armor & Shields (Table F)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${armorShieldLabel(outcome.event.result)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: armorShieldSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureArmorShieldsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureArmorShields') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Armor & Shields',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: armorShieldSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureArmorShieldsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Armor & Shields (Table F)',
    sides: treasureArmorShields.sides,
    entries: treasureArmorShields.entries.map(({ range, command }) => ({
      range,
      label: armorShieldLabel(command),
    })),
  });

import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type {
  OutcomeEventNode,
  TreasureMiscWeaponResult,
} from '../../../domain/outcome';
import { treasureMiscWeapons, TreasureMiscWeapon } from './miscWeaponsTable';
import { buildPreview } from '../../../adapters/render/shared';
import type {
  AppendPreviewFn,
  TablePreviewFactory,
} from '../../../adapters/render/shared';

const ITEM_LABELS: Record<TreasureMiscWeapon, string> = {
  [TreasureMiscWeapon.ArrowPlus1]: 'Arrows +1',
  [TreasureMiscWeapon.ArrowPlus2]: 'Arrows +2',
  [TreasureMiscWeapon.ArrowPlus3]: 'Arrows +3',
  [TreasureMiscWeapon.ArrowOfSlaying]:
    'Arrow of Slaying (choose creature type)',
  [TreasureMiscWeapon.AxePlus1]: 'Axe +1',
  [TreasureMiscWeapon.AxePlus2]: 'Axe +2',
  [TreasureMiscWeapon.AxePlus2Throwing]: 'Axe +2 (throwing)',
  [TreasureMiscWeapon.AxePlus3]: 'Axe +3',
  [TreasureMiscWeapon.BattleAxePlus1]: 'Battle axe +1',
  [TreasureMiscWeapon.BoltPlus2]: 'Bolts +2',
  [TreasureMiscWeapon.BowPlus1]: 'Bow +1',
  [TreasureMiscWeapon.CrossbowOfAccuracyPlus3]: 'Crossbow of Accuracy +3',
  [TreasureMiscWeapon.CrossbowOfDistance]: 'Crossbow of Distance',
  [TreasureMiscWeapon.CrossbowOfSpeed]: 'Crossbow of Speed',
  [TreasureMiscWeapon.DaggerPlus1VsSmall]:
    'Dagger +1 (+2 vs. creatures smaller than man-sized)',
  [TreasureMiscWeapon.DaggerPlus2VsLarge]:
    'Dagger +2 (+3 vs. creatures larger than man-sized)',
  [TreasureMiscWeapon.DaggerOfVenom]: 'Dagger of Venom',
  [TreasureMiscWeapon.FlailPlus1]: 'Flail +1',
  [TreasureMiscWeapon.HammerPlus1]: 'Hammer +1',
  [TreasureMiscWeapon.HammerPlus2]: 'Hammer +2',
  [TreasureMiscWeapon.HammerPlus3DwarvenThrower]: 'Hammer +3 (Dwarven Thrower)',
  [TreasureMiscWeapon.HammerOfThunderbolts]: 'Hammer of Thunderbolts',
  [TreasureMiscWeapon.JavelinPlus2]: 'Javelin +2',
  [TreasureMiscWeapon.MacePlus1]: 'Mace +1',
  [TreasureMiscWeapon.MacePlus2]: 'Mace +2',
  [TreasureMiscWeapon.MaceOfDisruption]: 'Mace of Disruption',
  [TreasureMiscWeapon.MacePlus4]: 'Mace +4',
  [TreasureMiscWeapon.MilitaryPickPlus1]: 'Military pick +1',
  [TreasureMiscWeapon.MorningStarPlus1]: 'Morning star +1',
  [TreasureMiscWeapon.ScimitarPlus2]: 'Scimitar +2',
  [TreasureMiscWeapon.SlingOfSeekingPlus2]: 'Sling of Seeking +2',
  [TreasureMiscWeapon.SpearPlus1]: 'Spear +1',
  [TreasureMiscWeapon.SpearPlus2]: 'Spear +2',
  [TreasureMiscWeapon.SpearPlus3]: 'Spear +3',
  [TreasureMiscWeapon.SpearCursedBackbiter]: 'Spear, Cursed Backbiter',
  [TreasureMiscWeapon.TridentPlus3]: 'Trident (Military Fork) +3',
};

function miscWeaponLabel(item: TreasureMiscWeapon): string {
  return ITEM_LABELS[item];
}

function articleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

export function miscWeaponSentence(result: TreasureMiscWeaponResult): string {
  switch (result.item) {
    case TreasureMiscWeapon.ArrowPlus1:
    case TreasureMiscWeapon.ArrowPlus2:
    case TreasureMiscWeapon.ArrowPlus3: {
      const quantity = result.quantity ?? 0;
      const bonus =
        result.item === TreasureMiscWeapon.ArrowPlus1
          ? '+1'
          : result.item === TreasureMiscWeapon.ArrowPlus2
          ? '+2'
          : '+3';
      return `There are ${quantity} arrows ${bonus}.`;
    }
    case TreasureMiscWeapon.BoltPlus2: {
      const quantity = result.quantity ?? 0;
      return `There are ${quantity} bolts +2.`;
    }
    default: {
      const label = miscWeaponLabel(result.item);
      const article = articleFor(label);
      return `There is ${article} ${label}.`;
    }
  }
}

export function renderTreasureMiscWeaponsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscWeapons') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Weapons (Table H)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${miscWeaponLabel(outcome.event.result.item)}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: miscWeaponSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMiscWeaponsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscWeapons') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Weapons',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: miscWeaponSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMiscWeaponsPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Weapons (Table H)',
    sides: treasureMiscWeapons.sides,
    entries: treasureMiscWeapons.entries.map(({ range, command }) => ({
      range,
      label: miscWeaponLabel(command),
    })),
    context,
  });

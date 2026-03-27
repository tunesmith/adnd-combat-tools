import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../domain/outcome';
import {
  TreasureSword,
  type TreasureSwordExtraordinaryPowerResult,
  type TreasureSwordSpecialPurposeResult,
  type TreasureSwordUnusualResult,
} from './swordsTables';

function hasPendingRoll(node: DungeonOutcomeNode): boolean {
  if (node.type === 'pending-roll') return true;
  return (node.children || []).some((child) => hasPendingRoll(child));
}

function findSwordUnusualResult(
  node: OutcomeEventNode
): TreasureSwordUnusualResult | undefined {
  if (node.event.kind === 'treasureSwordUnusual') {
    return node.event.result;
  }
  for (const child of node.children || []) {
    if (child.type !== 'event') continue;
    const result = findSwordUnusualResult(child);
    if (result) return result;
  }
  return undefined;
}

function collectPrimaryAbilities(node: OutcomeEventNode): number {
  let total = 0;
  if (node.event.kind === 'treasureSwordPrimaryAbility') {
    const result = node.event.result;
    if (result.kind === 'ability') {
      total += result.multiplier ?? result.rolls.length ?? 1;
    }
  }
  for (const child of node.children || []) {
    if (child.type === 'event') {
      total += collectPrimaryAbilities(child);
    }
  }
  return total;
}

function collectExtraordinaryPowers(node: OutcomeEventNode): number {
  let total = 0;
  if (node.event.kind === 'treasureSwordExtraordinaryPower') {
    const result: TreasureSwordExtraordinaryPowerResult = node.event.result;
    if (result.kind === 'power') {
      total += (result.multiplier ?? result.rolls.length ?? 1) * 2;
    }
  }
  for (const child of node.children || []) {
    if (child.type === 'event') {
      total += collectExtraordinaryPowers(child);
    }
  }
  return total;
}

function collectSpecialPurposes(node: OutcomeEventNode): number {
  let total = 0;
  if (node.event.kind === 'treasureSwordSpecialPurpose') {
    const result: TreasureSwordSpecialPurposeResult = node.event.result;
    if (result.kind === 'purpose') {
      total += 5;
    }
  }
  for (const child of node.children || []) {
    if (child.type === 'event') {
      total += collectSpecialPurposes(child);
    }
  }
  return total;
}

function spokenLanguageEgo(
  unusual: TreasureSwordUnusualResult | undefined
): number | undefined {
  if (!unusual) return undefined;
  switch (unusual.communication) {
    case 'speech':
    case 'speech and telepathy': {
      if (unusual.languagesKnown === undefined) {
        return undefined;
      }
      return Math.ceil((1 + unusual.languagesKnown) / 2);
    }
    default:
      return 0;
  }
}

function readingEgo(unusual: TreasureSwordUnusualResult | undefined): number {
  if (!unusual) return 0;
  switch (unusual.languageCapability) {
    case 'mundane':
      return 1;
    case 'magical':
      return 3;
    default:
      return 0;
  }
}

function telepathyEgo(unusual: TreasureSwordUnusualResult | undefined): number {
  return unusual?.communication === 'speech and telepathy' ? 2 : 0;
}

function swordBaseEgo(sword: TreasureSword): number {
  // DMG Table 7 counts the sword's listed pluses for ego. For swords with
  // powers but no separate situational pluses, the DMG note doubles the
  // weapon's rating instead.
  switch (sword) {
    case TreasureSword.SwordPlus1:
      return 1;
    case TreasureSword.SwordPlus1Plus2VsMagicUsers:
      return 3;
    case TreasureSword.SwordPlus1Plus3VsLycanthropes:
      return 4;
    case TreasureSword.SwordPlus1Plus3VsRegenerating:
      return 4;
    case TreasureSword.SwordPlus1Plus4VsReptiles:
      return 5;
    case TreasureSword.SwordPlus1FlameTongue:
      return 5;
    case TreasureSword.SwordPlus1LuckBlade:
      return 2;
    case TreasureSword.SwordPlus2:
      return 2;
    case TreasureSword.SwordPlus2GiantSlayer:
      return 5;
    case TreasureSword.SwordPlus2DragonSlayer:
      return 6;
    case TreasureSword.SwordPlus2NineLivesStealer:
      return 4;
    case TreasureSword.SwordPlus3:
      return 3;
    case TreasureSword.SwordPlus3FrostBrand:
      return 9;
    case TreasureSword.SwordPlus4:
      return 4;
    case TreasureSword.SwordPlus4Defender:
      return 8;
    case TreasureSword.SwordPlus5:
      return 5;
    case TreasureSword.SwordPlus5Defender:
      return 10;
    case TreasureSword.SwordPlus5HolyAvenger:
      return 10;
    case TreasureSword.SwordOfDancing:
      return 5;
    case TreasureSword.SwordOfWounding:
      return 2;
    case TreasureSword.SwordOfLifeStealing:
      return 4;
    case TreasureSword.SwordOfSharpness:
      return 6;
    case TreasureSword.SwordVorpalWeapon:
      return 6;
    case TreasureSword.SwordPlus1Cursed:
      return 1;
    case TreasureSword.SwordMinus2Cursed:
      return 0;
    case TreasureSword.SwordCursedBerserking:
      return 2;
    default:
      return 0;
  }
}

export function computeSwordEgo(node: OutcomeEventNode): number | undefined {
  if (node.event.kind !== 'treasureSwords') return undefined;
  if (hasPendingRoll(node)) return undefined;

  const unusual = findSwordUnusualResult(node);
  if (!unusual) return undefined;

  const languageEgo = spokenLanguageEgo(unusual);
  if (languageEgo === undefined) return undefined;

  return (
    swordBaseEgo(node.event.result) +
    collectPrimaryAbilities(node) +
    collectExtraordinaryPowers(node) +
    collectSpecialPurposes(node) +
    languageEgo +
    telepathyEgo(unusual) +
    readingEgo(unusual)
  );
}

import type {
  DungeonMessage,
  DungeonRenderNode,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { Table } from '../../../../tables/dungeon/dungeonTypes';
import {
  treasureSwords,
  TreasureSword,
  treasureSwordKind,
  TreasureSwordKind,
  treasureSwordUnusual,
  TreasureSwordPrimaryAbility,
  SWORD_UNUSUAL_DETAILS,
  treasureSwordPrimaryAbility,
  treasureSwordPrimaryAbilityRestricted,
  TreasureSwordPrimaryAbilityCommand,
  describeSwordPrimaryAbility,
  treasureSwordExtraordinaryPower,
  treasureSwordExtraordinaryPowerRestricted,
  treasureSwordSpecialPurpose,
  treasureSwordSpecialPurposePower,
  TreasureSwordExtraordinaryPower,
  TreasureSwordExtraordinaryPowerCommand,
  describeSwordExtraordinaryPower,
  describeSwordSpecialPurpose,
  describeSwordSpecialPurposePower,
  describeDragonSlayerColor,
  DRAGON_SLAYER_COLOR_DETAILS,
  dragonSlayerColorTableForAlignment,
  type TreasureSwordUnusualResult,
  type TreasureSwordPrimaryAbilityResult,
  type TreasureSwordExtraordinaryPowerResult,
  type TreasureSwordSpecialPurposeResult,
  type TreasureSwordSpecialPurposePowerResult,
} from './swordsTables';
import type {
  TreasureSwordSpecialPurpose,
  TreasureSwordSpecialPurposeCommand,
  TreasureSwordSpecialPurposePower,
  TreasureSwordSpecialPurposePowerCommand,
} from './swordsTables';
import {
  treasureSwordAlignment,
  treasureSwordAlignmentChaotic,
  treasureSwordAlignmentLawful,
  SWORD_ALIGNMENT_DETAILS,
} from './swordsAlignmentTable';
import type {
  TreasureSwordAlignment,
  TreasureSwordAlignmentResult,
} from './swordsAlignmentTable';
import { buildPreview, findChildEvent } from '../../../adapters/render/shared';
import type {
  AppendPreviewFn,
  TablePreviewFactory,
} from '../../../adapters/render/shared';

const SWORD_LABELS: Record<TreasureSword, string> = {
  [TreasureSword.SwordPlus1]: 'Sword +1',
  [TreasureSword.SwordPlus1Plus2VsMagicUsers]:
    'Sword +1, +2 vs. magic-using & enchanted creatures',
  [TreasureSword.SwordPlus1Plus3VsLycanthropes]:
    'Sword +1, +3 vs. lycanthropes & shape changers',
  [TreasureSword.SwordPlus1Plus3VsRegenerating]:
    'Sword +1, +3 vs. regenerating creatures',
  [TreasureSword.SwordPlus1Plus4VsReptiles]: 'Sword +1, +4 vs. reptiles',
  [TreasureSword.SwordPlus1FlameTongue]:
    'Sword +1, Flame Tongue: +2 vs. regenerating creatures; +3 vs. cold-using, inflammable, or avian creatures; +4 vs. undead',
  [TreasureSword.SwordPlus1LuckBlade]: 'Sword +1, Luck Blade',
  [TreasureSword.SwordPlus2]: 'Sword +2',
  [TreasureSword.SwordPlus2GiantSlayer]: 'Sword +2, Giant Slayer',
  [TreasureSword.SwordPlus2DragonSlayer]: 'Sword +2, Dragon Slayer',
  [TreasureSword.SwordPlus2NineLivesStealer]: 'Sword +2, Nine Lives Stealer',
  [TreasureSword.SwordPlus3]: 'Sword +3',
  [TreasureSword.SwordPlus3FrostBrand]:
    'Sword +3, Frost Brand: +6 vs. fire using/dwelling creatures',
  [TreasureSword.SwordPlus4]: 'Sword +4',
  [TreasureSword.SwordPlus4Defender]: 'Sword +4, Defender',
  [TreasureSword.SwordPlus5]: 'Sword +5',
  [TreasureSword.SwordPlus5Defender]: 'Sword +5, Defender',
  [TreasureSword.SwordPlus5HolyAvenger]: 'Sword +5, Holy Avenger',
  [TreasureSword.SwordOfDancing]: 'Sword of Dancing',
  [TreasureSword.SwordOfWounding]: 'Sword of Wounding',
  [TreasureSword.SwordOfLifeStealing]: 'Sword of Life Stealing',
  [TreasureSword.SwordOfSharpness]: 'Sword of Sharpness',
  [TreasureSword.SwordVorpalWeapon]: 'Sword, Vorpal Weapon',
  [TreasureSword.SwordPlus1Cursed]: 'Sword +1, Cursed',
  [TreasureSword.SwordMinus2Cursed]: 'Sword -2, Cursed',
  [TreasureSword.SwordCursedBerserking]: 'Sword, Cursed Berserking',
};

const SWORD_KIND_LABELS: Record<TreasureSwordKind, string> = {
  [TreasureSwordKind.Longsword]: 'Longsword',
  [TreasureSwordKind.Broadsword]: 'Broadsword',
  [TreasureSwordKind.ShortSword]: 'Short Sword',
  [TreasureSwordKind.BastardSword]: 'Bastard Sword',
  [TreasureSwordKind.TwoHandedSword]: 'Two-Handed Sword',
};

function applySwordKindLabel(base: string, kind?: TreasureSwordKind): string {
  if (kind === undefined) return base;
  const kindLabel = SWORD_KIND_LABELS[kind];
  return base.replace(/^Sword\b/, kindLabel);
}

function articleFor(label: string): 'a' | 'an' {
  const trimmed = label.trim();
  if (!trimmed) return 'a';
  const first = trimmed.charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

function buildSwordParenthetical(
  intelligenceLabel?: string,
  luckBladeWishes?: number
): string | undefined {
  const parts: string[] = [];
  if (intelligenceLabel && intelligenceLabel.trim().length > 0) {
    parts.push(intelligenceLabel.trim());
  }
  if (luckBladeWishes !== undefined) {
    const wishLabel = luckBladeWishes === 1 ? 'wish' : 'wishes';
    parts.push(`${luckBladeWishes} ${wishLabel}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function decorateSwordLabel(
  base: string,
  colorLabel?: string,
  parenthetical?: string
): string {
  const withColor = colorLabel ? `${base} [${colorLabel}]` : base;
  return parenthetical && parenthetical.length > 0
    ? `${withColor} (${parenthetical})`
    : withColor;
}

function swordLabel(
  sword: TreasureSword,
  kind?: TreasureSwordKind
): string {
  const base = SWORD_LABELS[sword];
  return applySwordKindLabel(base, kind);
}

export function swordSentence(
  sword: TreasureSword,
  kind?: TreasureSwordKind,
  alignment?: TreasureSwordAlignmentResult,
  intelligenceLabel?: string,
  abilitySummaries: PrimaryAbilitySummary[] = [],
  luckBladeWishes?: number,
  dragonSlayerColorLabel?: string
): string {
  const baseLabel = swordLabel(sword, kind);
  const parenthetical = buildSwordParenthetical(
    intelligenceLabel,
    luckBladeWishes
  );
  const decoratedLabel = decorateSwordLabel(
    baseLabel,
    dragonSlayerColorLabel,
    parenthetical
  );
  const article = articleFor(decoratedLabel);
  const sentences: string[] = [`There is ${article} ${decoratedLabel}.`];
  if (alignment) {
    sentences.push(alignmentStatement(alignment));
  }
  if (abilitySummaries.length > 0) {
    for (const summary of abilitySummaries) {
      if (summary.extraordinaryPower !== undefined) {
        const compact = summary.compactDescription;
        if (
          summary.extraordinaryPower ===
            TreasureSwordExtraordinaryPower.ChooseAny ||
          summary.extraordinaryPower ===
            TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose
        ) {
          sentences.push(`The character can ${compact}.`);
        } else {
          sentences.push(`The sword has ${compact}.`);
        }
        if (summary.compactExtras && summary.compactExtras.length > 0) {
          sentences.push(...summary.compactExtras);
        }
      } else {
        sentences.push(`The sword can ${summary.description}.`);
      }
    }
  }
  return sentences.join(' ');
}

export function renderTreasureSwordsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwords') return [];
  const kindEvent = findChildEvent(outcome, 'treasureSwordKind');
  const kind =
    kindEvent && kindEvent.event.kind === 'treasureSwordKind'
      ? kindEvent.event.result
      : undefined;
  const unusualEvent = findChildEvent(outcome, 'treasureSwordUnusual');
  const intelligenceLabel =
    unusualEvent && unusualEvent.event.kind === 'treasureSwordUnusual'
      ? formatSwordIntelligence(unusualEvent.event.result)
      : undefined;
  const luckBladeWishes = outcome.event.luckBladeWishes;
  const dragonColorEvent = findDragonSlayerColorEvent(outcome);
  const dragonSlayerColorLabel =
    dragonColorEvent &&
    dragonColorEvent.event.kind === 'treasureSwordDragonSlayerColor'
      ? dragonColorEvent.event.result.label
      : undefined;
  const parenthetical = buildSwordParenthetical(
    intelligenceLabel,
    luckBladeWishes
  );
  const decoratedSwordLabel = decorateSwordLabel(
    swordLabel(outcome.event.result, kind),
    dragonSlayerColorLabel,
    parenthetical
  );
  const abilitySummaries =
    unusualEvent && unusualEvent.event.kind === 'treasureSwordUnusual'
      ? summarizePrimaryAbilities(unusualEvent)
      : summarizePrimaryAbilities(outcome);
  const alignmentEvent = findSwordAlignmentEvent(outcome);
  const alignmentResult =
    alignmentEvent && alignmentEvent.event.kind === 'treasureSwordAlignment'
      ? alignmentEvent.event.result
      : undefined;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Swords (Table G)',
  };
  const bulletItems = [`roll: ${outcome.roll} — ${decoratedSwordLabel}`];
  if (alignmentResult) {
    bulletItems.push(`alignment: ${alignmentResult.label}`);
  }
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: bulletItems,
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: swordSentence(
      outcome.event.result,
      kind,
      alignmentResult,
      intelligenceLabel,
      abilitySummaries,
      luckBladeWishes,
      dragonSlayerColorLabel
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwords') return [];
  const kindEvent = findChildEvent(outcome, 'treasureSwordKind');
  const kind =
    kindEvent && kindEvent.event.kind === 'treasureSwordKind'
      ? kindEvent.event.result
      : undefined;
  const alignmentEvent = findSwordAlignmentEvent(outcome);
  const alignmentResult =
    alignmentEvent && alignmentEvent.event.kind === 'treasureSwordAlignment'
      ? alignmentEvent.event.result
      : undefined;
  const unusualEvent = findChildEvent(outcome, 'treasureSwordUnusual');
  const intelligenceLabel =
    unusualEvent && unusualEvent.event.kind === 'treasureSwordUnusual'
      ? formatSwordIntelligence(unusualEvent.event.result)
      : undefined;
  const luckBladeWishes = outcome.event.luckBladeWishes;
  const dragonColorEvent = findDragonSlayerColorEvent(outcome);
  const dragonSlayerColorLabel =
    dragonColorEvent &&
    dragonColorEvent.event.kind === 'treasureSwordDragonSlayerColor'
      ? dragonColorEvent.event.result.label
      : undefined;
  const abilitySummaries =
    unusualEvent && unusualEvent.event.kind === 'treasureSwordUnusual'
      ? summarizePrimaryAbilities(unusualEvent)
      : summarizePrimaryAbilities(outcome);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Swords',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: swordSentence(
      outcome.event.result,
      kind,
      alignmentResult,
      intelligenceLabel,
      abilitySummaries,
      luckBladeWishes,
      dragonSlayerColorLabel
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureSwordsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Swords (Table G)',
    sides: treasureSwords.sides,
    entries: treasureSwords.entries.map(({ range, command }) => ({
      range,
      label: SWORD_LABELS[command],
    })),
  });

export function renderTreasureSwordKindDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordKind') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Sword Type',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${SWORD_KIND_LABELS[outcome.event.result]}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `It is a ${SWORD_KIND_LABELS[outcome.event.result].toLowerCase()}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordKindCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordKind') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Sword Type',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `It is a ${SWORD_KIND_LABELS[outcome.event.result].toLowerCase()}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureSwordKindPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Sword Type',
    sides: treasureSwordKind.sides,
    entries: treasureSwordKind.entries.map(({ range, command }) => ({
      range,
      label: SWORD_KIND_LABELS[command],
    })),
  });

export function renderTreasureSwordUnusualDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordUnusual') return [];
  const result = outcome.event.result;
  const alignmentEvent = findSwordAlignmentEvent(outcome);
  const alignmentResult =
    alignmentEvent && alignmentEvent.event.kind === 'treasureSwordAlignment'
      ? alignmentEvent.event.result
      : undefined;
  const abilitySummaries = summarizePrimaryAbilities(outcome);
  const specialPurposeOutcomes = gatherSpecialPurposeOutcomes(outcome);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Sword Unusual Traits',
  };
  const bulletItems = [`roll: ${outcome.roll} — ${result.label}`];
  if (alignmentResult) {
    bulletItems.push(`alignment: ${alignmentResult.label}`);
  }
  if (abilitySummaries.length > 0) {
    const abilityLabel = abilitySummaries
      .map((summary) => summary.description)
      .join('; ');
    bulletItems.push(
      abilitySummaries.length === 1
        ? `ability: ${abilityLabel}`
        : `abilities: ${abilityLabel}`
    );
  }
  if (specialPurposeOutcomes.length > 0) {
    const purposeLabel = specialPurposeOutcomes
      .map(({ purpose, power }) => {
        const alignmentValue = purpose.alignment ?? alignmentResult?.alignment;
        const purposeText = describeSwordSpecialPurpose(purpose.purpose, {
          alignment: alignmentValue,
        });
        const powerText = power
          ? describeSwordSpecialPurposePower(power.power)
          : undefined;
        return powerText ? `${purposeText} (${powerText})` : purposeText;
      })
      .join('; ');
    bulletItems.push(
      specialPurposeOutcomes.length === 1
        ? `special purpose: ${purposeLabel}`
        : `special purposes: ${purposeLabel}`
    );
  }
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: bulletItems,
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: swordUnusualDescription(
      result,
      alignmentResult,
      abilitySummaries,
      specialPurposeOutcomes
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordUnusualCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordUnusual') return [];
  const result = outcome.event.result;
  const alignmentEvent = findSwordAlignmentEvent(outcome);
  const alignmentResult =
    alignmentEvent && alignmentEvent.event.kind === 'treasureSwordAlignment'
      ? alignmentEvent.event.result
      : undefined;
  const abilitySummaries = summarizePrimaryAbilities(outcome);
  const specialPurposeOutcomes = gatherSpecialPurposeOutcomes(outcome);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Unusual Traits',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: swordUnusualDescription(
      result,
      alignmentResult,
      abilitySummaries,
      specialPurposeOutcomes
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureSwordUnusualPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Sword Unusual Traits',
    sides: treasureSwordUnusual.sides,
    entries: treasureSwordUnusual.entries.map(({ range, command }) => ({
      range,
      label: SWORD_UNUSUAL_DETAILS[command].label,
    })),
    context,
  });

type PrimaryAbilitySummary = {
  ability: TreasureSwordPrimaryAbility;
  count: number;
  description: string;
  extraordinaryPower?: TreasureSwordExtraordinaryPower;
  compactDescription: string;
  compactExtras?: string[];
};

type AbilityResult = Extract<
  TreasureSwordPrimaryAbilityResult,
  { kind: 'ability' }
>;

type ExtraordinaryResult = Extract<
  TreasureSwordExtraordinaryPowerResult,
  { kind: 'power' }
>;

type SpecialPurposeOutcome = {
  purpose: TreasureSwordSpecialPurposeResult;
  power?: TreasureSwordSpecialPurposePowerResult;
};

function gatherPrimaryAbilityResults(node: OutcomeEventNode): AbilityResult[] {
  const collected: AbilityResult[] = [];
  const stack: OutcomeEventNode[] = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    if (current.event.kind === 'treasureSwordPrimaryAbility') {
      const outcome = current.event.result;
      if (outcome && outcome.kind === 'ability') {
        collected.push(outcome);
      }
    }
    const children = current.children || [];
    for (const child of children) {
      if (child.type === 'event') {
        stack.push(child);
      }
    }
  }
  return collected;
}

function gatherExtraordinaryPowerResults(
  node: OutcomeEventNode
): ExtraordinaryResult[] {
  const collected: ExtraordinaryResult[] = [];
  const stack: OutcomeEventNode[] = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    if (current.event.kind === 'treasureSwordExtraordinaryPower') {
      const outcome = current.event.result;
      if (outcome && outcome.kind === 'power') {
        collected.push(outcome);
      }
    }
    const children = current.children || [];
    for (const child of children) {
      if (child.type === 'event') {
        stack.push(child);
      }
    }
  }
  return collected;
}

function gatherSpecialPurposeOutcomes(
  node: OutcomeEventNode
): SpecialPurposeOutcome[] {
  const purposes: TreasureSwordSpecialPurposeResult[] = [];
  const powerByParent = new Map<
    string,
    TreasureSwordSpecialPurposePowerResult[]
  >();
  const powerBySlot = new Map<
    string,
    TreasureSwordSpecialPurposePowerResult[]
  >();
  const stack: OutcomeEventNode[] = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    if (current.event.kind === 'treasureSwordSpecialPurpose') {
      purposes.push(current.event.result);
    } else if (current.event.kind === 'treasureSwordSpecialPurposePower') {
      const powerResult = current.event.result;
      const parentKey = powerResult.parentSlotKey;
      if (parentKey) {
        const bucket = powerByParent.get(parentKey) ?? [];
        bucket.push(powerResult);
        powerByParent.set(parentKey, bucket);
      }
      if (powerResult.slotKey) {
        const bucket = powerBySlot.get(powerResult.slotKey) ?? [];
        bucket.push(powerResult);
        powerBySlot.set(powerResult.slotKey, bucket);
      }
    }
    const children = current.children || [];
    for (const child of children) {
      if (child.type === 'event') {
        stack.push(child);
      }
    }
  }
  const outcomes: SpecialPurposeOutcome[] = [];
  for (const purpose of purposes) {
    const parentKey =
      purpose.parentSlotKey ?? deriveParentKeyFromSlot(purpose.slotKey);
    const slotKey = purpose.slotKey;
    let power: TreasureSwordSpecialPurposePowerResult | undefined;
    if (parentKey) {
      const bucket = powerByParent.get(parentKey);
      if (bucket && bucket.length > 0) {
        power = bucket.shift();
        if (bucket.length === 0) {
          powerByParent.delete(parentKey);
        } else {
          powerByParent.set(parentKey, bucket);
        }
      }
    }
    if (!power && slotKey) {
      const bucket = powerBySlot.get(slotKey);
      if (bucket && bucket.length > 0) {
        power = bucket.shift();
        if (bucket.length === 0) {
          powerBySlot.delete(slotKey);
        } else {
          powerBySlot.set(slotKey, bucket);
        }
      }
    }
    outcomes.push({ purpose, power });
  }
  return outcomes;
}

function deriveParentKeyFromSlot(slotKey?: string): string | undefined {
  if (!slotKey) return undefined;
  const idx = slotKey.lastIndexOf(':');
  return idx === -1 ? slotKey : slotKey.slice(0, idx);
}

function compactExtraordinaryDescription(
  power: TreasureSwordExtraordinaryPower,
  multiplier: number
): string {
  const count = Math.max(1, multiplier);
  switch (power) {
    case TreasureSwordExtraordinaryPower.ChooseAny:
      return count === 1
        ? 'choose 1 extraordinary power'
        : `choose ${count} extraordinary powers`;
    case TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose: {
      const base =
        count === 1
          ? 'choose 1 extraordinary power, then roll for a special purpose and power'
          : `choose ${count} extraordinary powers, then roll for a special purpose and power for each`;
      return base;
    }
    default:
      return describeSwordExtraordinaryPower(power, count);
  }
}

export function summarizePrimaryAbilities(
  node: OutcomeEventNode
): PrimaryAbilitySummary[] {
  const abilityResults = gatherPrimaryAbilityResults(node);
  const extraordinaryResults = gatherExtraordinaryPowerResults(node);
  const specialPurposeOutcomes = gatherSpecialPurposeOutcomes(node);
  if (abilityResults.length === 0 && extraordinaryResults.length === 0) {
    return [];
  }

  type SummaryKey =
    | { kind: 'primary'; ability: TreasureSwordPrimaryAbility }
    | { kind: 'extra'; power: TreasureSwordExtraordinaryPower };

  const order: SummaryKey[] = [];
  const counts = new Map<string, { key: SummaryKey; count: number }>();

  const addEntry = (key: SummaryKey, contribution: number) => {
    const normalizedContribution = contribution > 0 ? contribution : 1;
    const keyId =
      key.kind === 'primary' ? `primary:${key.ability}` : `extra:${key.power}`;
    const existing = counts.get(keyId);
    if (!existing) {
      counts.set(keyId, { key, count: normalizedContribution });
      order.push(key);
    } else {
      existing.count += normalizedContribution;
    }
  };

  for (const entry of abilityResults) {
    addEntry(
      { kind: 'primary', ability: entry.ability },
      entry.multiplier ?? entry.rolls.length ?? 1
    );
  }

  for (const entry of extraordinaryResults) {
    addEntry(
      { kind: 'extra', power: entry.power },
      entry.multiplier ?? entry.rolls.length ?? 1
    );
  }

  return order.map((key) => {
    const stored =
      key.kind === 'primary'
        ? counts.get(`primary:${key.ability}`)
        : counts.get(`extra:${key.power}`);
    const count = stored?.count ?? 1;
    if (key.kind === 'extra') {
      let compactDescription = compactExtraordinaryDescription(
        key.power,
        count
      );
      let compactExtras: string[] | undefined;
      if (
        key.power ===
          TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose &&
        specialPurposeOutcomes.length > 0
      ) {
        compactDescription =
          count === 1
            ? 'choose 1 extraordinary power'
            : `choose ${count} extraordinary powers`;
        const extras: string[] = [];
        specialPurposeOutcomes.forEach(({ purpose, power }, index) => {
          const purposeText = describeSwordSpecialPurpose(purpose.purpose, {
            alignment: purpose.alignment,
          });
          const prefix =
            index === 0
              ? 'Its special purpose is to'
              : 'Another special purpose is to';
          extras.push(`${prefix} ${purposeText}.`);
          if (power) {
            const powerText = describeSwordSpecialPurposePower(power.power);
            extras.push(
              `When that purpose activates, the sword can ${powerText}.`
            );
          }
        });
        if (extras.length > 0) {
          compactExtras = extras;
        }
      }
      return {
        ability: TreasureSwordPrimaryAbility.ExtraordinaryPower,
        count,
        description: describeSwordExtraordinaryPower(key.power, count),
        extraordinaryPower: key.power,
        compactDescription,
        compactExtras,
      };
    }
    return {
      ability: key.ability,
      count,
      description: describeSwordPrimaryAbility(key.ability, count),
      compactDescription: describeSwordPrimaryAbility(key.ability, count),
    };
  });
}

function formatAbilityRolls(rolls: number[]): string {
  return rolls.join(', ');
}

function primaryAbilityPreviewLabel(
  command: TreasureSwordPrimaryAbilityCommand
): string {
  switch (command) {
    case TreasureSwordPrimaryAbilityCommand.RollTwice:
      return 'Roll twice on this table (ignore 93-00)';
    case TreasureSwordPrimaryAbilityCommand.ExtraordinaryPower:
      return 'Roll on the Extraordinary Power table instead';
    default: {
      const ability = command as unknown as TreasureSwordPrimaryAbility;
      return describeSwordPrimaryAbility(ability, 1);
    }
  }
}

function extraordinaryPowerPreviewLabel(
  command: TreasureSwordExtraordinaryPowerCommand
): string {
  switch (command) {
    case TreasureSwordExtraordinaryPowerCommand.RollTwice:
      return 'Roll twice on this table (ignore 95-97)';
    case TreasureSwordExtraordinaryPowerCommand.ChooseAny:
      return 'Choose one power from this table';
    case TreasureSwordExtraordinaryPowerCommand.ChooseAnyAndSpecialPurpose:
      return 'Choose one power, then roll for a special purpose and power';
    default: {
      const power = command as unknown as TreasureSwordExtraordinaryPower;
      return describeSwordExtraordinaryPower(power, 1);
    }
  }
}

export function renderTreasureSwordPrimaryAbilityDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordPrimaryAbility') return [];
  const result = outcome.event.result;
  if (result.kind === 'instruction') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Primary Ability',
    };
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${outcome.roll}`, result.note],
    };
    const nodes: DungeonRenderNode[] = [heading, bullet];
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Primary Ability',
  };
  const rollItem =
    result.rolls.length === 1
      ? `roll: ${result.rolls[0]}`
      : `rolls: ${formatAbilityRolls(result.rolls)}`;
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [rollItem, `effect: ${result.description}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `The sword can ${result.description}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordPrimaryAbilityCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordPrimaryAbility') return [];
  const result = outcome.event.result;
  if (result.kind === 'instruction') {
    const heading: DungeonMessage = {
      kind: 'heading',
      level: 4,
      text: 'Primary Ability',
    };
    const paragraph: DungeonMessage = {
      kind: 'paragraph',
      text: result.note,
    };
    const nodes: DungeonRenderNode[] = [heading, paragraph];
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Primary Ability',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `The sword can ${result.description}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureSwordPrimaryAbilityPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Sword Primary Ability',
    sides:
      tableId === 'treasureSwordPrimaryAbilityRestricted'
        ? treasureSwordPrimaryAbilityRestricted.sides
        : treasureSwordPrimaryAbility.sides,
    entries: (tableId === 'treasureSwordPrimaryAbilityRestricted'
      ? treasureSwordPrimaryAbilityRestricted.entries
      : treasureSwordPrimaryAbility.entries
    ).map(({ range, command }) => ({
      range,
      label: primaryAbilityPreviewLabel(command),
    })),
    context,
  });

export function renderTreasureSwordExtraordinaryPowerDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordExtraordinaryPower') return [];
  const result = outcome.event.result;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Extraordinary Power',
  };
  if (result.kind === 'instruction') {
    const bullet: DungeonMessage = {
      kind: 'bullet-list',
      items: [`roll: ${outcome.roll}`, result.note],
    };
    const nodes: DungeonRenderNode[] = [heading, bullet];
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  const rollItem =
    result.rolls.length === 1
      ? `roll: ${result.rolls[0]}`
      : `rolls: ${result.rolls.join(', ')}`;
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [rollItem, `effect: ${result.description}`],
  };
  if (
    result.power ===
      TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose &&
    result.alignmentRequired
  ) {
    bullet.items.push(
      "Roll the sword's alignment before determining the special purpose."
    );
  }
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `The sword can ${result.description}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordExtraordinaryPowerCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordExtraordinaryPower') return [];
  const result = outcome.event.result;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Extraordinary Power',
  };
  if (result.kind === 'instruction') {
    const paragraph: DungeonMessage = {
      kind: 'paragraph',
      text: result.note,
    };
    const nodes: DungeonRenderNode[] = [heading, paragraph];
    appendPendingPreviews(outcome, nodes);
    return nodes;
  }
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text:
      result.power === TreasureSwordExtraordinaryPower.ChooseAny ||
      result.power ===
        TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose
        ? `The character can ${compactExtraordinaryDescription(
            result.power,
            result.multiplier ?? 1
          )}${
            result.power ===
              TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose &&
            result.alignmentRequired
              ? ' (roll the sword alignment before determining the special purpose)'
              : ''
          }.`
        : `The sword has ${compactExtraordinaryDescription(
            result.power,
            result.multiplier ?? 1
          )}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureSwordExtraordinaryPowerPreview: TablePreviewFactory =
  (tableId, context) =>
    buildPreview(tableId, {
      title: 'Sword Extraordinary Power',
      sides:
        tableId === 'treasureSwordExtraordinaryPowerRestricted'
          ? treasureSwordExtraordinaryPowerRestricted.sides
          : treasureSwordExtraordinaryPower.sides,
      entries: (tableId === 'treasureSwordExtraordinaryPowerRestricted'
        ? treasureSwordExtraordinaryPowerRestricted.entries
        : treasureSwordExtraordinaryPower.entries
      ).map(({ range, command }) => ({
        range,
        label: extraordinaryPowerPreviewLabel(command),
      })),
      context,
    });

function specialPurposePreviewLabel(
  command: TreasureSwordSpecialPurposeCommand,
  alignment?: TreasureSwordAlignment
): string {
  const purpose = command as unknown as TreasureSwordSpecialPurpose;
  return describeSwordSpecialPurpose(purpose, { alignment });
}

function specialPurposePowerPreviewLabel(
  command: TreasureSwordSpecialPurposePowerCommand
): string {
  const power = command as unknown as TreasureSwordSpecialPurposePower;
  return describeSwordSpecialPurposePower(power);
}

export function renderTreasureSwordSpecialPurposeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordSpecialPurpose') return [];
  const result = outcome.event.result;
  const description = describeSwordSpecialPurpose(result.purpose, {
    alignment: result.alignment,
  });
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Special Purpose',
  };
  const rollItem =
    result.rolls.length === 1
      ? `roll: ${result.rolls[0]}`
      : `rolls: ${result.rolls.join(', ')}`;
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [rollItem, `purpose: ${description}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `The sword's special purpose is to ${description}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordSpecialPurposeCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordSpecialPurpose') return [];
  const result = outcome.event.result;
  const description = describeSwordSpecialPurpose(result.purpose, {
    alignment: result.alignment,
  });
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Special Purpose',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `The sword's special purpose is to ${description}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordSpecialPurposePowerDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordSpecialPurposePower') return [];
  const result = outcome.event.result;
  const description = describeSwordSpecialPurposePower(result.power);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Special Purpose Power',
  };
  const rollItem =
    result.rolls.length === 1
      ? `roll: ${result.rolls[0]}`
      : `rolls: ${result.rolls.join(', ')}`;
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [rollItem, `effect: ${description}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `When the special purpose triggers, the sword can ${description}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordSpecialPurposePowerCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordSpecialPurposePower') return [];
  const result = outcome.event.result;
  const description = describeSwordSpecialPurposePower(result.power);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Special Purpose Power',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `When triggered, the sword can ${description}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordDragonSlayerColorDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordDragonSlayerColor') return [];
  const result = outcome.event.result;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Dragon Slayer Target',
  };
  const alignmentLabel = SWORD_ALIGNMENT_DETAILS[result.alignment].label;
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll}`,
      `target: ${result.label} (${alignmentLabel})`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `The sword is keyed against ${result.label.toLowerCase()} dragons (${alignmentLabel}).`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordDragonSlayerColorCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordDragonSlayerColor') return [];
  const result = outcome.event.result;
  const alignmentLabel = SWORD_ALIGNMENT_DETAILS[result.alignment].label;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Dragon Slayer Target',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `The sword is keyed against ${result.label.toLowerCase()} dragons (${alignmentLabel}).`,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureSwordSpecialPurposePreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Sword Special Purpose',
    sides: treasureSwordSpecialPurpose.sides,
    entries: treasureSwordSpecialPurpose.entries.map(({ range, command }) => {
      const alignment =
        context && context.kind === 'treasureSwordSpecialPurpose'
          ? context.alignment
          : context && context.kind === 'treasureSwordExtraordinaryPower'
          ? context.alignment
          : undefined;
      return {
        range,
        label: specialPurposePreviewLabel(command, alignment),
      };
    }),
    context,
  });

export const buildTreasureSwordSpecialPurposePowerPreview: TablePreviewFactory =
  (tableId, context) =>
    buildPreview(tableId, {
      title: 'Special Purpose Power',
      sides: treasureSwordSpecialPurposePower.sides,
      entries: treasureSwordSpecialPurposePower.entries.map(
        ({ range, command }) => ({
          range,
          label: specialPurposePowerPreviewLabel(command),
        })
      ),
      context,
    });

export const buildTreasureSwordDragonSlayerColorPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Dragon Slayer Target',
    ...(() => {
      const alignment =
        context && context.kind === 'treasureSwordDragonSlayerColor'
          ? context.alignment
          : undefined;
      const table = dragonSlayerColorTableForAlignment(alignment);
      return {
        sides: table.sides,
        entries: table.entries.map(({ range, command }) => ({
          range,
          label: `${describeDragonSlayerColor(
            command
          )} (${alignmentAbbreviation(
            DRAGON_SLAYER_COLOR_DETAILS[command].alignment
          )})`,
        })),
      };
    })(),
    context,
  });

function findSwordAlignmentEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureSwordAlignment') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findSwordAlignmentEvent(child);
    if (match) return match;
  }
  return undefined;
}

function findDragonSlayerColorEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureSwordDragonSlayerColor') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findDragonSlayerColorEvent(child);
    if (match) return match;
  }
  return undefined;
}

function alignmentAbbreviation(alignment: TreasureSwordAlignment): string {
  const label = SWORD_ALIGNMENT_DETAILS[alignment].label;
  switch (label) {
    case 'Lawful Good':
      return 'LG';
    case 'Lawful Neutral':
      return 'LN';
    case 'Lawful Evil':
      return 'LE';
    case 'Neutral Good':
      return 'NG';
    case 'True Neutral':
      return 'N';
    case 'Neutral Evil':
      return 'NE';
    case 'Chaotic Good':
      return 'CG';
    case 'Chaotic Neutral':
      return 'CN';
    case 'Chaotic Evil':
      return 'CE';
    default:
      return label;
  }
}

function swordUnusualDescription(
  result: TreasureSwordUnusualResult,
  alignment: TreasureSwordAlignmentResult | undefined,
  abilitySummaries: PrimaryAbilitySummary[] = [],
  specialPurposes: SpecialPurposeOutcome[] = []
): string {
  if (result.category === 'normal') {
    return 'The sword has no unusual intelligence or additional capabilities.';
  }

  const segments: string[] = [];
  segments.push(`The sword has intelligence ${result.intelligence}.`);
  const abilityCount = abilitySummaries.length
    ? abilitySummaries.reduce((sum, ability) => sum + ability.count, 0)
    : result.primaryAbilityCount;
  const abilityText =
    abilityCount === 1
      ? '1 primary ability'
      : `${abilityCount} primary abilities`;
  segments.push(`It provides ${abilityText}.`);

  for (const ability of abilitySummaries) {
    segments.push(`The sword can ${ability.description}.`);
  }

  specialPurposes.forEach(({ purpose, power }, index) => {
    const alignmentValue = purpose.alignment ?? alignment?.alignment;
    const purposeText = describeSwordSpecialPurpose(purpose.purpose, {
      alignment: alignmentValue,
    });
    const prefix =
      index === 0
        ? 'Its special purpose is to'
        : 'Another special purpose is to';
    segments.push(`${prefix} ${purposeText}.`);
    if (power) {
      const powerText = describeSwordSpecialPurposePower(power.power);
      segments.push(`In pursuit of that goal, it can ${powerText}.`);
    }
  });

  let mentionedLanguages = false;

  switch (result.communication) {
    case 'semi-empathy':
      segments.push(
        'It communicates by semi-empathy, urging its possessor when abilities trigger.'
      );
      break;
    case 'empathy':
      segments.push('It communicates via empathy.');
      break;
    case 'speech': {
      if (result.languagesKnown !== undefined) {
        const tonguesLabel =
          result.languagesKnown === 1
            ? '1 additional tongue'
            : `${result.languagesKnown} additional tongues`;
        segments.push(`It speaks its alignment language plus ${tonguesLabel}.`);
        mentionedLanguages = true;
      } else {
        segments.push('It can speak aloud in its alignment language.');
      }
      break;
    }
    case 'speech and telepathy': {
      const note =
        result.communicationNotes ??
        'It can speak and communicate telepathically at will.';
      segments.push(note);
      break;
    }
    default:
      segments.push('It does not communicate.');
  }

  if (result.languageCapability === 'mundane') {
    segments.push('It can read any non-magical languages or maps.');
  } else if (result.languageCapability === 'magical') {
    segments.push('It can read all languages as well as magical writings.');
  }

  if (result.extraordinaryPower) {
    const hasExtraordinarySummary = abilitySummaries.some(
      (summary) => summary.extraordinaryPower !== undefined
    );
    if (!hasExtraordinarySummary) {
      segments.push('It also has an extraordinary power.');
    }
  }

  if (alignment) {
    segments.push(alignmentStatement(alignment));
  } else if (result.requiresAlignment) {
    segments.push('Determine the sword’s alignment separately.');
  }

  if (result.languagesKnown !== undefined) {
    if (!mentionedLanguages) {
      const label =
        result.languagesKnown === 1
          ? 'It speaks 1 additional language.'
          : `It speaks ${result.languagesKnown} additional languages.`;
      segments.push(label);
    }
  }

  return segments.join(' ');
}

export function renderTreasureSwordAlignmentDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordAlignment') return [];
  const result = outcome.event.result;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Sword Alignment',
  };
  const bulletLabel =
    result.source === 'fixed'
      ? `alignment: ${result.label}`
      : `roll: ${outcome.roll} — ${result.label}`;
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [bulletLabel],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: swordAlignmentDescription(result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureSwordAlignmentCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureSwordAlignment') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Sword Alignment',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: swordAlignmentDescription(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureSwordAlignmentPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildSwordAlignmentPreview(
    tableId,
    'Sword Alignment',
    treasureSwordAlignment,
    context
  );

export const buildTreasureSwordAlignmentChaoticPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildSwordAlignmentPreview(
    tableId,
    'Sword Alignment (Chaotic)',
    treasureSwordAlignmentChaotic,
    context
  );

export const buildTreasureSwordAlignmentLawfulPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildSwordAlignmentPreview(
    tableId,
    'Sword Alignment (Lawful)',
    treasureSwordAlignmentLawful,
    context
  );

function buildSwordAlignmentPreview(
  tableId: string,
  title: string,
  table: Table<TreasureSwordAlignment>,
  context?: TableContext
): ReturnType<TablePreviewFactory> {
  return buildPreview(tableId, {
    title,
    sides: table.sides,
    entries: table.entries.map(({ range, command }) => ({
      range,
      label: treasureSwordAlignmentLabel(command),
    })),
    context,
  });
}

function treasureSwordAlignmentLabel(
  alignment: TreasureSwordAlignment
): string {
  return SWORD_ALIGNMENT_DETAILS[alignment].label;
}

function swordAlignmentDescription(
  result: TreasureSwordAlignmentResult
): string {
  return alignmentStatement(result);
}

function alignmentStatement(result: TreasureSwordAlignmentResult): string {
  const base = `The sword is ${result.label}.`;
  return base;
}

export function formatSwordIntelligence(
  result: TreasureSwordUnusualResult
): string | undefined {
  if (result.intelligence === undefined) return undefined;
  const parts = [`I${result.intelligence}`];
  if (result.languagesKnown !== undefined) {
    const label =
      result.languagesKnown === 1
        ? '1 language'
        : `${result.languagesKnown} languages`;
    parts.push(label);
  }
  return parts.join(', ');
}

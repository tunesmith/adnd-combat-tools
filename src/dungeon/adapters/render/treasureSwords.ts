import type {
  DungeonMessage,
  DungeonRenderNode,
  TableContext,
} from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import type { Table } from '../../../tables/dungeon/dungeonTypes';
import {
  treasureSwords,
  TreasureSword,
  treasureSwordKind,
  TreasureSwordKind,
  treasureSwordUnusual,
  SWORD_UNUSUAL_DETAILS,
  type TreasureSwordUnusualResult,
} from '../../../tables/dungeon/treasureSwords';
import {
  treasureSwordAlignment,
  treasureSwordAlignmentChaotic,
  treasureSwordAlignmentLawful,
  SWORD_ALIGNMENT_DETAILS,
} from '../../../tables/dungeon/treasureSwordAlignment';
import type {
  TreasureSwordAlignment,
  TreasureSwordAlignmentResult,
} from '../../../tables/dungeon/treasureSwordAlignment';
import { buildPreview, findChildEvent } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

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

function applySwordKindLabel(
  base: string,
  kind?: TreasureSwordKind
): string {
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

export function swordLabel(
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
  intelligenceLabel?: string
): string {
  const baseLabel = swordLabel(sword, kind);
  const decoratedLabel = intelligenceLabel
    ? `${baseLabel} (${intelligenceLabel})`
    : baseLabel;
  const article = articleFor(decoratedLabel);
  const base = `There is ${article} ${decoratedLabel}.`;
  if (!alignment) return base;
  return `${base} ${alignmentStatement(alignment)}`;
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
  const bulletItems = [
    intelligenceLabel
      ? `roll: ${outcome.roll} — ${swordLabel(outcome.event.result, kind)} (${intelligenceLabel})`
      : `roll: ${outcome.roll} — ${swordLabel(outcome.event.result, kind)}`,
  ];
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
      intelligenceLabel
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
      intelligenceLabel
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
    items: [`roll: ${outcome.roll} — ${SWORD_KIND_LABELS[outcome.event.result]}`],
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
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Sword Unusual Traits',
  };
  const bulletItems = [`roll: ${outcome.roll} — ${result.label}`];
  if (alignmentResult) {
    bulletItems.push(`alignment: ${alignmentResult.label}`);
  }
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: bulletItems,
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: swordUnusualDescription(result, alignmentResult),
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
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Unusual Traits',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: swordUnusualDescription(result, alignmentResult),
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

function swordUnusualDescription(
  result: TreasureSwordUnusualResult,
  alignment?: TreasureSwordAlignmentResult
): string {
  if (result.category === 'normal') {
    return 'The sword has no unusual intelligence or additional capabilities.';
  }

  const segments: string[] = [];
  segments.push(`The sword has intelligence ${result.intelligence}.`);
  const abilityCount = result.primaryAbilityCount;
  const abilityText =
    abilityCount === 1
      ? '1 primary ability'
      : `${abilityCount} primary abilities`;
  segments.push(`It provides ${abilityText}.`);

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
      const note =
        result.communicationNotes ??
        'It can speak aloud in its alignment language and additional tongues.';
      segments.push(note);
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
    segments.push('It also has an extraordinary power.');
  }

  if (alignment) {
    segments.push(alignmentStatement(alignment));
  } else if (result.requiresAlignment) {
    segments.push('Determine the sword’s alignment separately.');
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
  return result.requiresLanguageTable
    ? `${base} Determine additional languages separately.`
    : base;
}

export function formatSwordIntelligence(
  result: TreasureSwordUnusualResult
): string | undefined {
  if (result.intelligence === undefined) return undefined;
  return `I${result.intelligence}`;
}

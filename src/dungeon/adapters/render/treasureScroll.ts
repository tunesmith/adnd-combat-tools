import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureScrolls,
  TreasureScroll,
} from '../../../tables/dungeon/treasureScrolls';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import {
  treasureScrollProtectionElementals,
  TreasureScrollProtectionElementals,
} from '../../../tables/dungeon/treasureScrollProtectionElementals';
import {
  treasureScrollProtectionLycanthropes,
  TreasureScrollProtectionLycanthropes,
} from '../../../tables/dungeon/treasureScrollProtectionLycanthropes';

const SCROLL_LABELS: Record<TreasureScroll, string> = {
  [TreasureScroll.SpellOneLevel1to4]: '1 spell (levels 1-4)',
  [TreasureScroll.SpellOneLevel1to6]: '1 spell (levels 1-6)',
  [TreasureScroll.SpellOneLevel2to9]: '1 spell (levels 2-9)',
  [TreasureScroll.SpellTwoLevel1to4]: '2 spells (levels 1-4)',
  [TreasureScroll.SpellTwoLevel1to8]: '2 spells (levels 1-8 / 1-6)',
  [TreasureScroll.SpellThreeLevel1to4]: '3 spells (levels 1-4)',
  [TreasureScroll.SpellThreeLevel2to9]: '3 spells (levels 2-9 / 2-7)',
  [TreasureScroll.SpellFourLevel1to6]: '4 spells (levels 1-6)',
  [TreasureScroll.SpellFourLevel1to8]: '4 spells (levels 1-8 / 1-6)',
  [TreasureScroll.SpellFiveLevel1to6]: '5 spells (levels 1-6)',
  [TreasureScroll.SpellFiveLevel1to8]: '5 spells (levels 1-8 / 1-6)',
  [TreasureScroll.SpellSixLevel1to6]: '6 spells (levels 1-6)',
  [TreasureScroll.SpellSixLevel3to8]: '6 spells (levels 3-8 / 3-6)',
  [TreasureScroll.SpellSevenLevel1to8]: '7 spells (levels 1-8 / 1-6)',
  [TreasureScroll.SpellSevenLevel2to9]: '7 spells (levels 2-9 / 2-7)',
  [TreasureScroll.SpellSevenLevel4to9]: '7 spells (levels 4-9 / 4-7)',
  [TreasureScroll.ProtectionDemons]: 'Protection vs Demons',
  [TreasureScroll.ProtectionDevils]: 'Protection vs Devils',
  [TreasureScroll.ProtectionElementals]: 'Protection vs Elementals',
  [TreasureScroll.ProtectionLycanthropes]: 'Protection vs Lycanthropes',
  [TreasureScroll.ProtectionMagic]: 'Protection vs Magic',
  [TreasureScroll.ProtectionPetrification]: 'Protection vs Petrification',
  [TreasureScroll.ProtectionPossession]: 'Protection vs Possession',
  [TreasureScroll.ProtectionUndead]: 'Protection vs Undead',
  [TreasureScroll.Curse]: 'Curse',
};

const NUMBER_WORDS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
};

export function renderTreasureScrollDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScroll') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Scroll',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${SCROLL_LABELS[outcome.event.result]}`],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedScrollSentence(outcome),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureScrollCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScroll') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Scroll',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedScrollSentence(outcome),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureScrollPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Scroll',
    sides: treasureScrolls.sides,
    entries: treasureScrolls.entries.map((entry) => ({
      range: entry.range,
      label: SCROLL_LABELS[entry.command],
    })),
  });

export function renderTreasureScrollProtectionElementalsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScrollProtectionElementals') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Elemental Protection',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasureScrollProtectionElementals[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: elementalProtectionSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureScrollProtectionElementalsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScrollProtectionElementals') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Elemental Protection',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: elementalProtectionSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureScrollProtectionElementalsPreview: TablePreviewFactory =
  (tableId) =>
    buildPreview(tableId, {
      title: 'Elemental Protection',
      sides: treasureScrollProtectionElementals.sides,
      entries: treasureScrollProtectionElementals.entries.map((entry) => ({
        range: entry.range,
        label: elementalsLabel(entry.command),
      })),
    });

export function renderTreasureScrollProtectionLycanthropesDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScrollProtectionLycanthropes') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Lycanthrope Protection',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasureScrollProtectionLycanthropes[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: lycanthropeProtectionSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureScrollProtectionLycanthropesCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScrollProtectionLycanthropes') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Lycanthrope Protection',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: lycanthropeProtectionSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureScrollProtectionLycanthropesPreview: TablePreviewFactory =
  (tableId) =>
    buildPreview(tableId, {
      title: 'Lycanthrope Protection',
      sides: treasureScrollProtectionLycanthropes.sides,
      entries: treasureScrollProtectionLycanthropes.entries.map((entry) => ({
        range: entry.range,
        label: lycanthropePreviewLabel(entry.command),
      })),
    });

export function resolvedScrollSentence(node: OutcomeEventNode): string {
  if (node.event.kind !== 'treasureScroll') return '';
  const { scroll } = node.event;
  if (scroll.type === 'spells') {
    const count = scroll.spellLevels.length;
    const countWord = NUMBER_WORDS[count] ?? String(count);
    const spellNoun = count === 1 ? 'spell' : 'spells';
    const casterLabel = scroll.caster;
    const article = needsAn(casterLabel) ? 'an' : 'a';
    const levels = scroll.spellLevels.map(formatOrdinal);
    const levelText = levels.length > 0 ? ` (${levels.join(', ')})` : '';
    return `There is ${article} ${casterLabel} scroll of ${countWord} ${spellNoun}${levelText}.`;
  }
  if (scroll.type === 'protection') {
    const protection = protectionText(node);
    return `There is a protection scroll against ${protection}.`;
  }
  return 'There is a cursed scroll.';
}

export function formatOrdinal(level: number): string {
  const remainder = level % 10;
  const teen = Math.floor(level / 10) % 10 === 1;
  const suffix = teen
    ? 'th'
    : remainder === 1
    ? 'st'
    : remainder === 2
    ? 'nd'
    : remainder === 3
    ? 'rd'
    : 'th';
  return `${level}${suffix}`;
}

function needsAn(word: string): boolean {
  const first = word.trim().charAt(0).toLowerCase();
  return ['a', 'e', 'i', 'o', 'u'].includes(first);
}

function protectionLabel(result: TreasureScroll): string {
  switch (result) {
    case TreasureScroll.ProtectionDemons:
      return 'demons';
    case TreasureScroll.ProtectionDevils:
      return 'devils';
    case TreasureScroll.ProtectionElementals:
      return 'elementals';
    case TreasureScroll.ProtectionLycanthropes:
      return 'lycanthropes';
    case TreasureScroll.ProtectionMagic:
      return 'magic';
    case TreasureScroll.ProtectionPetrification:
      return 'petrification';
    case TreasureScroll.ProtectionPossession:
      return 'possession';
    case TreasureScroll.ProtectionUndead:
      return 'undead';
    default:
      return 'unknown foes';
  }
}

function elementalsLabel(result: TreasureScrollProtectionElementals): string {
  switch (result) {
    case TreasureScrollProtectionElementals.Air:
      return 'Air Elementals';
    case TreasureScrollProtectionElementals.Earth:
      return 'Earth Elementals';
    case TreasureScrollProtectionElementals.Fire:
      return 'Fire Elementals';
    case TreasureScrollProtectionElementals.Water:
      return 'Water Elementals';
    case TreasureScrollProtectionElementals.All:
      return 'All Elementals';
    default:
      return 'Elementals';
  }
}

function elementalProtectionSentence(
  result: TreasureScrollProtectionElementals
): string {
  return `Protection from ${elementalsLabel(result).toLowerCase()}.`;
}

function lycanthropeProtectionSentence(
  result: TreasureScrollProtectionLycanthropes
): string {
  return `Protection from ${lycanthropeLabel(result)}.`;
}

function protectionText(node: OutcomeEventNode): string {
  if (node.event.kind !== 'treasureScroll') return 'unknown foes';
  if (node.event.scroll.type !== 'protection') return 'unknown foes';
  if (node.event.scroll.protection !== TreasureScroll.ProtectionElementals) {
    if (
      node.event.scroll.protection === TreasureScroll.ProtectionLycanthropes
    ) {
      const child = findChildEvent(
        node,
        'treasureScrollProtectionLycanthropes'
      );
      if (
        child &&
        child.event.kind === 'treasureScrollProtectionLycanthropes'
      ) {
        return lycanthropeLabel(child.event.result);
      }
    }
    return protectionLabel(node.event.scroll.protection);
  }
  const child = findChildEvent(node, 'treasureScrollProtectionElementals');
  if (child && child.event.kind === 'treasureScrollProtectionElementals') {
    return elementalsLabel(child.event.result).toLowerCase();
  }
  return 'elementals';
}

function lycanthropePreviewLabel(
  result: TreasureScrollProtectionLycanthropes
): string {
  switch (result) {
    case TreasureScrollProtectionLycanthropes.Werebears:
      return 'Werebears';
    case TreasureScrollProtectionLycanthropes.Wereboars:
      return 'Wereboars';
    case TreasureScrollProtectionLycanthropes.Wererats:
      return 'Wererats';
    case TreasureScrollProtectionLycanthropes.Weretigers:
      return 'Weretigers';
    case TreasureScrollProtectionLycanthropes.Werewolves:
      return 'Werewolves';
    case TreasureScrollProtectionLycanthropes.AllLycanthropes:
      return 'All Lycanthropes';
    case TreasureScrollProtectionLycanthropes.ShapeChangers:
      return 'Shape-Changers';
    default:
      return 'Lycanthropes';
  }
}

function lycanthropeLabel(
  result: TreasureScrollProtectionLycanthropes
): string {
  return lycanthropePreviewLabel(result).toLowerCase();
}

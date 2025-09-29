import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureRings,
  TreasureRing,
} from '../../../tables/dungeon/treasureRings';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import {
  treasureRingContrariness,
  TreasureRingContrariness,
} from '../../../tables/dungeon/treasureRingContrariness';
import {
  treasureRingElementalCommand,
  TreasureRingElementalCommand,
} from '../../../tables/dungeon/treasureRingElementalCommand';
import {
  treasureRingProtection,
  TreasureRingProtection,
} from '../../../tables/dungeon/treasureRingProtection';
import {
  treasureRingRegeneration,
  TreasureRingRegeneration,
} from '../../../tables/dungeon/treasureRingRegeneration';
import {
  treasureRingTelekinesis,
  TreasureRingTelekinesis,
} from '../../../tables/dungeon/treasureRingTelekinesis';
import { formatOrdinal } from './treasureScroll';

const RING_LABELS: Record<TreasureRing, string> = {
  [TreasureRing.Contrariness]: 'contrariness',
  [TreasureRing.Delusion]: 'delusion',
  [TreasureRing.DjinniSummoning]: 'djinni summoning',
  [TreasureRing.ElementalCommand]: 'elemental command',
  [TreasureRing.FeatherFalling]: 'feather falling',
  [TreasureRing.FireResistance]: 'fire resistance',
  [TreasureRing.FreeAction]: 'free action',
  [TreasureRing.HumanInfluence]: 'human influence',
  [TreasureRing.Invisibility]: 'invisibility',
  [TreasureRing.MammalControl]: 'mammal control',
  [TreasureRing.MultipleWishes]: 'multiple wishes',
  [TreasureRing.Protection]: 'protection',
  [TreasureRing.Regeneration]: 'regeneration',
  [TreasureRing.ShootingStars]: 'shooting stars',
  [TreasureRing.SpellStoring]: 'spell storing',
  [TreasureRing.SpellTurning]: 'spell turning',
  [TreasureRing.Swimming]: 'swimming',
  [TreasureRing.Telekinesis]: 'telekinesis',
  [TreasureRing.ThreeWishes]: 'three wishes',
  [TreasureRing.Warmth]: 'warmth',
  [TreasureRing.WaterWalking]: 'water walking',
  [TreasureRing.Weakness]: 'weakness',
  [TreasureRing.Wizardry]: 'wizardry',
  [TreasureRing.XRayVision]: 'x-ray vision',
};

const CONTRARIANNESS_PREVIEW: Record<TreasureRingContrariness, string> = {
  [TreasureRingContrariness.Flying]: 'Flying',
  [TreasureRingContrariness.Invisibility]: 'Invisibility',
  [TreasureRingContrariness.Levitation]: 'Levitation',
  [TreasureRingContrariness.ShockingGrasp]: 'Shocking Grasp',
  [TreasureRingContrariness.SpellTurning]: 'Spell Turning',
  [TreasureRingContrariness.Strength]: 'Strength',
};

const ELEMENTAL_COMMAND_PREVIEW: Record<TreasureRingElementalCommand, string> =
  {
    [TreasureRingElementalCommand.Air]: 'Air',
    [TreasureRingElementalCommand.Earth]: 'Earth',
    [TreasureRingElementalCommand.Fire]: 'Fire',
    [TreasureRingElementalCommand.Water]: 'Water',
  };

const PROTECTION_PREVIEW: Record<TreasureRingProtection, string> = {
  [TreasureRingProtection.PlusOne]: '+1',
  [TreasureRingProtection.PlusTwo]: '+2',
  [TreasureRingProtection.PlusTwoRadius]: "+2 (5' radius)",
  [TreasureRingProtection.PlusThree]: '+3',
  [TreasureRingProtection.PlusThreeRadius]: "+3 (5' radius)",
  [TreasureRingProtection.PlusFourTwo]: '+4 AC / +2 saves',
  [TreasureRingProtection.PlusSixOne]: '+6 AC / +1 saves',
};

const REGENERATION_PREVIEW: Record<TreasureRingRegeneration, string> = {
  [TreasureRingRegeneration.Standard]: 'Standard',
  [TreasureRingRegeneration.Vampiric]: 'Vampiric',
};

const TELEKINESIS_PREVIEW: Record<TreasureRingTelekinesis, string> = {
  [TreasureRingTelekinesis.TwoHundredFifty]: '250 g.p. maximum',
  [TreasureRingTelekinesis.FiveHundred]: '500 g.p. maximum',
  [TreasureRingTelekinesis.OneThousand]: '1,000 g.p. maximum',
  [TreasureRingTelekinesis.TwoThousand]: '2,000 g.p. maximum',
  [TreasureRingTelekinesis.FourThousand]: '4,000 g.p. maximum',
};

export function renderTreasureRingDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRing') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Ring',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${TreasureRing[outcome.event.result]}`],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: ringSentence(outcome.event.result, outcome),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRing') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Ring',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: ringSentence(outcome.event.result, outcome),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureRingPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Ring',
    sides: treasureRings.sides,
    entries: treasureRings.entries.map((entry) => ({
      range: entry.range,
      label: TreasureRing[entry.command] ?? String(entry.command),
    })),
  });

export const buildTreasureRingContrarinessPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Contrariness Effect',
    sides: treasureRingContrariness.sides,
    entries: treasureRingContrariness.entries.map((entry) => ({
      range: entry.range,
      label: contrarinessPreviewLabel(entry.command),
    })),
  });

export const buildTreasureRingElementalCommandPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Elemental Focus',
    sides: treasureRingElementalCommand.sides,
    entries: treasureRingElementalCommand.entries.map((entry) => ({
      range: entry.range,
      label: elementalCommandPreviewLabel(entry.command),
    })),
  });

export const buildTreasureRingProtectionPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Protection Bonus',
    sides: treasureRingProtection.sides,
    entries: treasureRingProtection.entries.map((entry) => ({
      range: entry.range,
      label: protectionPreviewLabel(entry.command),
    })),
  });

export const buildTreasureRingRegenerationPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Regeneration Type',
    sides: treasureRingRegeneration.sides,
    entries: treasureRingRegeneration.entries.map((entry) => ({
      range: entry.range,
      label: regenerationPreviewLabel(entry.command),
    })),
  });

export const buildTreasureRingTelekinesisPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Telekinetic Capacity',
    sides: treasureRingTelekinesis.sides,
    entries: treasureRingTelekinesis.entries.map((entry) => ({
      range: entry.range,
      label: telekinesisPreviewLabel(entry.command),
    })),
  });

export function renderTreasureRingContrarinessDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingContrariness') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Contrariness Effect',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasureRingContrariness[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: contrarinessSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingContrarinessCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingContrariness') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Contrariness Effect',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: contrarinessSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingElementalCommandDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingElementalCommand') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Elemental Focus',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasureRingElementalCommand[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: elementalCommandSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingElementalCommandCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingElementalCommand') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Elemental Focus',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: elementalCommandSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingProtectionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingProtection') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Protection Bonus',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${protectionPreviewLabel(outcome.event.result)}`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: protectionSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingProtectionCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingProtection') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Protection Bonus',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: protectionSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingRegenerationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingRegeneration') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Regeneration Type',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${regenerationPreviewLabel(
        outcome.event.result
      )}`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: regenerationSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingRegenerationCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingRegeneration') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Regeneration Type',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: regenerationSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingTelekinesisDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingTelekinesis') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Telekinetic Capacity',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${telekinesisPreviewLabel(
        outcome.event.result
      )}`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: telekinesisSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingTelekinesisCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingTelekinesis') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Telekinetic Capacity',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: telekinesisSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function ringSentence(
  result: TreasureRing,
  node?: OutcomeEventNode
): string {
  const label = RING_LABELS[result];
  if (result === TreasureRing.Contrariness && node) {
    const child = findChildEvent(node, 'treasureRingContrariness');
    if (child && child.event.kind === 'treasureRingContrariness') {
      const effect = contrarinessPreviewLabel(child.event.result);
      return `There is a ring of contrariness (${effect}).`;
    }
  } else if (result === TreasureRing.ElementalCommand && node) {
    const child = findChildEvent(node, 'treasureRingElementalCommand');
    if (child && child.event.kind === 'treasureRingElementalCommand') {
      const focus = elementalCommandPreviewLabel(
        child.event.result
      ).toLowerCase();
      return `There is a ring of ${focus} elemental command.`;
    }
  } else if (result === TreasureRing.Protection && node) {
    const child = findChildEvent(node, 'treasureRingProtection');
    if (child && child.event.kind === 'treasureRingProtection') {
      return protectionRingSentence(child.event.result);
    }
  } else if (result === TreasureRing.SpellStoring && node) {
    const { event } = node;
    if (event.kind === 'treasureRing' && event.spellStoring) {
      return spellStoringRingSentence(event.spellStoring);
    }
  } else if (result === TreasureRing.Regeneration && node) {
    const child = findChildEvent(node, 'treasureRingRegeneration');
    if (child && child.event.kind === 'treasureRingRegeneration') {
      return regenerationRingSentence(child.event.result);
    }
  } else if (result === TreasureRing.Telekinesis && node) {
    const child = findChildEvent(node, 'treasureRingTelekinesis');
    if (child && child.event.kind === 'treasureRingTelekinesis') {
      return telekinesisRingSentence(child.event.result);
    }
  }
  return `There is a ring of ${label}.`;
}

function contrarinessPreviewLabel(result: TreasureRingContrariness): string {
  return CONTRARIANNESS_PREVIEW[result] ?? 'Contrary Effect';
}

function contrarinessSentence(result: TreasureRingContrariness): string {
  return `Contrariness effect: ${contrarinessPreviewLabel(result)}.`;
}

function elementalCommandSentence(
  result: TreasureRingElementalCommand
): string {
  return `Elemental focus: ${elementalCommandPreviewLabel(result)}.`;
}

function elementalCommandPreviewLabel(
  result: TreasureRingElementalCommand
): string {
  return ELEMENTAL_COMMAND_PREVIEW[result] ?? 'Elemental';
}

function protectionPreviewLabel(result: TreasureRingProtection): string {
  return PROTECTION_PREVIEW[result] ?? '+1';
}

function protectionSentence(result: TreasureRingProtection): string {
  switch (result) {
    case TreasureRingProtection.PlusOne:
      return 'Protection bonus: +1 to AC and saving throws.';
    case TreasureRingProtection.PlusTwo:
      return 'Protection bonus: +2 to AC and saving throws.';
    case TreasureRingProtection.PlusTwoRadius:
      return "Protection bonus: +2 to AC and saving throws within a 5' radius.";
    case TreasureRingProtection.PlusThree:
      return 'Protection bonus: +3 to AC and saving throws.';
    case TreasureRingProtection.PlusThreeRadius:
      return "Protection bonus: +3 to AC and saving throws within a 5' radius.";
    case TreasureRingProtection.PlusFourTwo:
      return 'Protection bonus: +4 to AC and +2 on saving throws.';
    case TreasureRingProtection.PlusSixOne:
      return 'Protection bonus: +6 to AC and +1 on saving throws.';
    default:
      return 'Protection bonus: +1 to AC and saving throws.';
  }
}

function protectionRingSentence(result: TreasureRingProtection): string {
  switch (result) {
    case TreasureRingProtection.PlusOne:
      return 'There is a ring of protection +1.';
    case TreasureRingProtection.PlusTwo:
      return 'There is a ring of protection +2.';
    case TreasureRingProtection.PlusTwoRadius:
      return "There is a ring of protection +2 (5' radius).";
    case TreasureRingProtection.PlusThree:
      return 'There is a ring of protection +3.';
    case TreasureRingProtection.PlusThreeRadius:
      return "There is a ring of protection +3 (5' radius).";
    case TreasureRingProtection.PlusFourTwo:
      return 'There is a ring of protection granting +4 to AC and +2 on saving throws.';
    case TreasureRingProtection.PlusSixOne:
      return 'There is a ring of protection granting +6 to AC and +1 on saving throws.';
    default:
      return 'There is a ring of protection.';
  }
}

function regenerationPreviewLabel(result: TreasureRingRegeneration): string {
  return REGENERATION_PREVIEW[result] ?? 'Standard';
}

function regenerationSentence(result: TreasureRingRegeneration): string {
  switch (result) {
    case TreasureRingRegeneration.Standard:
      return 'Regeneration type: standard regeneration.';
    case TreasureRingRegeneration.Vampiric:
      return 'Regeneration type: vampiric regeneration.';
    default:
      return 'Regeneration type: standard regeneration.';
  }
}

function regenerationRingSentence(result: TreasureRingRegeneration): string {
  switch (result) {
    case TreasureRingRegeneration.Standard:
      return 'There is a ring of regeneration (standard).';
    case TreasureRingRegeneration.Vampiric:
      return 'There is a vampiric regeneration ring.';
    default:
      return 'There is a ring of regeneration.';
  }
}

function spellStoringRingSentence({
  caster,
  spellLevels,
}: {
  caster: 'magic-user' | 'illusionist' | 'cleric' | 'druid';
  spellLevels: number[];
}): string {
  const casterLabel = `${caster} spell storing`;
  const levelText = spellLevels.length
    ? ` (${spellLevels.map(formatOrdinal).join(', ')})`
    : '';
  return `There is a ring of ${casterLabel}${levelText}.`;
}

function telekinesisPreviewLabel(result: TreasureRingTelekinesis): string {
  return TELEKINESIS_PREVIEW[result] ?? 'Telekinesis';
}

function telekinesisSentence(result: TreasureRingTelekinesis): string {
  return `Telekinetic capacity: ${telekinesisPreviewLabel(result)}.`;
}

function telekinesisRingSentence(result: TreasureRingTelekinesis): string {
  const label = telekinesisPreviewLabel(result);
  return `There is a ring of telekinesis (${label}).`;
}

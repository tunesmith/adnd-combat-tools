import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import { emphasizeInlineText } from '../../../helpers/inlineContent';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  treasureRings,
  TreasureRing,
  treasureRingContrariness,
  TreasureRingContrariness,
  treasureRingElementalCommand,
  TreasureRingElementalCommand,
  treasureRingProtection,
  TreasureRingProtection,
  treasureRingRegeneration,
  TreasureRingRegeneration,
  treasureRingTelekinesis,
  TreasureRingTelekinesis,
  treasureRingThreeWishes,
  TreasureRingThreeWishes,
  treasureRingWizardry,
  TreasureRingWizardry,
} from './ringTables';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import { formatOrdinal } from '../shared';

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

const THREE_WISHES_PREVIEW: Record<TreasureRingThreeWishes, string> = {
  [TreasureRingThreeWishes.Limited]: 'limited',
  [TreasureRingThreeWishes.Standard]: 'standard',
};

const WIZARDRY_PREVIEW: Record<TreasureRingWizardry, string> = {
  [TreasureRingWizardry.DoubleFirst]: 'doubles first level spells',
  [TreasureRingWizardry.DoubleSecond]: 'doubles second level spells',
  [TreasureRingWizardry.DoubleThird]: 'doubles third level spells',
  [TreasureRingWizardry.DoubleFirstSecond]:
    'doubles first and second level spells',
  [TreasureRingWizardry.DoubleFourth]: 'doubles fourth level spells',
  [TreasureRingWizardry.DoubleFifth]: 'doubles fifth level spells',
  [TreasureRingWizardry.DoubleFirstThroughThird]:
    'doubles first through third level spells',
  [TreasureRingWizardry.DoubleFourthFifth]:
    'doubles fourth and fifth level spells',
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
    ...emphasizeInlineText(
      ringSentence(outcome.event.result, outcome),
      resolvedRingItemName(outcome.event.result, outcome)
    ),
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
    ...emphasizeInlineText(
      ringSentence(outcome.event.result, outcome),
      resolvedRingItemName(outcome.event.result, outcome)
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureRingPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Ring',
    sides: treasureRings.sides,
    entries: treasureRings.entries.map((entry) => ({
      range: entry.range,
      label: TreasureRing[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildTreasureRingContrarinessPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Contrariness Effect',
    sides: treasureRingContrariness.sides,
    entries: treasureRingContrariness.entries.map((entry) => ({
      range: entry.range,
      label: contrarinessPreviewLabel(entry.command),
    })),
    context,
  });

export const buildTreasureRingElementalCommandPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Elemental Focus',
    sides: treasureRingElementalCommand.sides,
    entries: treasureRingElementalCommand.entries.map((entry) => ({
      range: entry.range,
      label: elementalCommandPreviewLabel(entry.command),
    })),
    context,
  });

export const buildTreasureRingProtectionPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Protection Bonus',
    sides: treasureRingProtection.sides,
    entries: treasureRingProtection.entries.map((entry) => ({
      range: entry.range,
      label: protectionPreviewLabel(entry.command),
    })),
    context,
  });

export const buildTreasureRingRegenerationPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Regeneration Type',
    sides: treasureRingRegeneration.sides,
    entries: treasureRingRegeneration.entries.map((entry) => ({
      range: entry.range,
      label: regenerationPreviewLabel(entry.command),
    })),
    context,
  });

export const buildTreasureRingTelekinesisPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Telekinetic Capacity',
    sides: treasureRingTelekinesis.sides,
    entries: treasureRingTelekinesis.entries.map((entry) => ({
      range: entry.range,
      label: telekinesisPreviewLabel(entry.command),
    })),
    context,
  });

export const buildTreasureRingThreeWishesPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Wish Capacity',
    sides: treasureRingThreeWishes.sides,
    entries: treasureRingThreeWishes.entries.map((entry) => ({
      range: entry.range,
      label: threeWishesPreviewLabel(entry.command),
    })),
    context,
  });

export const buildTreasureRingWizardryPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Spell Doubling',
    sides: treasureRingWizardry.sides,
    entries: treasureRingWizardry.entries.map((entry) => ({
      range: entry.range,
      label: wizardryPreviewLabel(entry.command),
    })),
    context,
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

export function renderTreasureRingThreeWishesDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingThreeWishes') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Wish Capacity',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${threeWishesPreviewLabel(
        outcome.event.result
      )}`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: threeWishesSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingThreeWishesCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingThreeWishes') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Wish Capacity',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: threeWishesSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingWizardryDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingWizardry') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Spell Doubling',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${wizardryPreviewLabel(outcome.event.result)}`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: wizardrySentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRingWizardryCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRingWizardry') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Spell Doubling',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: wizardrySentence(outcome.event.result),
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
  } else if (result === TreasureRing.MultipleWishes && node) {
    const { event } = node;
    if (event.kind === 'treasureRing' && event.multipleWishesCount) {
      return multipleWishesRingSentence(event.multipleWishesCount);
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
  } else if (result === TreasureRing.ThreeWishes && node) {
    const child = findChildEvent(node, 'treasureRingThreeWishes');
    if (child && child.event.kind === 'treasureRingThreeWishes') {
      return threeWishesRingSentence(child.event.result);
    }
  } else if (result === TreasureRing.Wizardry && node) {
    const child = findChildEvent(node, 'treasureRingWizardry');
    if (child && child.event.kind === 'treasureRingWizardry') {
      return wizardryRingSentence(child.event.result);
    }
  }
  return `There is a ring of ${label}.`;
}

export function resolvedRingItemName(
  result: TreasureRing,
  node?: OutcomeEventNode
): string {
  if (result === TreasureRing.Contrariness) {
    return 'ring of contrariness';
  }
  if (result === TreasureRing.ElementalCommand && node) {
    const child = findChildEvent(node, 'treasureRingElementalCommand');
    if (child && child.event.kind === 'treasureRingElementalCommand') {
      const focus = elementalCommandPreviewLabel(
        child.event.result
      ).toLowerCase();
      return `ring of ${focus} elemental command`;
    }
    return 'ring of elemental command';
  }
  if (result === TreasureRing.Protection && node) {
    const child = findChildEvent(node, 'treasureRingProtection');
    if (child && child.event.kind === 'treasureRingProtection') {
      switch (child.event.result) {
        case TreasureRingProtection.PlusOne:
          return 'ring of protection +1';
        case TreasureRingProtection.PlusTwo:
          return 'ring of protection +2';
        case TreasureRingProtection.PlusTwoRadius:
          return 'ring of protection +2';
        case TreasureRingProtection.PlusThree:
          return 'ring of protection +3';
        case TreasureRingProtection.PlusThreeRadius:
          return 'ring of protection +3';
        case TreasureRingProtection.PlusFourTwo:
        case TreasureRingProtection.PlusSixOne:
          return 'ring of protection';
        default:
          return 'ring of protection';
      }
    }
    return 'ring of protection';
  }
  if (result === TreasureRing.SpellStoring && node) {
    const { event } = node;
    if (event.kind === 'treasureRing' && event.spellStoring) {
      return `ring of ${event.spellStoring.caster} spell storing`;
    }
  }
  if (result === TreasureRing.MultipleWishes) {
    return 'ring of multiple wishes';
  }
  if (result === TreasureRing.Regeneration && node) {
    const child = findChildEvent(node, 'treasureRingRegeneration');
    if (child && child.event.kind === 'treasureRingRegeneration') {
      return child.event.result === TreasureRingRegeneration.Vampiric
        ? 'vampiric regeneration ring'
        : 'ring of regeneration';
    }
    return 'ring of regeneration';
  }
  if (result === TreasureRing.Telekinesis) {
    return 'ring of telekinesis';
  }
  if (result === TreasureRing.ThreeWishes) {
    return 'ring of three wishes';
  }
  if (result === TreasureRing.Wizardry) {
    return 'ring of wizardry';
  }
  return `ring of ${RING_LABELS[result]}`;
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

function multipleWishesRingSentence(count: number): string {
  return `There is a ring of multiple wishes (${count} wishes).`;
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

function threeWishesPreviewLabel(result: TreasureRingThreeWishes): string {
  return THREE_WISHES_PREVIEW[result] ?? 'standard';
}

function threeWishesSentence(result: TreasureRingThreeWishes): string {
  return `Wish capacity: ${threeWishesPreviewLabel(result)}.`;
}

function threeWishesRingSentence(result: TreasureRingThreeWishes): string {
  return `There is a ring of three wishes (${threeWishesPreviewLabel(
    result
  )}).`;
}

function wizardryPreviewLabel(result: TreasureRingWizardry): string {
  return WIZARDRY_PREVIEW[result] ?? 'doubles first level spells';
}

function wizardrySentence(result: TreasureRingWizardry): string {
  return `Spell doubling: ${wizardryPreviewLabel(result)}.`;
}

function wizardryRingSentence(result: TreasureRingWizardry): string {
  return `There is a ring of wizardry (${wizardryPreviewLabel(result)}).`;
}

import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import { emphasizeInlineText } from '../../../helpers/inlineContent';
import type {
  OutcomeEventNode,
  TreasureBeakerPotionDetails,
} from '../../../domain/outcome';
import {
  treasurePotion,
  TreasurePotion,
  treasurePotionAnimalControl,
  TreasurePotionAnimalControl,
  treasurePotionDragonControl,
  TreasurePotionDragonControl,
  treasurePotionGiantControl,
  TreasurePotionGiantControl,
  treasurePotionGiantStrength,
  TreasurePotionGiantStrength,
  treasurePotionHumanControl,
  TreasurePotionHumanControl,
  treasurePotionUndeadControl,
  TreasurePotionUndeadControl,
} from './potionTables';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

const POTION_LABELS: Record<TreasurePotion, string> = {
  [TreasurePotion.AnimalControl]: 'animal control',
  [TreasurePotion.Clairaudience]: 'clairaudience',
  [TreasurePotion.Clairvoyance]: 'clairvoyance',
  [TreasurePotion.Climbing]: 'climbing',
  [TreasurePotion.Delusion]: 'delusion',
  [TreasurePotion.Diminution]: 'diminution',
  [TreasurePotion.DragonControl]: 'dragon control',
  [TreasurePotion.ESP]: 'ESP',
  [TreasurePotion.ExtraHealing]: 'extra-healing',
  [TreasurePotion.FireResistance]: 'fire resistance',
  [TreasurePotion.Flying]: 'flying',
  [TreasurePotion.GaseousForm]: 'gaseous form',
  [TreasurePotion.GiantControl]: 'giant control',
  [TreasurePotion.GiantStrength]: 'giant strength',
  [TreasurePotion.Growth]: 'growth',
  [TreasurePotion.Healing]: 'healing',
  [TreasurePotion.Heroism]: 'heroism',
  [TreasurePotion.HumanControl]: 'human control',
  [TreasurePotion.Invisibility]: 'invisibility',
  [TreasurePotion.Invulnerability]: 'invulnerability',
  [TreasurePotion.Levitation]: 'levitation',
  [TreasurePotion.Longevity]: 'longevity',
  [TreasurePotion.OilOfEtherealness]: 'oil of etherealness',
  [TreasurePotion.OilOfSlipperiness]: 'oil of slipperiness',
  [TreasurePotion.PhiltreOfLove]: 'philtre of love',
  [TreasurePotion.PhiltreOfPersuasiveness]: 'philtre of persuasiveness',
  [TreasurePotion.PlantControl]: 'plant control',
  [TreasurePotion.PolymorphSelf]: 'polymorph (self)',
  [TreasurePotion.Poison]: 'poison',
  [TreasurePotion.Speed]: 'speed',
  [TreasurePotion.SuperHeroism]: 'super-heroism',
  [TreasurePotion.SweetWater]: 'sweet water',
  [TreasurePotion.TreasureFinding]: 'treasure finding',
  [TreasurePotion.UndeadControl]: 'undead control',
  [TreasurePotion.WaterBreathing]: 'water breathing',
};

export function renderTreasurePotionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotion') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Potion',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${TreasurePotion[outcome.event.result]}`],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      resolvedPotionSentence(outcome),
      resolvedPotionItemName(outcome)
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePotionCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotion') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Potion',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      resolvedPotionSentence(outcome),
      resolvedPotionItemName(outcome)
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Potion',
    sides: treasurePotion.sides,
    entries: treasurePotion.entries.map((entry) => ({
      range: entry.range,
      label: TreasurePotion[entry.command] ?? String(entry.command),
    })),
    context,
  });

export function renderTreasurePotionAnimalControlDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionAnimalControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Animal Control Target',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasurePotionAnimalControl[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      animalControlSentence(outcome.event.result),
      `potion of ${animalControlLabel(outcome.event.result)} control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePotionAnimalControlCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionAnimalControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Animal Control Target',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      animalControlSentence(outcome.event.result),
      `potion of ${animalControlLabel(outcome.event.result)} control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionAnimalControlPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Animal Control Target',
    sides: treasurePotionAnimalControl.sides,
    entries: treasurePotionAnimalControl.entries.map((entry) => ({
      range: entry.range,
      label: animalControlLabel(entry.command),
    })),
    context,
  });

export function renderTreasurePotionDragonControlDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionDragonControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Dragon Control Target',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasurePotionDragonControl[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      dragonControlSentence(outcome.event.result),
      `potion of ${dragonControlLabel(outcome.event.result)} dragon control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePotionDragonControlCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionDragonControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Dragon Control Target',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      dragonControlSentence(outcome.event.result),
      `potion of ${dragonControlLabel(outcome.event.result)} dragon control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionDragonControlPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Dragon Control Target',
    sides: treasurePotionDragonControl.sides,
    entries: treasurePotionDragonControl.entries.map((entry) => ({
      range: entry.range,
      label: dragonControlLabel(entry.command),
    })),
    context,
  });

export function renderTreasurePotionGiantControlDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionGiantControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Giant Control Target',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasurePotionGiantControl[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      giantControlSentence(outcome.event.result),
      `potion of ${giantControlLabel(outcome.event.result)} giant control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePotionGiantControlCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionGiantControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Giant Control Target',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      giantControlSentence(outcome.event.result),
      `potion of ${giantControlLabel(outcome.event.result)} giant control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionGiantControlPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Giant Control Target',
    sides: treasurePotionGiantControl.sides,
    entries: treasurePotionGiantControl.entries.map((entry) => ({
      range: entry.range,
      label: giantControlLabel(entry.command),
    })),
    context,
  });

export function renderTreasurePotionGiantStrengthDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionGiantStrength') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Giant Strength Target',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasurePotionGiantStrength[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      giantStrengthSentence(outcome.event.result),
      `potion of ${giantStrengthLabel(outcome.event.result)} giant strength`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePotionGiantStrengthCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionGiantStrength') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Giant Strength Target',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      giantStrengthSentence(outcome.event.result),
      `potion of ${giantStrengthLabel(outcome.event.result)} giant strength`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionGiantStrengthPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Giant Strength Target',
    sides: treasurePotionGiantStrength.sides,
    entries: treasurePotionGiantStrength.entries.map((entry) => ({
      range: entry.range,
      label: giantStrengthLabel(entry.command),
    })),
    context,
  });

export function renderTreasurePotionHumanControlDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionHumanControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Human Control Target',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasurePotionHumanControl[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      humanControlSentence(outcome.event.result),
      `potion of ${humanControlLabel(outcome.event.result)} control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePotionHumanControlCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionHumanControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Human Control Target',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      humanControlSentence(outcome.event.result),
      `potion of ${humanControlLabel(outcome.event.result)} control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionHumanControlPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Human Control Target',
    sides: treasurePotionHumanControl.sides,
    entries: treasurePotionHumanControl.entries.map((entry) => ({
      range: entry.range,
      label: humanControlLabel(entry.command),
    })),
    context,
  });

export function renderTreasurePotionUndeadControlDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionUndeadControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Undead Control Target',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        TreasurePotionUndeadControl[outcome.event.result]
      }`,
    ],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      undeadControlSentence(outcome.event.result),
      `potion of ${undeadControlLabel(outcome.event.result)} control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePotionUndeadControlCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePotionUndeadControl') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Undead Control Target',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizeInlineText(
      undeadControlSentence(outcome.event.result),
      `potion of ${undeadControlLabel(outcome.event.result)} control`
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionUndeadControlPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Undead Control Target',
    sides: treasurePotionUndeadControl.sides,
    entries: treasurePotionUndeadControl.entries.map((entry) => ({
      range: entry.range,
      label: undeadControlLabel(entry.command),
    })),
    context,
  });

function animalControlSentence(result: TreasurePotionAnimalControl): string {
  const label = animalControlLabel(result);
  return `There is a potion of ${label} control.`;
}

function animalControlLabel(result: TreasurePotionAnimalControl): string {
  switch (result) {
    case TreasurePotionAnimalControl.MammalMarsupial:
      return 'mammal/marsupial';
    case TreasurePotionAnimalControl.Avian:
      return 'avian';
    case TreasurePotionAnimalControl.ReptileAmphibian:
      return 'reptile/amphibian';
    case TreasurePotionAnimalControl.Fish:
      return 'fish';
    case TreasurePotionAnimalControl.MammalMarsupialAvian:
      return 'mammal/marsupial/avian';
    case TreasurePotionAnimalControl.ReptileAmphibianFish:
      return 'reptile/amphibian/fish';
    case TreasurePotionAnimalControl.AnyAnimal:
      return 'any animal';
    default:
      return 'animal';
  }
}

function dragonControlSentence(result: TreasurePotionDragonControl): string {
  return `There is a potion of ${dragonControlLabel(result)} dragon control.`;
}

function dragonControlLabel(result: TreasurePotionDragonControl): string {
  switch (result) {
    case TreasurePotionDragonControl.White:
      return 'white';
    case TreasurePotionDragonControl.Black:
      return 'black';
    case TreasurePotionDragonControl.Green:
      return 'green';
    case TreasurePotionDragonControl.Blue:
      return 'blue';
    case TreasurePotionDragonControl.Red:
      return 'red';
    case TreasurePotionDragonControl.Brass:
      return 'brass';
    case TreasurePotionDragonControl.Copper:
      return 'copper';
    case TreasurePotionDragonControl.Bronze:
      return 'bronze';
    case TreasurePotionDragonControl.Silver:
      return 'silver';
    case TreasurePotionDragonControl.Gold:
      return 'gold';
    case TreasurePotionDragonControl.Evil:
      return 'evil';
    case TreasurePotionDragonControl.Good:
      return 'good';
    default:
      return 'dragon';
  }
}

export function resolvedPotionSentence(node: OutcomeEventNode): string {
  if (node.event.kind !== 'treasurePotion') return '';
  if (
    node.event.result === TreasurePotion.WaterBreathing &&
    node.event.waterBreathingDoses
  ) {
    return `There is a potion of water breathing (${node.event.waterBreathingDoses} doses).`;
  }
  return `There is a ${labelForResolvedPotion(extractResolvedPotion(node))}.`;
}

export function resolvedPotionItemName(
  node: OutcomeEventNode
): string | undefined {
  if (node.event.kind !== 'treasurePotion') return undefined;
  if (node.event.result === TreasurePotion.WaterBreathing) {
    return 'potion of water breathing';
  }
  return labelForResolvedPotion(extractResolvedPotion(node));
}

export function labelForResolvedPotion(
  details: TreasureBeakerPotionDetails
): string {
  switch (details.potion) {
    case TreasurePotion.AnimalControl:
      return details.animalControl !== undefined
        ? `potion of ${animalControlLabel(details.animalControl)} control`
        : `potion of ${POTION_LABELS[details.potion]}`;
    case TreasurePotion.DragonControl:
      return details.dragonControl !== undefined
        ? `potion of ${dragonControlLabel(
            details.dragonControl
          )} dragon control`
        : `potion of ${POTION_LABELS[details.potion]}`;
    case TreasurePotion.GiantControl:
      return details.giantControl !== undefined
        ? `potion of ${giantControlLabel(details.giantControl)} giant control`
        : `potion of ${POTION_LABELS[details.potion]}`;
    case TreasurePotion.GiantStrength:
      return details.giantStrength !== undefined
        ? `potion of ${giantStrengthLabel(
            details.giantStrength
          )} giant strength`
        : `potion of ${POTION_LABELS[details.potion]}`;
    case TreasurePotion.HumanControl:
      return details.humanControl !== undefined
        ? `potion of ${humanControlLabel(details.humanControl)} control`
        : `potion of ${POTION_LABELS[details.potion]}`;
    case TreasurePotion.UndeadControl:
      return details.undeadControl !== undefined
        ? `potion of ${undeadControlLabel(details.undeadControl)} control`
        : `potion of ${POTION_LABELS[details.potion]}`;
    default:
      return `potion of ${POTION_LABELS[details.potion]}`;
  }
}

function extractResolvedPotion(
  node: OutcomeEventNode
): TreasureBeakerPotionDetails {
  if (node.event.kind !== 'treasurePotion') {
    return { potion: TreasurePotion.Healing };
  }
  const details: TreasureBeakerPotionDetails = {
    potion: node.event.result,
  };
  if (node.event.result === TreasurePotion.AnimalControl) {
    const child = findChildEvent(node, 'treasurePotionAnimalControl');
    if (child && child.event.kind === 'treasurePotionAnimalControl') {
      details.animalControl = child.event.result;
    }
  } else if (node.event.result === TreasurePotion.DragonControl) {
    const child = findChildEvent(node, 'treasurePotionDragonControl');
    if (child && child.event.kind === 'treasurePotionDragonControl') {
      details.dragonControl = child.event.result;
    }
  } else if (node.event.result === TreasurePotion.GiantControl) {
    const child = findChildEvent(node, 'treasurePotionGiantControl');
    if (child && child.event.kind === 'treasurePotionGiantControl') {
      details.giantControl = child.event.result;
    }
  } else if (node.event.result === TreasurePotion.GiantStrength) {
    const child = findChildEvent(node, 'treasurePotionGiantStrength');
    if (child && child.event.kind === 'treasurePotionGiantStrength') {
      details.giantStrength = child.event.result;
    }
  } else if (node.event.result === TreasurePotion.HumanControl) {
    const child = findChildEvent(node, 'treasurePotionHumanControl');
    if (child && child.event.kind === 'treasurePotionHumanControl') {
      details.humanControl = child.event.result;
    }
  } else if (node.event.result === TreasurePotion.UndeadControl) {
    const child = findChildEvent(node, 'treasurePotionUndeadControl');
    if (child && child.event.kind === 'treasurePotionUndeadControl') {
      details.undeadControl = child.event.result;
    }
  }
  return details;
}

function giantControlSentence(result: TreasurePotionGiantControl): string {
  return `There is a potion of ${giantControlLabel(result)} giant control.`;
}

function giantControlLabel(result: TreasurePotionGiantControl): string {
  switch (result) {
    case TreasurePotionGiantControl.Hill:
      return 'hill';
    case TreasurePotionGiantControl.Stone:
      return 'stone';
    case TreasurePotionGiantControl.Frost:
      return 'frost';
    case TreasurePotionGiantControl.Fire:
      return 'fire';
    case TreasurePotionGiantControl.Cloud:
      return 'cloud';
    case TreasurePotionGiantControl.Storm:
      return 'storm';
    default:
      return 'giant';
  }
}

function giantStrengthSentence(result: TreasurePotionGiantStrength): string {
  return `There is a potion of ${giantStrengthLabel(result)} giant strength.`;
}

function giantStrengthLabel(result: TreasurePotionGiantStrength): string {
  switch (result) {
    case TreasurePotionGiantStrength.Hill:
      return 'hill';
    case TreasurePotionGiantStrength.Stone:
      return 'stone';
    case TreasurePotionGiantStrength.Frost:
      return 'frost';
    case TreasurePotionGiantStrength.Fire:
      return 'fire';
    case TreasurePotionGiantStrength.Cloud:
      return 'cloud';
    case TreasurePotionGiantStrength.Storm:
      return 'storm';
    default:
      return 'giant';
  }
}

function humanControlSentence(result: TreasurePotionHumanControl): string {
  return `There is a potion of ${humanControlLabel(result)} control.`;
}

function humanControlLabel(result: TreasurePotionHumanControl): string {
  switch (result) {
    case TreasurePotionHumanControl.Dwarves:
      return 'dwarf';
    case TreasurePotionHumanControl.ElvesHalfElves:
      return 'elf/half-elf';
    case TreasurePotionHumanControl.Gnomes:
      return 'gnome';
    case TreasurePotionHumanControl.Halflings:
      return 'halfling';
    case TreasurePotionHumanControl.HalfOrcs:
      return 'half-orc';
    case TreasurePotionHumanControl.Humans:
      return 'human (not demi-human or humanoid)';
    case TreasurePotionHumanControl.Humanoids:
      return 'humanoid (gnoll/orc/goblin/etc.)';
    case TreasurePotionHumanControl.AlliedElvesHumans:
      return 'elf/half-elf/human';
    default:
      return 'humanoid';
  }
}

function undeadControlSentence(result: TreasurePotionUndeadControl): string {
  return `There is a potion of ${undeadControlLabel(result)} control.`;
}

function undeadControlLabel(result: TreasurePotionUndeadControl): string {
  switch (result) {
    case TreasurePotionUndeadControl.Ghasts:
      return 'ghast';
    case TreasurePotionUndeadControl.Ghosts:
      return 'ghost';
    case TreasurePotionUndeadControl.Ghouls:
      return 'ghoul';
    case TreasurePotionUndeadControl.Shadows:
      return 'shadow';
    case TreasurePotionUndeadControl.Skeletons:
      return 'skeleton';
    case TreasurePotionUndeadControl.Spectres:
      return 'spectre';
    case TreasurePotionUndeadControl.Wights:
      return 'wight';
    case TreasurePotionUndeadControl.Wraiths:
      return 'wraith';
    case TreasurePotionUndeadControl.Vampires:
      return 'vampire';
    case TreasurePotionUndeadControl.Zombies:
      return 'zombie';
    default:
      return 'undead';
  }
}

import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasurePotion,
  TreasurePotion,
} from '../../../tables/dungeon/treasurePotions';
import {
  treasurePotionAnimalControl,
  TreasurePotionAnimalControl,
} from '../../../tables/dungeon/treasurePotionAnimalControl';
import {
  treasurePotionDragonControl,
  TreasurePotionDragonControl,
} from '../../../tables/dungeon/treasurePotionDragonControl';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export const POTION_LABELS: Record<TreasurePotion, string> = {
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

export function potionSentence(result: TreasurePotion): string {
  const label = POTION_LABELS[result];
  return `There is a potion of ${label}.`;
}

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
    text: resolvedPotionSentence(outcome),
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
    text: resolvedPotionSentence(outcome),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Potion',
    sides: treasurePotion.sides,
    entries: treasurePotion.entries.map((entry) => ({
      range: entry.range,
      label: TreasurePotion[entry.command] ?? String(entry.command),
    })),
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
    text: animalControlSentence(outcome.event.result),
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
    text: animalControlSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionAnimalControlPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Animal Control Target',
    sides: treasurePotionAnimalControl.sides,
    entries: treasurePotionAnimalControl.entries.map((entry) => ({
      range: entry.range,
      label: animalControlLabel(entry.command),
    })),
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
    text: dragonControlSentence(outcome.event.result),
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
    text: dragonControlSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePotionDragonControlPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Dragon Control Target',
    sides: treasurePotionDragonControl.sides,
    entries: treasurePotionDragonControl.entries.map((entry) => ({
      range: entry.range,
      label: dragonControlLabel(entry.command),
    })),
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
  if (node.event.result === TreasurePotion.AnimalControl) {
    const child = findChildEvent(node, 'treasurePotionAnimalControl');
    if (child && child.event.kind === 'treasurePotionAnimalControl') {
      return animalControlSentence(child.event.result);
    }
  } else if (node.event.result === TreasurePotion.DragonControl) {
    const child = findChildEvent(node, 'treasurePotionDragonControl');
    if (child && child.event.kind === 'treasurePotionDragonControl') {
      return dragonControlSentence(child.event.result);
    }
  }
  return potionSentence(node.event.result);
}

import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureArtifactOrRelic,
  TreasureArtifactOrRelic,
} from '../../../tables/dungeon/treasureArtifactOrRelic';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const ARTIFACT_LABELS: Record<TreasureArtifactOrRelic, string> = {
  [TreasureArtifactOrRelic.AxeOfTheDwarvishLords]: 'Axe of the Dwarvish Lords',
  [TreasureArtifactOrRelic.BabaYagasHut]: "Baba Yaga's Hut",
  [TreasureArtifactOrRelic.CodexOfTheInfinitePlanes]:
    'Codex of the Infinite Planes',
  [TreasureArtifactOrRelic.CrownOfMight]: 'Crown of Might',
  [TreasureArtifactOrRelic.CrystalOfTheEbonFlame]: 'Crystal of the Ebon Flame',
  [TreasureArtifactOrRelic.CupAndTalismanOfAlAkbar]:
    "Cup and Talisman of Al'Akbar",
  [TreasureArtifactOrRelic.EyeOfVecna]: 'Eye of Vecna',
  [TreasureArtifactOrRelic.HandOfVecna]: 'Hand of Vecna',
  [TreasureArtifactOrRelic.HewardsMysticalOrgan]: "Heward's Mystical Organ",
  [TreasureArtifactOrRelic.HornOfChange]: 'Horn of Change',
  [TreasureArtifactOrRelic.InvulnerableCoatOfArnd]: 'Invulnerable Coat of Arnd',
  [TreasureArtifactOrRelic.IronFlaskOfTuernyTheMerciless]:
    'Iron Flask of Tuerny the Merciless',
  [TreasureArtifactOrRelic.JacinthOfInestimableBeauty]:
    'Jacinth of Inestimable Beauty',
  [TreasureArtifactOrRelic.JohydeesMask]: "Johydee's Mask",
  [TreasureArtifactOrRelic.KurothsQuill]: "Kuroth's Quill",
  [TreasureArtifactOrRelic.MaceOfCuthbert]: 'Mace of Cuthbert',
  [TreasureArtifactOrRelic.MachineOfLumTheMad]: 'Machine of Lum the Mad',
  [TreasureArtifactOrRelic.MightyServantOfLeukO]: 'Mighty Servant of Leuk-O',
  [TreasureArtifactOrRelic.OrbOfTheDragonkind]: 'Orb of the Dragonkind',
  [TreasureArtifactOrRelic.OrbOfMight]: 'Orb of Might',
  [TreasureArtifactOrRelic.QueenEhlissasMarvelousNightingale]:
    "Queen Ehlissa's Marvelous Nightingale",
  [TreasureArtifactOrRelic.RecorderOfYeCind]: "Recorder of Ye'Cind",
  [TreasureArtifactOrRelic.RingOfGaxx]: 'Ring of Gaxx',
  [TreasureArtifactOrRelic.RodOfSevenParts]: 'Rod of Seven Parts',
  [TreasureArtifactOrRelic.SceptreOfMight]: 'Sceptre of Might',
  [TreasureArtifactOrRelic.SwordOfKas]: 'Sword of Kas',
  [TreasureArtifactOrRelic.TeethOfDahlverNar]: 'Teeth of Dahlver-Nar',
  [TreasureArtifactOrRelic.ThroneOfTheGods]: 'Throne of the Gods',
  [TreasureArtifactOrRelic.WandOfOrcus]: 'Wand of Orcus',
};

export function renderTreasureArtifactOrRelicDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureArtifactOrRelic') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Artifact or Relic',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${ARTIFACT_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: artifactSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureArtifactOrRelicCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureArtifactOrRelic') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Artifact or Relic',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: artifactSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureArtifactOrRelicPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Artifact or Relic',
    sides: treasureArtifactOrRelic.sides,
    entries: treasureArtifactOrRelic.entries.map(({ range, command }) => ({
      range,
      label: labelForArtifact(command),
    })),
  });

export function artifactSentence(result: TreasureArtifactOrRelic): string {
  return `There is ${articleForArtifact(result)} ${labelForArtifact(result)}.`;
}

export function labelForArtifact(result: TreasureArtifactOrRelic): string {
  return ARTIFACT_LABELS[result];
}

function articleForArtifact(result: TreasureArtifactOrRelic): string {
  const label = ARTIFACT_LABELS[result];
  const first = label[0]?.toLowerCase() ?? 'a';
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

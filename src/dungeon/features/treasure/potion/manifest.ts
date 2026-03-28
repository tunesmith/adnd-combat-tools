import type { DungeonTableDefinition } from '../../types';
import { defineTreasureMagicTable } from '../shared';
import {
  buildTreasurePotionAnimalControlPreview,
  buildTreasurePotionDragonControlPreview,
  buildTreasurePotionGiantControlPreview,
  buildTreasurePotionGiantStrengthPreview,
  buildTreasurePotionHumanControlPreview,
  buildTreasurePotionPreview,
  buildTreasurePotionUndeadControlPreview,
  renderTreasurePotionAnimalControlCompact,
  renderTreasurePotionAnimalControlDetail,
  renderTreasurePotionCompact,
  renderTreasurePotionDetail,
  renderTreasurePotionDragonControlCompact,
  renderTreasurePotionDragonControlDetail,
  renderTreasurePotionGiantControlCompact,
  renderTreasurePotionGiantControlDetail,
  renderTreasurePotionGiantStrengthCompact,
  renderTreasurePotionGiantStrengthDetail,
  renderTreasurePotionHumanControlCompact,
  renderTreasurePotionHumanControlDetail,
  renderTreasurePotionUndeadControlCompact,
  renderTreasurePotionUndeadControlDetail,
} from './potionRender';
import {
  resolveTreasurePotion,
  resolveTreasurePotionAnimalControl,
  resolveTreasurePotionDragonControl,
  resolveTreasurePotionGiantControl,
  resolveTreasurePotionGiantStrength,
  resolveTreasurePotionHumanControl,
  resolveTreasurePotionUndeadControl,
} from './potionResolvers';
import { TreasurePotion } from './potionTables';

const potionFollowups = [
  {
    result: TreasurePotion.AnimalControl,
    table: 'treasurePotionAnimalControl',
  },
  {
    result: TreasurePotion.DragonControl,
    table: 'treasurePotionDragonControl',
  },
  {
    result: TreasurePotion.GiantControl,
    table: 'treasurePotionGiantControl',
  },
  {
    result: TreasurePotion.GiantStrength,
    table: 'treasurePotionGiantStrength',
  },
  {
    result: TreasurePotion.HumanControl,
    table: 'treasurePotionHumanControl',
  },
  {
    result: TreasurePotion.UndeadControl,
    table: 'treasurePotionUndeadControl',
  },
] as const;

export const potionTables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasurePotion',
    heading: 'Potion',
    event: 'treasurePotion',
    resolve: resolveTreasurePotion,
    render: {
      detail: renderTreasurePotionDetail,
      compact: renderTreasurePotionCompact,
    },
    preview: buildTreasurePotionPreview,
    followups: potionFollowups,
  }),
  defineTreasureMagicTable({
    id: 'treasurePotionAnimalControl',
    heading: 'Animal Control Target',
    event: 'treasurePotionAnimalControl',
    resolve: resolveTreasurePotionAnimalControl,
    render: {
      detail: renderTreasurePotionAnimalControlDetail,
      compact: renderTreasurePotionAnimalControlCompact,
    },
    preview: buildTreasurePotionAnimalControlPreview,
  }),
  defineTreasureMagicTable({
    id: 'treasurePotionDragonControl',
    heading: 'Dragon Control Target',
    event: 'treasurePotionDragonControl',
    resolve: resolveTreasurePotionDragonControl,
    render: {
      detail: renderTreasurePotionDragonControlDetail,
      compact: renderTreasurePotionDragonControlCompact,
    },
    preview: buildTreasurePotionDragonControlPreview,
  }),
  defineTreasureMagicTable({
    id: 'treasurePotionGiantControl',
    heading: 'Giant Control Target',
    event: 'treasurePotionGiantControl',
    resolve: resolveTreasurePotionGiantControl,
    render: {
      detail: renderTreasurePotionGiantControlDetail,
      compact: renderTreasurePotionGiantControlCompact,
    },
    preview: buildTreasurePotionGiantControlPreview,
  }),
  defineTreasureMagicTable({
    id: 'treasurePotionGiantStrength',
    heading: 'Giant Strength Target',
    event: 'treasurePotionGiantStrength',
    resolve: resolveTreasurePotionGiantStrength,
    render: {
      detail: renderTreasurePotionGiantStrengthDetail,
      compact: renderTreasurePotionGiantStrengthCompact,
    },
    preview: buildTreasurePotionGiantStrengthPreview,
  }),
  defineTreasureMagicTable({
    id: 'treasurePotionHumanControl',
    heading: 'Human Control Target',
    event: 'treasurePotionHumanControl',
    resolve: resolveTreasurePotionHumanControl,
    render: {
      detail: renderTreasurePotionHumanControlDetail,
      compact: renderTreasurePotionHumanControlCompact,
    },
    preview: buildTreasurePotionHumanControlPreview,
  }),
  defineTreasureMagicTable({
    id: 'treasurePotionUndeadControl',
    heading: 'Undead Control Target',
    event: 'treasurePotionUndeadControl',
    resolve: resolveTreasurePotionUndeadControl,
    render: {
      detail: renderTreasurePotionUndeadControlDetail,
      compact: renderTreasurePotionUndeadControlCompact,
    },
    preview: buildTreasurePotionUndeadControlPreview,
  }),
];

import type { DungeonTableDefinition } from '../../types';
import { createTreasureMagicContextHandlers } from '../shared';
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

type PotionResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export const potionTables: ReadonlyArray<
  DungeonTableDefinition<PotionResolverOptions>
> = [
  {
    id: 'treasurePotion',
    heading: 'Potion',
    resolver: resolveTreasurePotion,
    ...createTreasureMagicContextHandlers(resolveTreasurePotion),
    renderers: {
      renderDetail: renderTreasurePotionDetail,
      renderCompact: renderTreasurePotionCompact,
    },
    buildPreview: buildTreasurePotionPreview,
  },
  {
    id: 'treasurePotionAnimalControl',
    heading: 'Animal Control Target',
    resolver: resolveTreasurePotionAnimalControl,
    ...createTreasureMagicContextHandlers(resolveTreasurePotionAnimalControl),
    renderers: {
      renderDetail: renderTreasurePotionAnimalControlDetail,
      renderCompact: renderTreasurePotionAnimalControlCompact,
    },
    buildPreview: buildTreasurePotionAnimalControlPreview,
  },
  {
    id: 'treasurePotionDragonControl',
    heading: 'Dragon Control Target',
    resolver: resolveTreasurePotionDragonControl,
    ...createTreasureMagicContextHandlers(resolveTreasurePotionDragonControl),
    renderers: {
      renderDetail: renderTreasurePotionDragonControlDetail,
      renderCompact: renderTreasurePotionDragonControlCompact,
    },
    buildPreview: buildTreasurePotionDragonControlPreview,
  },
  {
    id: 'treasurePotionGiantControl',
    heading: 'Giant Control Target',
    resolver: resolveTreasurePotionGiantControl,
    ...createTreasureMagicContextHandlers(resolveTreasurePotionGiantControl),
    renderers: {
      renderDetail: renderTreasurePotionGiantControlDetail,
      renderCompact: renderTreasurePotionGiantControlCompact,
    },
    buildPreview: buildTreasurePotionGiantControlPreview,
  },
  {
    id: 'treasurePotionGiantStrength',
    heading: 'Giant Strength Target',
    resolver: resolveTreasurePotionGiantStrength,
    ...createTreasureMagicContextHandlers(resolveTreasurePotionGiantStrength),
    renderers: {
      renderDetail: renderTreasurePotionGiantStrengthDetail,
      renderCompact: renderTreasurePotionGiantStrengthCompact,
    },
    buildPreview: buildTreasurePotionGiantStrengthPreview,
  },
  {
    id: 'treasurePotionHumanControl',
    heading: 'Human Control Target',
    resolver: resolveTreasurePotionHumanControl,
    ...createTreasureMagicContextHandlers(resolveTreasurePotionHumanControl),
    renderers: {
      renderDetail: renderTreasurePotionHumanControlDetail,
      renderCompact: renderTreasurePotionHumanControlCompact,
    },
    buildPreview: buildTreasurePotionHumanControlPreview,
  },
  {
    id: 'treasurePotionUndeadControl',
    heading: 'Undead Control Target',
    resolver: resolveTreasurePotionUndeadControl,
    ...createTreasureMagicContextHandlers(resolveTreasurePotionUndeadControl),
    renderers: {
      renderDetail: renderTreasurePotionUndeadControlDetail,
      renderCompact: renderTreasurePotionUndeadControlCompact,
    },
    buildPreview: buildTreasurePotionUndeadControlPreview,
  },
];

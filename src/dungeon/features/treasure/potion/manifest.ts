import type { DungeonTableDefinition } from '../../types';
import { readTreasureMagicContext } from '../shared';
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

type TreasureRegistryContext = {
  kind?: string;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

type PotionResolverOptions = {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

function readTreasureContext(context?: TreasureRegistryContext): {
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
} {
  if (context?.kind !== 'treasureMagic') return {};
  return {
    level: context.level,
    treasureRoll: context.treasureRoll,
    rollIndex: context.rollIndex,
  };
}

export const potionTables: ReadonlyArray<
  DungeonTableDefinition<PotionResolverOptions>
> = [
  {
    id: 'treasurePotion',
    heading: 'Potion',
    resolver: resolveTreasurePotion,
    renderers: {
      renderDetail: renderTreasurePotionDetail,
      renderCompact: renderTreasurePotionCompact,
    },
    buildPreview: buildTreasurePotionPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasurePotion({ roll, level, treasureRoll, rollIndex });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotion(context);
    },
  },
  {
    id: 'treasurePotionAnimalControl',
    heading: 'Animal Control Target',
    resolver: resolveTreasurePotionAnimalControl,
    renderers: {
      renderDetail: renderTreasurePotionAnimalControlDetail,
      renderCompact: renderTreasurePotionAnimalControlCompact,
    },
    buildPreview: buildTreasurePotionAnimalControlPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasurePotionAnimalControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionAnimalControl(context);
    },
  },
  {
    id: 'treasurePotionDragonControl',
    heading: 'Dragon Control Target',
    resolver: resolveTreasurePotionDragonControl,
    renderers: {
      renderDetail: renderTreasurePotionDragonControlDetail,
      renderCompact: renderTreasurePotionDragonControlCompact,
    },
    buildPreview: buildTreasurePotionDragonControlPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasurePotionDragonControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionDragonControl(context);
    },
  },
  {
    id: 'treasurePotionGiantControl',
    heading: 'Giant Control Target',
    resolver: resolveTreasurePotionGiantControl,
    renderers: {
      renderDetail: renderTreasurePotionGiantControlDetail,
      renderCompact: renderTreasurePotionGiantControlCompact,
    },
    buildPreview: buildTreasurePotionGiantControlPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasurePotionGiantControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionGiantControl(context);
    },
  },
  {
    id: 'treasurePotionGiantStrength',
    heading: 'Giant Strength Target',
    resolver: resolveTreasurePotionGiantStrength,
    renderers: {
      renderDetail: renderTreasurePotionGiantStrengthDetail,
      renderCompact: renderTreasurePotionGiantStrengthCompact,
    },
    buildPreview: buildTreasurePotionGiantStrengthPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasurePotionGiantStrength({
        roll,
        level,
        treasureRoll,
        rollIndex,
      });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionGiantStrength(context);
    },
  },
  {
    id: 'treasurePotionHumanControl',
    heading: 'Human Control Target',
    resolver: resolveTreasurePotionHumanControl,
    renderers: {
      renderDetail: renderTreasurePotionHumanControlDetail,
      renderCompact: renderTreasurePotionHumanControlCompact,
    },
    buildPreview: buildTreasurePotionHumanControlPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasurePotionHumanControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionHumanControl(context);
    },
  },
  {
    id: 'treasurePotionUndeadControl',
    heading: 'Undead Control Target',
    resolver: resolveTreasurePotionUndeadControl,
    renderers: {
      renderDetail: renderTreasurePotionUndeadControlDetail,
      renderCompact: renderTreasurePotionUndeadControlCompact,
    },
    buildPreview: buildTreasurePotionUndeadControlPreview,
    registry: ({ roll, context }) => {
      const { level, treasureRoll, rollIndex } = readTreasureContext(context);
      return resolveTreasurePotionUndeadControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      });
    },
    resolvePending: (pending, ancestors) => {
      const context = readTreasureMagicContext(pending.context, ancestors);
      return resolveTreasurePotionUndeadControl(context);
    },
  },
];

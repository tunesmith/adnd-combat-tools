import type { DungeonTableDefinition } from '../../types';
import { buildEventPreviewFromFactory, wrapResolver } from '../../shared';
import {
  createTreasureMagicContextHandlers,
  createTreasureMagicEventPreviewBuilder,
} from '../shared';
import {
  buildTreasureMiscMagicE3Preview,
  renderTreasureMiscMagicE3Compact,
  renderTreasureMiscMagicE3Detail,
} from './miscMagicE3Render';
import {
  buildTreasureFigurineMarbleElephantPreview,
  buildTreasureFigurineOfWondrousPowerPreview,
  buildTreasureGirdleOfGiantStrengthPreview,
  buildTreasureHornOfValhallaAlignmentPreview,
  buildTreasureHornOfValhallaAttunementPreview,
  buildTreasureHornOfValhallaTypePreview,
  buildTreasureInstrumentOfTheBardsPreview,
  buildTreasureIronFlaskPreview,
  renderTreasureFigurineMarbleElephantCompact,
  renderTreasureFigurineMarbleElephantDetail,
  renderTreasureFigurineOfWondrousPowerCompact,
  renderTreasureFigurineOfWondrousPowerDetail,
  renderTreasureGirdleOfGiantStrengthCompact,
  renderTreasureGirdleOfGiantStrengthDetail,
  renderTreasureHornOfValhallaAlignmentCompact,
  renderTreasureHornOfValhallaAlignmentDetail,
  renderTreasureHornOfValhallaAttunementCompact,
  renderTreasureHornOfValhallaAttunementDetail,
  renderTreasureHornOfValhallaTypeCompact,
  renderTreasureHornOfValhallaTypeDetail,
  renderTreasureInstrumentOfTheBardsCompact,
  renderTreasureInstrumentOfTheBardsDetail,
  renderTreasureIounStonesCompact,
  renderTreasureIounStonesDetail,
  renderTreasureIronFlaskCompact,
  renderTreasureIronFlaskDetail,
} from './miscMagicE3SubtablesRender';
import {
  resolveTreasureFigurineMarbleElephant,
  resolveTreasureFigurineOfWondrousPower,
  resolveTreasureGirdleOfGiantStrength,
  resolveTreasureHornOfValhallaAlignment,
  resolveTreasureHornOfValhallaAttunement,
  resolveTreasureHornOfValhallaType,
  resolveTreasureInstrumentOfTheBards,
  resolveTreasureIounStones,
  resolveTreasureIronFlask,
  resolveTreasureMiscMagicE3,
} from './miscMagicE3Resolvers';

export const miscMagicE3Tables: ReadonlyArray<DungeonTableDefinition> = [
  {
    id: 'treasureMiscMagicE3',
    heading: 'Miscellaneous Magic (Table E.3)',
    resolver: wrapResolver(resolveTreasureMiscMagicE3),
    ...createTreasureMagicContextHandlers(resolveTreasureMiscMagicE3),
    renderers: {
      renderDetail: renderTreasureMiscMagicE3Detail,
      renderCompact: renderTreasureMiscMagicE3Compact,
    },
    buildPreview: buildTreasureMiscMagicE3Preview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureMiscMagicE3',
      buildTreasureMiscMagicE3Preview
    ),
  },
  {
    id: 'treasureFigurineOfWondrousPower',
    heading: 'Figurine of Wondrous Power',
    resolver: wrapResolver(resolveTreasureFigurineOfWondrousPower),
    ...createTreasureMagicContextHandlers(
      resolveTreasureFigurineOfWondrousPower
    ),
    renderers: {
      renderDetail: renderTreasureFigurineOfWondrousPowerDetail,
      renderCompact: renderTreasureFigurineOfWondrousPowerCompact,
    },
    buildPreview: buildTreasureFigurineOfWondrousPowerPreview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureFigurineOfWondrousPower',
      buildTreasureFigurineOfWondrousPowerPreview
    ),
  },
  {
    id: 'treasureFigurineMarbleElephant',
    heading: 'Marble Elephant Form',
    resolver: wrapResolver(resolveTreasureFigurineMarbleElephant),
    renderers: {
      renderDetail: renderTreasureFigurineMarbleElephantDetail,
      renderCompact: renderTreasureFigurineMarbleElephantCompact,
    },
    buildPreview: buildTreasureFigurineMarbleElephantPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureFigurineMarbleElephant'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureFigurineMarbleElephantPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureFigurineMarbleElephant({}),
  },
  {
    id: 'treasureGirdleOfGiantStrength',
    heading: 'Giant Strength Type',
    resolver: wrapResolver(resolveTreasureGirdleOfGiantStrength),
    renderers: {
      renderDetail: renderTreasureGirdleOfGiantStrengthDetail,
      renderCompact: renderTreasureGirdleOfGiantStrengthCompact,
    },
    buildPreview: buildTreasureGirdleOfGiantStrengthPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureGirdleOfGiantStrength'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureGirdleOfGiantStrengthPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureGirdleOfGiantStrength({}),
  },
  {
    id: 'treasureInstrumentOfTheBards',
    heading: 'Instrument of the Bards',
    resolver: wrapResolver(resolveTreasureInstrumentOfTheBards),
    renderers: {
      renderDetail: renderTreasureInstrumentOfTheBardsDetail,
      renderCompact: renderTreasureInstrumentOfTheBardsCompact,
    },
    buildPreview: buildTreasureInstrumentOfTheBardsPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureInstrumentOfTheBards'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureInstrumentOfTheBardsPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureInstrumentOfTheBards({}),
  },
  {
    id: 'treasureIronFlask',
    heading: 'Iron Flask Contents',
    resolver: wrapResolver(resolveTreasureIronFlask),
    renderers: {
      renderDetail: renderTreasureIronFlaskDetail,
      renderCompact: renderTreasureIronFlaskCompact,
    },
    buildPreview: buildTreasureIronFlaskPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureIronFlask'
        ? buildEventPreviewFromFactory(node, buildTreasureIronFlaskPreview)
        : undefined,
    resolvePending: () => resolveTreasureIronFlask({}),
  },
  {
    id: 'treasureIounStones',
    heading: 'Ioun Stones',
    resolver: wrapResolver(resolveTreasureIounStones),
    renderers: {
      renderDetail: renderTreasureIounStonesDetail,
      renderCompact: renderTreasureIounStonesCompact,
    },
    resolvePending: () => resolveTreasureIounStones({}),
    registry: ({ roll }) => resolveTreasureIounStones({ roll }),
  },
  {
    id: 'treasureHornOfValhallaType',
    heading: 'Horn Type',
    resolver: wrapResolver(resolveTreasureHornOfValhallaType),
    ...createTreasureMagicContextHandlers(resolveTreasureHornOfValhallaType),
    renderers: {
      renderDetail: renderTreasureHornOfValhallaTypeDetail,
      renderCompact: renderTreasureHornOfValhallaTypeCompact,
    },
    buildPreview: buildTreasureHornOfValhallaTypePreview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureHornOfValhallaType',
      buildTreasureHornOfValhallaTypePreview
    ),
  },
  {
    id: 'treasureHornOfValhallaAttunement',
    heading: 'Attunement',
    resolver: wrapResolver(resolveTreasureHornOfValhallaAttunement),
    ...createTreasureMagicContextHandlers(
      resolveTreasureHornOfValhallaAttunement
    ),
    renderers: {
      renderDetail: renderTreasureHornOfValhallaAttunementDetail,
      renderCompact: renderTreasureHornOfValhallaAttunementCompact,
    },
    buildPreview: buildTreasureHornOfValhallaAttunementPreview,
    buildEventPreview: createTreasureMagicEventPreviewBuilder(
      'treasureHornOfValhallaAttunement',
      buildTreasureHornOfValhallaAttunementPreview
    ),
  },
  {
    id: 'treasureHornOfValhallaAlignment',
    heading: 'Alignment',
    resolver: wrapResolver(resolveTreasureHornOfValhallaAlignment),
    renderers: {
      renderDetail: renderTreasureHornOfValhallaAlignmentDetail,
      renderCompact: renderTreasureHornOfValhallaAlignmentCompact,
    },
    buildPreview: buildTreasureHornOfValhallaAlignmentPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'treasureHornOfValhallaAlignment'
        ? buildEventPreviewFromFactory(
            node,
            buildTreasureHornOfValhallaAlignmentPreview
          )
        : undefined,
    resolvePending: () => resolveTreasureHornOfValhallaAlignment({}),
  },
];

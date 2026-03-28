import type { DungeonTableDefinition } from '../../types';
import {
  defineTreasureFollowupTable,
  defineTreasureMagicTable,
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
import { miscMagicE3Followups } from './miscMagicE3Table';
import {
  figurineOfWondrousPowerFollowups,
  hornOfValhallaAttunementFollowups,
  hornOfValhallaTypeFollowups,
} from './miscMagicE3Subtables';

export const miscMagicE3Tables: ReadonlyArray<DungeonTableDefinition> = [
  defineTreasureMagicTable({
    id: 'treasureMiscMagicE3',
    heading: 'Miscellaneous Magic (Table E.3)',
    event: 'treasureMiscMagicE3',
    resolve: resolveTreasureMiscMagicE3,
    render: {
      detail: renderTreasureMiscMagicE3Detail,
      compact: renderTreasureMiscMagicE3Compact,
    },
    preview: buildTreasureMiscMagicE3Preview,
    followups: miscMagicE3Followups,
  }),
  defineTreasureMagicTable({
    id: 'treasureFigurineOfWondrousPower',
    heading: 'Figurine of Wondrous Power',
    event: 'treasureFigurineOfWondrousPower',
    resolve: resolveTreasureFigurineOfWondrousPower,
    render: {
      detail: renderTreasureFigurineOfWondrousPowerDetail,
      compact: renderTreasureFigurineOfWondrousPowerCompact,
    },
    preview: buildTreasureFigurineOfWondrousPowerPreview,
    followups: figurineOfWondrousPowerFollowups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureFigurineMarbleElephant',
    heading: 'Marble Elephant Form',
    event: 'treasureFigurineMarbleElephant',
    resolve: resolveTreasureFigurineMarbleElephant,
    render: {
      detail: renderTreasureFigurineMarbleElephantDetail,
      compact: renderTreasureFigurineMarbleElephantCompact,
    },
    preview: buildTreasureFigurineMarbleElephantPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureGirdleOfGiantStrength',
    heading: 'Giant Strength Type',
    event: 'treasureGirdleOfGiantStrength',
    resolve: resolveTreasureGirdleOfGiantStrength,
    render: {
      detail: renderTreasureGirdleOfGiantStrengthDetail,
      compact: renderTreasureGirdleOfGiantStrengthCompact,
    },
    preview: buildTreasureGirdleOfGiantStrengthPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureInstrumentOfTheBards',
    heading: 'Instrument of the Bards',
    event: 'treasureInstrumentOfTheBards',
    resolve: resolveTreasureInstrumentOfTheBards,
    render: {
      detail: renderTreasureInstrumentOfTheBardsDetail,
      compact: renderTreasureInstrumentOfTheBardsCompact,
    },
    preview: buildTreasureInstrumentOfTheBardsPreview,
  }),
  defineTreasureFollowupTable({
    id: 'treasureIronFlask',
    heading: 'Iron Flask Contents',
    event: 'treasureIronFlask',
    resolve: resolveTreasureIronFlask,
    render: {
      detail: renderTreasureIronFlaskDetail,
      compact: renderTreasureIronFlaskCompact,
    },
    preview: buildTreasureIronFlaskPreview,
  }),
  {
    id: 'treasureIounStones',
    heading: 'Ioun Stones',
    resolver: resolveTreasureIounStones,
    renderers: {
      renderDetail: renderTreasureIounStonesDetail,
      renderCompact: renderTreasureIounStonesCompact,
    },
    resolvePending: () => resolveTreasureIounStones({}),
    registry: ({ roll }) => resolveTreasureIounStones({ roll }),
  },
  defineTreasureMagicTable({
    id: 'treasureHornOfValhallaType',
    heading: 'Horn Type',
    event: 'treasureHornOfValhallaType',
    resolve: resolveTreasureHornOfValhallaType,
    render: {
      detail: renderTreasureHornOfValhallaTypeDetail,
      compact: renderTreasureHornOfValhallaTypeCompact,
    },
    preview: buildTreasureHornOfValhallaTypePreview,
    followups: hornOfValhallaTypeFollowups,
  }),
  defineTreasureMagicTable({
    id: 'treasureHornOfValhallaAttunement',
    heading: 'Attunement',
    event: 'treasureHornOfValhallaAttunement',
    resolve: resolveTreasureHornOfValhallaAttunement,
    render: {
      detail: renderTreasureHornOfValhallaAttunementDetail,
      compact: renderTreasureHornOfValhallaAttunementCompact,
    },
    preview: buildTreasureHornOfValhallaAttunementPreview,
    followups: hornOfValhallaAttunementFollowups,
  }),
  defineTreasureFollowupTable({
    id: 'treasureHornOfValhallaAlignment',
    heading: 'Alignment',
    event: 'treasureHornOfValhallaAlignment',
    resolve: resolveTreasureHornOfValhallaAlignment,
    render: {
      detail: renderTreasureHornOfValhallaAlignmentDetail,
      compact: renderTreasureHornOfValhallaAlignmentCompact,
    },
    preview: buildTreasureHornOfValhallaAlignmentPreview,
  }),
];

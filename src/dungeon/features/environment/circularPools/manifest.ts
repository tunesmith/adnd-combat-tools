import type { DungeonTableDefinition } from '../../types';
import { defineRollOnlyTable, withoutAppend } from '../../shared';
import {
  buildEnvironmentWanderingLevelContext,
  defineEnvironmentLevelTable,
} from '../shared';
import {
  resolveCircularContents,
  resolveCircularMagicPool,
  resolveCircularPool,
  resolvePoolAlignment,
  resolveTransporterLocation,
  resolveTransmuteType,
} from './circularPoolsResolvers';
import {
  buildCircularContentsPreview,
  buildCircularMagicPoolPreview,
  buildCircularPoolPreview,
  buildPoolAlignmentPreview,
  buildTransporterLocationPreview,
  buildTransmuteTypePreview,
  renderCircularContentsCompact,
  renderCircularContentsDetail,
  renderCircularMagicPoolCompact,
  renderCircularMagicPoolDetail,
  renderCircularPoolCompact,
  renderCircularPoolDetail,
  renderPoolAlignmentCompact,
  renderPoolAlignmentDetail,
  renderTransporterLocationCompact,
  renderTransporterLocationDetail,
  renderTransmuteTypeCompact,
  renderTransmuteTypeDetail,
} from './circularPoolsRender';

export const circularPoolsTables: ReadonlyArray<DungeonTableDefinition> = [
  defineEnvironmentLevelTable({
    id: 'circularContents',
    heading: 'Circular Contents',
    event: 'circularContents',
    resolve: resolveCircularContents,
    render: {
      detail: renderCircularContentsDetail,
      compact: renderCircularContentsCompact,
    },
    preview: buildCircularContentsPreview,
    fallbackLevel: 1,
    buildEventContext: buildEnvironmentWanderingLevelContext,
  }),
  defineEnvironmentLevelTable({
    id: 'circularPool',
    heading: 'Pool',
    event: 'circularPool',
    resolve: resolveCircularPool,
    render: {
      detail: renderCircularPoolDetail,
      compact: renderCircularPoolCompact,
    },
    preview: buildCircularPoolPreview,
    fallbackLevel: 1,
    buildEventContext: buildEnvironmentWanderingLevelContext,
  }),
  defineRollOnlyTable({
    id: 'circularMagicPool',
    heading: 'Magic Pool Effect',
    event: 'circularMagicPool',
    resolve: resolveCircularMagicPool,
    render: {
      detail: renderCircularMagicPoolDetail,
      compact: renderCircularMagicPoolCompact,
    },
    preview: buildCircularMagicPoolPreview,
  }),
  defineRollOnlyTable({
    id: 'transmuteType',
    heading: 'Transmutation Type',
    event: 'transmuteType',
    resolve: resolveTransmuteType,
    render: {
      detail: renderTransmuteTypeDetail,
      compact: withoutAppend(renderTransmuteTypeCompact),
    },
    preview: buildTransmuteTypePreview,
  }),
  defineRollOnlyTable({
    id: 'poolAlignment',
    heading: 'Pool Alignment',
    event: 'poolAlignment',
    resolve: resolvePoolAlignment,
    render: {
      detail: renderPoolAlignmentDetail,
      compact: withoutAppend(renderPoolAlignmentCompact),
    },
    preview: buildPoolAlignmentPreview,
  }),
  defineRollOnlyTable({
    id: 'transporterLocation',
    heading: 'Transporter Location',
    event: 'transporterLocation',
    resolve: resolveTransporterLocation,
    render: {
      detail: renderTransporterLocationDetail,
      compact: withoutAppend(renderTransporterLocationCompact),
    },
    preview: buildTransporterLocationPreview,
  }),
];

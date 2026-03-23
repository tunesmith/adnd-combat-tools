import type { DungeonTableDefinition } from '../../types';
import {
  buildEventPreviewFromFactory,
  withoutAppend,
  wrapResolver,
} from '../../shared';
import {
  buildEnvironmentWanderingLevelContext,
  createEnvironmentDungeonLevelContextHandlers,
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

const circularContentsContextHandlers =
  createEnvironmentDungeonLevelContextHandlers(resolveCircularContents, 1);
const circularPoolContextHandlers =
  createEnvironmentDungeonLevelContextHandlers(resolveCircularPool, 1);

export const circularPoolsTables: ReadonlyArray<DungeonTableDefinition> = [
  {
    ...circularContentsContextHandlers,
    id: 'circularContents',
    heading: 'Circular Contents',
    resolver: wrapResolver(resolveCircularContents),
    renderers: {
      renderDetail: renderCircularContentsDetail,
      renderCompact: renderCircularContentsCompact,
    },
    buildPreview: buildCircularContentsPreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'circularContents'
        ? buildEventPreviewFromFactory(node, buildCircularContentsPreview, {
            context: buildEnvironmentWanderingLevelContext(node, ancestors),
          })
        : undefined,
  },
  {
    ...circularPoolContextHandlers,
    id: 'circularPool',
    heading: 'Pool',
    resolver: wrapResolver(resolveCircularPool),
    renderers: {
      renderDetail: renderCircularPoolDetail,
      renderCompact: renderCircularPoolCompact,
    },
    buildPreview: buildCircularPoolPreview,
    buildEventPreview: (node, ancestors) =>
      node.event.kind === 'circularPool'
        ? buildEventPreviewFromFactory(node, buildCircularPoolPreview, {
            context: buildEnvironmentWanderingLevelContext(node, ancestors),
          })
        : undefined,
  },
  {
    id: 'circularMagicPool',
    heading: 'Magic Pool Effect',
    resolver: wrapResolver(resolveCircularMagicPool),
    renderers: {
      renderDetail: renderCircularMagicPoolDetail,
      renderCompact: renderCircularMagicPoolCompact,
    },
    buildPreview: buildCircularMagicPoolPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'circularMagicPool'
        ? buildEventPreviewFromFactory(node, buildCircularMagicPoolPreview)
        : undefined,
    resolvePending: () => resolveCircularMagicPool({}),
  },
  {
    id: 'transmuteType',
    heading: 'Transmutation Type',
    resolver: wrapResolver(resolveTransmuteType),
    renderers: {
      renderDetail: renderTransmuteTypeDetail,
      renderCompact: withoutAppend(renderTransmuteTypeCompact),
    },
    buildPreview: buildTransmuteTypePreview,
    buildEventPreview: (node) =>
      node.event.kind === 'transmuteType'
        ? buildEventPreviewFromFactory(node, buildTransmuteTypePreview)
        : undefined,
    resolvePending: () => resolveTransmuteType({}),
  },
  {
    id: 'poolAlignment',
    heading: 'Pool Alignment',
    resolver: wrapResolver(resolvePoolAlignment),
    renderers: {
      renderDetail: renderPoolAlignmentDetail,
      renderCompact: withoutAppend(renderPoolAlignmentCompact),
    },
    buildPreview: buildPoolAlignmentPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'poolAlignment'
        ? buildEventPreviewFromFactory(node, buildPoolAlignmentPreview)
        : undefined,
    resolvePending: () => resolvePoolAlignment({}),
  },
  {
    id: 'transporterLocation',
    heading: 'Transporter Location',
    resolver: wrapResolver(resolveTransporterLocation),
    renderers: {
      renderDetail: renderTransporterLocationDetail,
      renderCompact: withoutAppend(renderTransporterLocationCompact),
    },
    buildPreview: buildTransporterLocationPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'transporterLocation'
        ? buildEventPreviewFromFactory(node, buildTransporterLocationPreview)
        : undefined,
    resolvePending: () => resolveTransporterLocation({}),
  },
];

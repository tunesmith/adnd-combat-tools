import type { DungeonTableDefinition } from '../../types';
import type { DoorChainLaterality } from '../../../domain/outcome';
import { NO_COMPACT_RENDER } from '../shared';
import {
  buildEventPreviewFromFactory,
  markContextualResolution,
  wrapResolver,
} from '../../shared';
import {
  buildDoorLocationPreview,
  buildPeriodicDoorOnlyPreview,
  renderDoorLocationDetail,
  renderPeriodicDoorOnlyDetail,
} from './doorChainRender';
import {
  resolveDoorLocation,
  resolvePeriodicDoorOnly,
} from './doorChainResolvers';
import { DoorLocation } from './doorChainTable';
import type { OutcomeEventNode } from '../../../domain/outcome';

export const doorChainTables: ReadonlyArray<DungeonTableDefinition> = [
  markContextualResolution({
    id: 'periodicCheckDoorOnly',
    heading: 'Periodic Check (doors only)',
    resolver: wrapResolver(resolvePeriodicDoorOnly),
    renderers: {
      renderDetail: renderPeriodicDoorOnlyDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildPeriodicDoorOnlyPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'periodicCheckDoorOnly'
        ? buildEventPreviewFromFactory(node, buildPeriodicDoorOnlyPreview, {
            tableId: `periodicCheckDoorOnly:${node.event.sequence}`,
          })
        : undefined,
    registry: ({ roll, doorChain, id }) => {
      const existing = (doorChain?.existing as DoorChainLaterality[]) ?? [];
      const sequence =
        doorChain?.sequence ?? parseDoorChainSequence(id, existing.length);
      return resolvePeriodicDoorOnly({ roll, existing, sequence });
    },
    resolvePending: (pending, ancestors) => {
      const existing = collectDoorChainExisting(ancestors);
      const sequence = parseDoorChainSequence(pending.table, existing.length);
      return resolvePeriodicDoorOnly({ existing, sequence });
    },
  }),
  markContextualResolution({
    id: 'doorLocation',
    heading: 'Door Location',
    resolver: wrapResolver(resolveDoorLocation),
    renderers: {
      renderDetail: renderDoorLocationDetail,
      renderCompact: NO_COMPACT_RENDER,
    },
    buildPreview: buildDoorLocationPreview,
    buildEventPreview: (node) =>
      node.event.kind === 'doorLocation'
        ? buildEventPreviewFromFactory(node, buildDoorLocationPreview, {
            tableId: `doorLocation:${node.event.sequence}`,
          })
        : undefined,
    registry: ({ roll, doorChain, id }) => {
      const existing = (doorChain?.existing as DoorChainLaterality[]) ?? [];
      const sequence =
        doorChain?.sequence ?? parseDoorChainSequence(id, existing.length);
      return resolveDoorLocation({ roll, existing, sequence });
    },
    resolvePending: (pending, ancestors) => {
      const existing = collectDoorChainExisting(ancestors);
      const sequence = parseDoorChainSequence(pending.table, existing.length);
      return resolveDoorLocation({ existing, sequence });
    },
  }),
];

function toDoorChainLaterality(
  result: DoorLocation
): DoorChainLaterality | undefined {
  if (result === DoorLocation.Left) return 'Left';
  if (result === DoorLocation.Right) return 'Right';
  return undefined;
}

function collectDoorChainExisting(
  ancestors: OutcomeEventNode[]
): DoorChainLaterality[] {
  const existing: DoorChainLaterality[] = [];
  for (const ancestor of ancestors) {
    if (ancestor.event.kind !== 'doorLocation') continue;
    const lateral = toDoorChainLaterality(ancestor.event.result);
    if (!lateral || existing.includes(lateral)) continue;
    existing.push(lateral);
  }
  return existing;
}

function parseDoorChainSequence(table: string, fallback: number): number {
  const parts = table.split(':');
  const seq = Number(parts[1]);
  return Number.isFinite(seq) ? seq : fallback;
}

import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../domain/outcome';
import { DoorLocation } from '../../../tables/dungeon/doorLocation';
import type { TableContext } from '../../../types/dungeon';
import type { DoorChainLaterality } from '../../domain/outcome';
import type { CompactRenderer, DetailRenderer } from '../types';

export const NO_COMPACT_RENDER: CompactRenderer = (_node, _append) => [];

export const withoutAppend =
  (
    renderer: (
      node: Parameters<DetailRenderer>[0]
    ) => ReturnType<DetailRenderer>
  ) =>
  (
    node: Parameters<DetailRenderer>[0],
    _append: Parameters<DetailRenderer>[1]
  ) =>
    renderer(node);

export const wrapResolver =
  <T>(resolver: (options?: T) => DungeonOutcomeNode) =>
  (options?: unknown) =>
    resolver(options as T);

export const toDoorChainLaterality = (
  result: DoorLocation
): DoorChainLaterality | undefined => {
  if (result === DoorLocation.Left) return 'Left';
  if (result === DoorLocation.Right) return 'Right';
  return undefined;
};

export const collectDoorChainExisting = (
  ancestors: OutcomeEventNode[]
): DoorChainLaterality[] => {
  const existing: DoorChainLaterality[] = [];
  for (const ancestor of ancestors) {
    if (ancestor.event.kind !== 'doorLocation') continue;
    const lateral = toDoorChainLaterality(ancestor.event.result);
    if (!lateral || existing.includes(lateral)) continue;
    existing.push(lateral);
  }
  return existing;
};

export const parseDoorChainSequence = (
  table: string,
  fallback: number
): number => {
  const parts = table.split(':');
  const seq = Number(parts[1]);
  return Number.isFinite(seq) ? seq : fallback;
};

export const parseEgressWhich = (table: string): 'one' | 'two' | 'three' => {
  const parts = table.split(':');
  if (parts.length >= 2) {
    const key = parts[1] as 'one' | 'two' | 'three';
    if (key === 'one' || key === 'two' || key === 'three') return key;
  }
  return 'one';
};

export const readExitsContextLocal = (
  context: TableContext | undefined
): { length: number; width: number; isRoom: boolean } | undefined => {
  if (!context || typeof context !== 'object') return undefined;
  if ((context as { kind?: unknown }).kind !== 'exits') return undefined;
  const { length, width, isRoom } = context as {
    length?: number;
    width?: number;
    isRoom?: boolean;
  };
  if (
    typeof length !== 'number' ||
    typeof width !== 'number' ||
    typeof isRoom !== 'boolean'
  ) {
    return undefined;
  }
  return { length, width, isRoom };
};

export const readExitsContext = (
  context: TableContext | undefined
): { length: number; width: number; isRoom: boolean } | undefined => {
  if (!context || context.kind !== 'exits') return undefined;
  return {
    length: context.length,
    width: context.width,
    isRoom: context.isRoom,
  };
};

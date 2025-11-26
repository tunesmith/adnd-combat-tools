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

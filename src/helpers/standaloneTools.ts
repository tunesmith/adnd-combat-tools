import catalog from '../tables/standaloneTools.json';
export const standaloneTools = catalog;
export type StandaloneTool = typeof catalog[number];
export function standaloneToolForRoute(
  url: string
): StandaloneTool | undefined {
  const path =
    (url.split(/[?#]/)[0] || '/').replace(/\.html$/, '').replace(/\/$/, '') ||
    '/';
  return catalog.find(
    (tool) => path === tool.path || path.startsWith(`${tool.path}/`)
  );
}

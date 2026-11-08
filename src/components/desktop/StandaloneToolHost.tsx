import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
const loading = () => <p role="status">Loading tool…</p>;
const pages: Record<string, ComponentType> = {
  '/calculator': dynamic(() => import('../../pages/calculator'), {
    ssr: false,
    loading,
  }),
  '/battle': dynamic(() => import('../../pages/battle'), {
    ssr: false,
    loading,
  }),
  '/initiative': dynamic(() => import('../../pages/initiative'), {
    ssr: false,
    loading,
  }),
  '/dungeon': dynamic(() => import('../../pages/dungeon'), {
    ssr: false,
    loading,
  }),
  '/tracker': dynamic(() => import('../../pages/tracker'), {
    ssr: false,
    loading,
  }),
  '/encumbrance': dynamic(() => import('../../pages/encumbrance'), {
    ssr: false,
    loading,
  }),
  '/encumbrance/dm': dynamic(() => import('../../pages/encumbrance/dm'), {
    ssr: false,
    loading,
  }),
  '/encumbrance/player': dynamic(
    () => import('../../pages/encumbrance/player'),
    { ssr: false, loading }
  ),
};
export default function StandaloneToolHost({ path }: { path: string }) {
  const Page = pages[path];
  return Page ? <Page /> : <p role="alert">Tool page unavailable.</p>;
}

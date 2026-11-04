import '../styles/global.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

// Keep native workspace code out of the public build's module graph.
const DesktopWorkspace =
  process.env['NEXT_PUBLIC_DESKTOP'] === '1'
    ? dynamic(() => import('../components/desktop/DesktopWorkspace'), {
        ssr: false,
      })
    : () => null;

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {process.env['NEXT_PUBLIC_DESKTOP'] === '1' && <DesktopWorkspace />}
      <Component {...pageProps} />
    </>
  );
}

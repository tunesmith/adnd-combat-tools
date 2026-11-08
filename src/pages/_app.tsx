import '../styles/global.css';
import '../styles/webFonts.css';
import type { ReactNode } from 'react';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

// Keep native workspace code out of the public build's module graph.
const DesktopWorkspace =
  process.env['NEXT_PUBLIC_DESKTOP'] === '1'
    ? dynamic(() => import('../components/desktop/DesktopWorkspace'), {
        ssr: false,
        loading: ({ error }) => (
          <p role={error ? 'alert' : 'status'}>
            {error
              ? `Unable to load campaign workspace: ${error.message}`
              : 'Loading campaign workspace…'}
          </p>
        ),
      })
    : ({ children }: { children?: ReactNode }) => <>{children}</>;

export default function MyApp({ Component, pageProps }: AppProps) {
  return process.env['NEXT_PUBLIC_DESKTOP'] === '1' ? (
    <DesktopWorkspace />
  ) : (
    <Component {...pageProps} />
  );
}

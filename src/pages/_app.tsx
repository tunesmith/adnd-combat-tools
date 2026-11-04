import '../styles/global.css';
import type { AppProps } from 'next/app';
import DesktopWorkspace from '../components/desktop/DesktopWorkspace';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {process.env['NEXT_PUBLIC_DESKTOP'] === '1' && <DesktopWorkspace />}
      <Component {...pageProps} />
    </>
  );
}

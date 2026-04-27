import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

// Disable SSR for all pages since this is a SPA migrated from Vite
const SafeComponent = dynamic(() => Promise.resolve(({ Component, pageProps }: AppProps) => <Component {...pageProps} />), {
  ssr: false,
});

function MyApp(props: AppProps) {
  return <SafeComponent {...props} />;
}

export default MyApp;
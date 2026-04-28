import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

// Disable SSR for entire app since this is a SPA with browser-only APIs
const AppWithProviders = dynamic(
  () => import('@/components/AppWithProviders'),
  { ssr: false }
);

function MyApp(props: AppProps) {
  return <AppWithProviders {...props} />;
}

export default MyApp;

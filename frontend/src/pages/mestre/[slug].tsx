import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Redirect() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    router.replace(`/hive?f=academy&overlay=mestre&slug=${router.query.slug}`);
  }, [router.isReady]);
  return null;
}

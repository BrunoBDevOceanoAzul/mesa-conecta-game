import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Redirect() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    router.replace(`/hive?f=market&overlay=checkout&planId=${router.query.planId}`);
  }, [router.isReady]);
  return null;
}

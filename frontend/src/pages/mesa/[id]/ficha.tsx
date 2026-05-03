import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Redirect() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    router.replace(`/hive?f=playground&overlay=sheet&id=${router.query.id}`);
  }, [router.isReady]);
  return null;
}

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/hive?f=market&overlay=boost'); }, []);
  return null;
}

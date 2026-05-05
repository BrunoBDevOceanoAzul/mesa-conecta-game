import React, { Suspense } from 'react';
import HiveLayout from '@/layouts/HiveLayout';

// FrequencyRouter will be created in Task 2
const FrequencyRouter = React.lazy(() => import('@/components/hive/FrequencyRouter'));

export default function HivePage() {
  return (
    <HiveLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-2 border-[#662583] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <FrequencyRouter />
      </Suspense>
    </HiveLayout>
  );
}

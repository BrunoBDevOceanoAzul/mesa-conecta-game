"use client";

import dynamic from "next/dynamic";

const HivePage = dynamic(() => import("@/pages/Hive"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#050505]">
      <div className="w-8 h-8 border-2 border-[#662583] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function Home() {
  return <HivePage />;
}

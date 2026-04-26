import React, { useState, useEffect, Suspense } from 'react';
import { 
  Briefcase, Users, ShoppingBag, GraduationCap, 
  Gamepad2, Radio, Fingerprint 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiveProvider, useHive } from '@/context/HiveContext';
import { LinkerHive } from '@/components/hive/LinkerHive';
import type { HiveFrequency } from '@/context/HiveContext';

const CommanderProfile = React.lazy(() => import('@/components/hive/sections/CommanderProfile'));
const NetworkContent = React.lazy(() => import('@/components/hive/sections/NetworkContent'));
const MarketContent = React.lazy(() => import('@/components/hive/sections/MarketContent'));
const HivesContent = React.lazy(() => import('@/components/hive/sections/HivesContent'));
const AcademyContent = React.lazy(() => import('@/components/hive/sections/AcademyContent'));
const PlaygroundContent = React.lazy(() => import('@/components/hive/sections/PlaygroundContent'));
const RadarContent = React.lazy(() => import('@/components/hive/sections/RadarContent'));

const HEXAGONS = [
  { id: 'user' as const, label: 'Comandante', icon: Fingerprint, isCentral: true },
  { id: 'network' as HiveFrequency, label: 'Network', icon: Briefcase },
  { id: 'hives' as HiveFrequency, label: 'Clã', icon: Users },
  { id: 'academy' as HiveFrequency, label: 'Academia', icon: GraduationCap },
  { id: 'market' as HiveFrequency, label: 'Mercado', icon: ShoppingBag },
  { id: 'playground' as HiveFrequency, label: 'Playground', icon: Gamepad2 },
  { id: 'radar' as HiveFrequency, label: 'Radar', icon: Radio },
];

function HiveContent() {
  const { activeFrequency, isExpanded } = useHive();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderContent = () => {
    const sections: Record<string, React.ReactNode> = {
      home: <CommanderProfile />,
      network: <NetworkContent />,
      market: <MarketContent />,
      hives: <HivesContent />,
      academy: <AcademyContent />,
      playground: <PlaygroundContent />,
      radar: <RadarContent />,
    };
    return sections[activeFrequency] || <CommanderProfile />;
  };

  return (
    <main className="relative w-screen h-screen bg-[#050505] overflow-hidden text-slate-200">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {isMounted && <LinkerHive hexagons={HEXAGONS} />}

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="absolute inset-0 z-10 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-2 border-[#662583] border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {renderContent()}
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExpanded && (
          <motion.div className="absolute inset-0 z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Suspense fallback={null}>
              <CommanderProfile />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function HivePage() {
  return (
    <HiveProvider>
      <HiveContent />
    </HiveProvider>
  );
}

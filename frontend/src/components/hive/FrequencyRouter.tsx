import React from 'react';
import { useHive } from '@/context/HiveContext';
import { AnimatePresence, motion } from 'framer-motion';

const CommanderProfile = React.lazy(() => import('./sections/CommanderProfile'));
const NetworkContent = React.lazy(() => import('./sections/NetworkContent'));
const MarketContent = React.lazy(() => import('./sections/MarketContent'));
const HivesContent = React.lazy(() => import('./sections/HivesContent'));
const AcademyContent = React.lazy(() => import('./sections/AcademyContent'));
const PlaygroundContent = React.lazy(() => import('./sections/PlaygroundContent'));
const RadarContent = React.lazy(() => import('./sections/RadarContent'));

const FREQUENCY_COMPONENTS: Record<string, React.ComponentType> = {
  home: CommanderProfile,
  network: NetworkContent,
  market: MarketContent,
  hives: HivesContent,
  academy: AcademyContent,
  playground: PlaygroundContent,
  radar: RadarContent,
};

export default function FrequencyRouter() {
  const { activeFrequency } = useHive();
  const Component = FREQUENCY_COMPONENTS[activeFrequency] || CommanderProfile;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeFrequency}
        className="absolute inset-0 overflow-y-auto pb-24 md:pb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Component />
      </motion.div>
    </AnimatePresence>
  );
}

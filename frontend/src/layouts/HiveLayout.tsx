import React from 'react';
import { Outlet } from 'react-router-dom';
import { HiveProvider } from '@/context/HiveContext';
import { LinkerHive } from '@/components/hive/LinkerHive';
import { OverlayManager } from '@/components/hive/OverlayManager';
import { 
  Briefcase, Users, ShoppingBag, GraduationCap, 
  Gamepad2, Radio, Fingerprint 
} from 'lucide-react';
import type { HiveFrequency } from '@/context/HiveContext';

const HEXAGONS = [
  { id: 'user' as const, label: 'Comandante', icon: Fingerprint, isCentral: true },
  { id: 'network' as HiveFrequency, label: 'Network', icon: Briefcase },
  { id: 'hives' as HiveFrequency, label: 'Clã', icon: Users },
  { id: 'academy' as HiveFrequency, label: 'Academia', icon: GraduationCap },
  { id: 'market' as HiveFrequency, label: 'Mercado', icon: ShoppingBag },
  { id: 'playground' as HiveFrequency, label: 'Playground', icon: Gamepad2 },
  { id: 'radar' as HiveFrequency, label: 'Radar', icon: Radio },
];

export default function HiveLayout() {
  return (
    <HiveProvider>
      <main className="relative w-screen h-screen bg-[#050505] overflow-hidden text-slate-200">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <LinkerHive hexagons={HEXAGONS} />
        <OverlayManager />
        
        <div className="relative z-10 w-full h-full">
          <Outlet />
        </div>
      </main>
    </HiveProvider>
  );
}

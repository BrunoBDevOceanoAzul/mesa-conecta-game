import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import { useHive } from '@/context/HiveContext';
import { mesasApi } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Mesa {
  id: string;
  title: string;
  system: string;
  format: string;
  city: string | null;
  min_price: number;
  max_price: number;
  seats_total: number;
  seats_available: number;
  gm_name: string;
  start_at: string;
  image_url: string | null;
  status: string;
}

export default function MarketContent() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { openOverlay } = useHive();

  useEffect(() => {
    async function fetchMesas() {
      setLoading(true);
      try {
        const res = await mesasApi.list({ 
          status: 'aberta', 
          startDate: new Date().toISOString(), 
          limit: 20 
        });
        const data = await res.json();
        if (data.ok) {
          setMesas(data.data || []);
        }
      } catch (err) {
        console.warn('[MarketContent] Failed to fetch mesas:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMesas();
  }, []);

  const filteredMesas = mesas.filter(mesa => 
    mesa.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mesa.system.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (mesa.city && mesa.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const showAllMesas = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0612] via-[#0f0a1a] to-[#050505] text-white p-4 pb-24 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#D94367]" />
            Mercado
          </h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar mesas, sistemas, cidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#662583]/50"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#662583]" />
          </div>
        ) : filteredMesas.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma mesa encontrada</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              {searchQuery ? 'Tente outro termo de busca.' : 'Não há mesas disponíveis no momento.'}
            </p>
            <button
              type="button"
              onClick={showAllMesas}
              className="inline-block mt-4 px-6 py-2 bg-[#662583] rounded-xl text-sm font-medium hover:bg-[#662583]/80 transition-colors"
            >
              Explorar Todas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMesas.map((mesa, i) => (
              <motion.div
                key={mesa.id}
                onClick={() => openOverlay('mesa', { id: mesa.id })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#662583]/30 to-[#F7A731]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {mesa.image_url ? (
                      <img src={mesa.image_url} alt={mesa.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-[#662583]">{mesa.system.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-[#F7A731] transition-colors truncate">
                      {mesa.title}
                    </h3>
                    <p className="text-white/50 text-xs mt-1">
                      {mesa.system} • {mesa.format}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
                      {mesa.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {mesa.city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(mesa.start_at), 'dd/MM', { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {mesa.seats_available}/{mesa.seats_total}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-white/40">por {mesa.gm_name}</span>
                  <span className="text-sm font-semibold text-[#F7A731]">
                    R$ {mesa.min_price}
                    {mesa.max_price > mesa.min_price && ` - ${mesa.max_price}`}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Acoes do mercado */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={showAllMesas}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#662583]/20 border border-[#662583]/30 rounded-xl text-sm font-medium hover:bg-[#662583]/30 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Ver todas as mesas
          </button>
        </div>
      </motion.div>
    </div>
  );
}

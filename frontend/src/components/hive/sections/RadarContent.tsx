import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Radio, MapPin, Navigation, Loader2, Crosshair } from 'lucide-react';
import { mesasApi } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NearbyMesa {
  id: string;
  title: string;
  system: string;
  format: string;
  city: string | null;
  min_price: number;
  seats_available: number;
  seats_total: number;
  gm_name: string;
  start_at: string;
  distance?: number;
}

export default function RadarContent() {
  const [mesas, setMesas] = useState<NearbyMesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        try {
          const res = await mesasApi.list({
            status: 'aberta',
            lat: latitude,
            lng: longitude,
            radius: 50,
            limit: 20,
          });
          const data = await res.json();
          if (data.ok) {
            setMesas(data.data || []);
          }
        } catch (err) {
          console.warn('[RadarContent] Failed to fetch nearby mesas:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLocationError('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (!googleMapsApiKey || !mapRef.current || !userLocation) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (mapRef.current && window.google) {
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: userLocation.lat, lng: userLocation.lng },
          zoom: 12,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#050505' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#050505' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }],
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{ color: '#0a0a0a' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#1a1a1a' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#212121' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca3af' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0a0a0a' }],
            },
          ],
        });

        // User location marker
        new window.google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: googleMapRef.current,
          title: 'Você está aqui',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#662583',
            fillOpacity: 1,
            strokeColor: '#F7A731',
            strokeWeight: 2,
          },
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [googleMapsApiKey, userLocation]);

  // Update markers when mesas change
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    mesas.forEach((mesa) => {
      if (mesa.lat && mesa.lng) {
        const marker = new window.google.maps.Marker({
          position: { lat: mesa.lat, lng: mesa.lng },
          map: googleMapRef.current,
          title: mesa.title,
        });
        markersRef.current.push(marker);
      }
    });
  }, [mesas]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0612] via-[#0f0a1a] to-[#050505] text-white p-4 pb-24 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Radio className="w-6 h-6 text-[#2C8E8B]" />
            Radar
          </h1>
        </div>

        {locationError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 text-red-400 text-sm">
            {locationError}
          </div>
        )}

        {/* Map */}
        {googleMapsApiKey && userLocation && (
          <div className="mb-6">
            <div 
              ref={mapRef} 
              className="w-full h-64 md:h-80 rounded-2xl border border-white/10 overflow-hidden"
            />
          </div>
        )}

        {/* Location indicator */}
        {userLocation && (
          <div className="flex items-center gap-2 mb-4 text-white/60 text-sm">
            <Crosshair className="w-4 h-4 text-[#2C8E8B]" />
            <span>Localização ativa</span>
            <span className="text-white/30">
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </span>
          </div>
        )}

        {/* Nearby Mesas */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#662583]" />
          </div>
        ) : mesas.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <MapPin className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma mesa próxima</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Não encontramos mesas disponíveis na sua região. Tente ampliar a busca ou explore outras cidades.
            </p>
            <a 
              href="/explorar" 
              className="inline-block mt-4 px-6 py-2 bg-[#662583] rounded-xl text-sm font-medium hover:bg-[#662583]/80 transition-colors"
            >
              Explorar Todas
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {mesas.map((mesa, i) => (
              <motion.a
                key={mesa.id}
                href={`/mesa/${mesa.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex items-center justify-between">
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
                      <span>
                        {format(new Date(mesa.start_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                      <span>
                        R$ {mesa.min_price}
                      </span>
                    </div>
                  </div>
                  {mesa.distance && (
                    <div className="flex items-center gap-1 text-[#2C8E8B] text-sm font-medium ml-4">
                      <Navigation className="w-4 h-4" />
                      {mesa.distance < 1 
                        ? `${(mesa.distance * 1000).toFixed(0)}m` 
                        : `${mesa.distance.toFixed(1)}km`
                      }
                    </div>
                  )}
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

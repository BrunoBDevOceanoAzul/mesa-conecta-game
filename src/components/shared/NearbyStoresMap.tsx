import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Store, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreData {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  capacity: number;
  simultaneous_tables: number;
  distance: number;
}

interface NearbyStoresMapProps {
  userLat?: number;
  userLng?: number;
  radiusKm?: number;
}

export function NearbyStoresMap({ userLat, userLng, radiusKm = 50 }: NearbyStoresMapProps) {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const fetchStores = useCallback(async () => {
    if (!userLat || !userLng) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "nearby-stores", lat: userLat, lng: userLng, radius: radiusKm },
      });
      if (fnError) throw new Error(fnError.message);
      setStores(data?.stores || []);
    } catch (err: any) {
      setError("Não foi possível carregar lojas próximas.");
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, radiusKm]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Load Google Maps script
  useEffect(() => {
    if (!userLat || !userLng) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    if ((window as any).google?.maps) {
      initMap();
      return;
    }

    // We load the Maps JS API using a lightweight loader
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=&callback=__initGMap&libraries=marker&v=weekly`;
    // Since we can't expose the key client-side, we use a simple embedded map
    // with markers positioned via the data we got from the edge function.
    // Instead, let's use a Leaflet-based approach (free, no key needed client-side).
    script.remove();

    initMap();
  }, [userLat, userLng, stores]);

  const initMap = () => {
    // We'll render a CSS-based map placeholder with store cards
    // For a full interactive map, we'd use Leaflet (no API key needed client-side)
  };

  if (!userLat || !userLng) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <MapPin className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">
          Complete seu perfil com sua cidade para ver luderias próximas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Luderias próximas
        </h3>
        <span className="text-xs text-muted-foreground">
          Raio de {radiusKm}km
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : stores.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Store className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma luderia encontrada nesse raio.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(selectedStore?.id === store.id ? null : store)}
              className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all hover:scale-[1.01] ${
                selectedStore?.id === store.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-foreground">{store.name}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {store.address || store.city}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {store.distance} km
                  </span>
                  {store.capacity && (
                    <span>Capacidade: {store.capacity}</span>
                  )}
                  {store.simultaneous_tables && (
                    <span>{store.simultaneous_tables} mesas</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

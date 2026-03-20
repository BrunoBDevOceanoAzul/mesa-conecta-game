import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "Google Maps API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, input, lat, lng, radius } = await req.json();

    if (action === "autocomplete") {
      const url = "https://places.googleapis.com/v1/places:autocomplete";
      const body: any = {
        input,
        includedRegionCodes: ["br"],
        languageCode: "pt-BR",
      };
      // Only restrict to localities for city searches; allow all types for address searches
      if (!input.includes(",") && input.length < 20) {
        body.includedPrimaryTypes = ["locality", "administrative_area_level_2"];
      }
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      // Map new API response to legacy format for frontend compatibility
      const predictions = (data.suggestions || [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          place_id: s.placePrediction.placeId,
          description: s.placePrediction.text?.text || "",
        }));

      return new Response(JSON.stringify({ predictions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "place-details") {
      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(input)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "location,displayName,formattedAddress",
        },
      });
      const data = await response.json();

      // Map to legacy format for frontend compatibility
      const result = {
        geometry: {
          location: {
            lat: data.location?.latitude,
            lng: data.location?.longitude,
          },
        },
        formatted_address: data.formattedAddress,
        name: data.displayName?.text,
      };

      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "nearby-stores") {
      // Query stores from DB within a radius
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: stores, error } = await adminClient
        .from("stores")
        .select("*")
        .not("lat", "is", null)
        .not("lng", "is", null);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Filter by distance (Haversine)
      const R = 6371;
      const maxKm = radius || 50;
      const nearby = (stores || [])
        .map((store) => {
          const dLat = ((store.lat - lat) * Math.PI) / 180;
          const dLng = ((store.lng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((store.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          return { ...store, distance: Math.round(distance * 10) / 10 };
        })
        .filter((s) => s.distance <= maxKm)
        .sort((a, b) => a.distance - b.distance);

      return new Response(JSON.stringify({ stores: nearby }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

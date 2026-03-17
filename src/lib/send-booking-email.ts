import { supabase } from "@/integrations/supabase/client";

interface BookingEmailParams {
  playerEmail: string;
  playerName?: string;
  mesaTitle: string;
  gmName?: string;
  system?: string;
  date?: string;
  time?: string;
  venue?: string;
  format?: string;
  price?: string;
  mesaId?: string;
}

export async function sendBookingConfirmation(params: BookingEmailParams) {
  const { data, error } = await supabase.functions.invoke(
    "send-booking-confirmation",
    { body: params }
  );

  if (error) {
    console.error("Failed to send booking confirmation:", error);
    throw error;
  }

  return data;
}

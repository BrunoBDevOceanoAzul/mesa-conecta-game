import { z } from "zod";

export const eventTypeSchema = z.enum([
  "page_view",
  "mesa_click",
  "mesa_favorite",
  "mesa_share",
  "booking_initiated",
  "booking_confirmed",
  "booking_cancelled",
  "review_submitted",
  "search_query",
  "filter_applied",
  "profile_view",
  "gm_follow",
  "checkout_started",
  "payment_completed",
]);

export const createEventSchema = z.object({
  eventType: eventTypeSchema,
  mesaId: z.string().uuid().optional(),
  gmId: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  source: z.string().optional(),
  sessionId: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

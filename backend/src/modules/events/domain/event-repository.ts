import { Event } from "./event.js";

export interface CreateEventInput {
  eventType: string;
  userId?: string | null;
  mesaId?: string | null;
  gmId?: string | null;
  payload?: Record<string, unknown>;
  ipHash?: string | null;
  userAgent?: string | null;
  source?: string | null;
  sessionId?: string | null;
}

export interface EventRepository {
  create(input: CreateEventInput): Promise<Event>;
}

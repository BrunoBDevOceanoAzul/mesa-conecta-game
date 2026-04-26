import { db } from "../../../db/client.js";
import { events, eventTypeEnum } from "../../../db/schema/events.js";
import { Event } from "../domain/event.js";
import { EventRepository, CreateEventInput } from "../domain/event-repository.js";

export class DrizzleEventRepository implements EventRepository {
  async create(input: CreateEventInput): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({
        eventType: input.eventType as typeof eventTypeEnum.enumValues[number],
        userId: input.userId || null,
        mesaId: input.mesaId || null,
        gmId: input.gmId || null,
        payload: input.payload || {},
        ipHash: input.ipHash || null,
        userAgent: input.userAgent || null,
        source: input.source || null,
        sessionId: input.sessionId || null,
      })
      .returning();

    return new Event({
      id: event.id,
      eventType: event.eventType,
      userId: event.userId,
      mesaId: event.mesaId,
      gmId: event.gmId,
      payload: (event.payload as Record<string, unknown>) || {},
      ipHash: event.ipHash,
      userAgent: event.userAgent,
      source: event.source,
      sessionId: event.sessionId,
      createdAt: event.createdAt,
    });
  }
}

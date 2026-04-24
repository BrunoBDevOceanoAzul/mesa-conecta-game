import { describe, it, expect, vi } from "vitest";
import { CreateEventUseCase } from "./create-event.use-case.js";
import { Event } from "../domain/event.js";

describe("CreateEventUseCase", () => {
  it("creates event successfully", async () => {
    const createdEvent = new Event({
      id: "evt-1",
      eventType: "page_view",
      userId: "user-1",
      mesaId: null,
      gmId: null,
      payload: { path: "/home" },
      ipHash: "abc123",
      userAgent: "Mozilla/5.0",
      source: "web",
      sessionId: "sess-1",
      createdAt: new Date(),
    });

    const repo = { create: vi.fn().mockResolvedValue(createdEvent) };
    const useCase = new CreateEventUseCase(repo);

    const result = await useCase.execute({
      eventType: "page_view",
      userId: "user-1",
      payload: { path: "/home" },
      ipHash: "abc123",
      userAgent: "Mozilla/5.0",
      source: "web",
      sessionId: "sess-1",
    });

    expect(result).toEqual(createdEvent);
    expect(repo.create).toHaveBeenCalledWith({
      eventType: "page_view",
      userId: "user-1",
      payload: { path: "/home" },
      ipHash: "abc123",
      userAgent: "Mozilla/5.0",
      source: "web",
      sessionId: "sess-1",
    });
  });

  it("creates anonymous event without userId", async () => {
    const createdEvent = new Event({
      id: "evt-2",
      eventType: "search_query",
      userId: null,
      mesaId: null,
      gmId: null,
      payload: { query: "dnd" },
      ipHash: null,
      userAgent: null,
      source: null,
      sessionId: null,
      createdAt: new Date(),
    });

    const repo = { create: vi.fn().mockResolvedValue(createdEvent) };
    const useCase = new CreateEventUseCase(repo);

    const result = await useCase.execute({
      eventType: "search_query",
    });

    expect(result).toEqual(createdEvent);
    expect(repo.create).toHaveBeenCalledWith({
      eventType: "search_query",
    });
  });
});

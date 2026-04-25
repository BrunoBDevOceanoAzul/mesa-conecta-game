/**
 * In-memory event bus for SSE notifications.
 * Maps userId -> array of response streams.
 */

import { FastifyReply } from "fastify";

interface SseClient {
  userId: string;
  reply: FastifyReply;
  heartbeatInterval: NodeJS.Timeout;
}

const clients = new Map<string, Set<SseClient>>();

export function subscribeUser(userId: string, reply: FastifyReply): void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }

  const heartbeat = setInterval(() => {
    try {
      reply.raw.write(":heartbeat\n\n");
    } catch {
      unsubscribeUser(userId, reply);
    }
  }, 30000);

  const client: SseClient = { userId, reply, heartbeatInterval: heartbeat };
  clients.get(userId)!.add(client);

  reply.raw.on("close", () => {
    unsubscribeUser(userId, reply);
  });
}

export function unsubscribeUser(userId: string, reply: FastifyReply): void {
  const userClients = clients.get(userId);
  if (!userClients) return;

  for (const client of userClients) {
    if (client.reply === reply) {
      clearInterval(client.heartbeatInterval);
      userClients.delete(client);
      break;
    }
  }

  if (userClients.size === 0) {
    clients.delete(userId);
  }
}

export function publishEvent(userId: string, event: string, data: unknown): void {
  const userClients = clients.get(userId);
  if (!userClients) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const client of userClients) {
    try {
      client.reply.raw.write(payload);
    } catch {
      unsubscribeUser(userId, client.reply);
    }
  }
}

export function publishEventToAll(event: string, data: unknown): void {
  for (const [userId] of clients) {
    publishEvent(userId, event, data);
  }
}

export function getActiveConnections(): number {
  let total = 0;
  for (const userClients of clients.values()) {
    total += userClients.size;
  }
  return total;
}

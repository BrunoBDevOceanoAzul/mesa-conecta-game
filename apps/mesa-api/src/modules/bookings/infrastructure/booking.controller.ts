import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { CreateBookingUseCase } from "../application/create-booking.use-case.js";
import { GetMyBookingsUseCase } from "../application/get-my-bookings.use-case.js";
import { CancelBookingUseCase } from "../application/cancel-booking.use-case.js";
import { DrizzleBookingRepository } from "./drizzle-booking.repository.js";
import { notifyBookingConfirmed, notifyBookingCanceled } from "../../notifications/infrastructure/notification.helpers.js";
import { db } from "../../../db/client.js";
import { bookings } from "../../../db/schema/bookings.js";

const createBookingBodySchema = z.object({
  gameTableId: z.string().uuid(),
  tableSessionId: z.string().uuid().optional(),
  seatsReserved: z.number().int().min(1).max(10).default(1),
  amount: z.string().default("0"),
  currency: z.string().default("BRL"),
  sourceType: z.enum(["organic", "referral", "campaign", "boost"]).default("organic"),
  status: z.enum(["pending", "confirmed", "canceled", "completed", "refunded", "waitlist"]).default("pending"),
});

export async function bookingController(fastify: FastifyInstance) {
  const repository = new DrizzleBookingRepository();
  const createBookingUseCase = new CreateBookingUseCase(repository);
  const getMyBookingsUseCase = new GetMyBookingsUseCase(repository);
  const cancelBookingUseCase = new CancelBookingUseCase(repository);

  // POST /bookings — Criar reserva
  fastify.post("/bookings", async (request, reply) => {
    const body = createBookingBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        ok: false,
        error: "Invalid request body",
        details: body.error.flatten(),
      });
    }

    const user = request.user;
    if (!user?.id) {
      return reply.status(401).send({
        ok: false,
        error: "Unauthorized",
      });
    }

    try {
      const booking = await createBookingUseCase.execute({
        gameTableId: body.data.gameTableId,
        tableSessionId: body.data.tableSessionId ?? null,
        playerUserId: user.id,
        gmUserId: user.id, // TODO: buscar gmId da mesa
        storeUserId: null,
        status: body.data.status,
        seatsReserved: body.data.seatsReserved,
        amount: body.data.amount,
        currency: body.data.currency,
        paymentStatus: body.data.status === "confirmed" ? "paid" : "unpaid",
        sourceType: body.data.sourceType,
        stripeCheckoutSessionId: null,
      });

      // Notificar jogador via SSE
      notifyBookingConfirmed(user.id, booking.toJSON());

      return reply.status(201).send({
        ok: true,
        data: booking.toJSON(),
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("already has") || err.message.includes("Not enough") || err.message.includes("not open")) {
          return reply.status(409).send({
            ok: false,
            error: err.message,
          });
        }
      }
      fastify.log.error({ err }, "Failed to create booking");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // GET /bookings/me — Minhas reservas (com dados da mesa)
  fastify.get("/bookings/me", async (request, reply) => {
    const user = request.user;
    if (!user?.id) {
      return reply.status(401).send({
        ok: false,
        error: "Unauthorized",
      });
    }

    try {
      const rows = await db.query.bookings.findMany({
        where: eq(bookings.playerUserId, user.id),
        orderBy: [desc(bookings.createdAt)],
        with: { gameTable: true },
      });

      return reply.send({
        ok: true,
        data: rows.map((row) => ({
          id: row.id,
          game_table_id: row.gameTableId,
          table_session_id: row.tableSessionId,
          player_user_id: row.playerUserId,
          gm_user_id: row.gmUserId,
          store_user_id: row.storeUserId,
          status: row.status,
          seats_reserved: row.seatsReserved,
          amount: row.amount,
          currency: row.currency,
          payment_status: row.paymentStatus,
          booked_at: row.bookedAt,
          canceled_at: row.canceledAt,
          completed_at: row.completedAt,
          source_type: row.sourceType,
          stripe_checkout_session_id: row.stripeCheckoutSessionId,
          created_at: row.createdAt,
          updated_at: row.updatedAt,
          mesas: row.gameTable
            ? (() => {
                const gt = row.gameTable as Record<string, any>;
                return {
                  id: gt.id,
                  title: gt.title,
                  system: gt.system,
                  city: gt.city,
                  start_at: gt.startAt,
                  image_url: gt.imageUrl,
                };
              })()
            : null,
        })),
        meta: { total: rows.length },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get my bookings");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // PATCH /bookings/:id/cancel — Cancelar reserva
  fastify.patch("/bookings/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;

    if (!user?.id) {
      return reply.status(401).send({
        ok: false,
        error: "Unauthorized",
      });
    }

    try {
      const booking = await cancelBookingUseCase.execute({
        bookingId: id,
        userId: user.id,
        isAdmin: user.role === "admin",
      });

      // Notificar jogador via SSE
      notifyBookingCanceled(user.id, booking.toJSON());

      return reply.send({
        ok: true,
        data: booking.toJSON(),
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "Booking not found") {
          return reply.status(404).send({
            ok: false,
            error: err.message,
          });
        }
        if (err.message === "Unauthorized to cancel this booking") {
          return reply.status(403).send({
            ok: false,
            error: err.message,
          });
        }
        if (err.message === "Booking is already canceled") {
          return reply.status(409).send({
            ok: false,
            error: err.message,
          });
        }
      }
      fastify.log.error({ err }, "Failed to cancel booking");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });
}

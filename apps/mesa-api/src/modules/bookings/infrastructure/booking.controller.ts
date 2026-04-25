import { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreateBookingUseCase } from "../application/create-booking.use-case.js";
import { GetMyBookingsUseCase } from "../application/get-my-bookings.use-case.js";
import { CancelBookingUseCase } from "../application/cancel-booking.use-case.js";
import { DrizzleBookingRepository } from "./drizzle-booking.repository.js";

const createBookingBodySchema = z.object({
  gameTableId: z.string().uuid(),
  tableSessionId: z.string().uuid().optional(),
  seatsReserved: z.number().int().min(1).max(10).default(1),
  amount: z.string().default("0"),
  currency: z.string().default("BRL"),
  sourceType: z.enum(["organic", "referral", "campaign", "boost"]).default("organic"),
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
        status: "pending",
        seatsReserved: body.data.seatsReserved,
        amount: body.data.amount,
        currency: body.data.currency,
        paymentStatus: "unpaid",
        sourceType: body.data.sourceType,
        stripeCheckoutSessionId: null,
      });

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

  // GET /bookings/me — Minhas reservas
  fastify.get("/bookings/me", async (request, reply) => {
    const user = request.user;
    if (!user?.id) {
      return reply.status(401).send({
        ok: false,
        error: "Unauthorized",
      });
    }

    try {
      const result = await getMyBookingsUseCase.execute(user.id);
      return reply.send({
        ok: true,
        data: result.bookings.map((b) => b.toJSON()),
        meta: {
          total: result.total,
        },
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

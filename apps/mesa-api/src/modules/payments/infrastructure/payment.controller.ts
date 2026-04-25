import { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreatePaymentUseCase } from "../application/create-payment.use-case.js";
import { HttpAsaasGateway } from "./http-asaas.gateway.js";
import { env } from "../../../lib/env.js";

const createPaymentBodySchema = z.object({
  bookingId: z.string().uuid(),
  customerName: z.string().min(1),
  customerCpfCnpj: z.string().min(11),
  customerEmail: z.string().email(),
  amount: z.number().positive(),
  billingType: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]).default("PIX"),
  description: z.string().min(1),
});

const asaasWebhookBodySchema = z.object({
  event: z.string(),
  payment: z.object({
    id: z.string(),
    status: z.string(),
    externalReference: z.string().optional(),
    value: z.number().optional(),
  }).optional(),
});

export async function paymentController(fastify: FastifyInstance) {
  const asaasGateway = new HttpAsaasGateway(env.ASAAS_API_KEY || "");
  // TODO: implementar PaymentRepository quando tivermos a tabela payments
  // const paymentRepository = new DrizzlePaymentRepository();
  // const createPaymentUseCase = new CreatePaymentUseCase(asaasGateway, paymentRepository);

  // POST /payments — Criar pagamento (PIX)
  fastify.post("/payments", async (request, reply) => {
    const body = createPaymentBodySchema.safeParse(request.body);
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
      // Por enquanto retornamos um stub — o pagamento real é feito via edge function
      // ou via integração direta com Asaas que será implementada na Fase 2
      return reply.status(501).send({
        ok: false,
        error: "Payment processing via API not yet implemented. Use edge function create-booking-payment for now.",
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to create payment");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // POST /webhooks/asaas — Receber webhooks do Asaas
  fastify.post("/webhooks/asaas", async (request, reply) => {
    const body = asaasWebhookBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        ok: false,
        error: "Invalid webhook payload",
        details: body.error.flatten(),
      });
    }

    try {
      const { event, payment } = body.data;

      fastify.log.info({ event, payment }, "Asaas webhook received");

      // TODO: Processar webhook e atualizar booking
      // 1. Buscar payment pelo asaasId
      // 2. Atualizar status
      // 3. Se RECEIVED/CONFIRMED, atualizar booking para confirmed
      // 4. Notificar usuário via SSE

      return reply.send({
        ok: true,
        message: "Webhook received",
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to process Asaas webhook");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });
}

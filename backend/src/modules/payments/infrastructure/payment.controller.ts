import { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreatePaymentUseCase } from "../application/create-payment.use-case.js";
import { HttpAsaasGateway } from "./http-asaas.gateway.js";
import { DrizzlePaymentRepository } from "./drizzle-payment.repository.js";
import { DrizzleAsaasAccountRepository } from "../../asaas-accounts/infrastructure/drizzle-asaas-account.repository.js";
import { env } from "../../../lib/env.js";

const createPaymentBodySchema = z.object({
  bookingId: z.string().uuid(),
  customerName: z.string().min(1),
  customerCpfCnpj: z.string().min(11),
  customerEmail: z.string().email(),
  amount: z.number().positive(),
  billingType: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]).default("PIX"),
  description: z.string().min(1),
  gmUserId: z.string().uuid().optional(),
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
  const paymentRepository = new DrizzlePaymentRepository();
  const asaasAccountRepository = new DrizzleAsaasAccountRepository();
  const createPaymentUseCase = new CreatePaymentUseCase(asaasGateway, paymentRepository);

  // POST /payments — Criar pagamento (PIX) com split para GM
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
      const data = body.data;
      let asaasResponse;

      // Se houver gmUserId, busca a subconta Asaas do GM e cria split
      if (data.gmUserId) {
        const gmAccount = await asaasAccountRepository.findByUserId(data.gmUserId);
        if (gmAccount?.isActive && gmAccount.asaasWalletId) {
          // Split: 5% plataforma, 95% GM (para RPG)
          asaasResponse = await asaasGateway.createSplitPayment({
            ...data,
            split: {
              walletId: gmAccount.asaasWalletId,
              percentualValue: 95,
            },
          });
        } else {
          // GM sem subconta ativa, cria pagamento sem split
          asaasResponse = await asaasGateway.createPayment(data);
        }
      } else {
        asaasResponse = await asaasGateway.createPayment(data);
      }

      // Buscar QR code PIX
      let pixQrCode: string | null = null;
      let pixCopiaCola: string | null = null;

      if (data.billingType === "PIX" && asaasResponse.id) {
        const pixData = await asaasGateway.getPixQrCode(asaasResponse.id);
        if (pixData) {
          pixQrCode = pixData.qrCode;
          pixCopiaCola = pixData.copiaCola;
        }
      }

      const payment = await paymentRepository.create({
        userId: user.id,
        externalPaymentId: asaasResponse.id,
        amount: data.amount,
        currency: "BRL",
        status: "pending",
        description: data.description,
        provider: "asaas",
        paymentType: "one_time",
        metadataJson: {
          bookingId: data.bookingId,
          billingType: data.billingType,
          pixQrCode,
          pixCopiaCola,
          invoiceUrl: asaasResponse.invoiceUrl,
        },
      });

      return reply.status(201).send({
        ok: true,
        data: {
          ...payment.toJSON(),
          pixQrCode,
          pixCopiaCola,
          invoiceUrl: asaasResponse.invoiceUrl,
        },
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

      if (payment?.id) {
        const dbPayment = await paymentRepository.findByAsaasId(payment.id);
        if (dbPayment) {
          const newStatus = payment.status === "RECEIVED" || payment.status === "CONFIRMED"
            ? "RECEIVED"
            : payment.status === "OVERDUE"
            ? "OVERDUE"
            : payment.status === "REFUNDED"
            ? "REFUNDED"
            : payment.status === "CANCELLED"
            ? "CANCELLED"
            : "PENDING";

          await paymentRepository.updateStatus(dbPayment.id, newStatus);
          fastify.log.info({ paymentId: dbPayment.id, newStatus }, "Payment status updated");
        }
      }

      return reply.send({
        ok: true,
        message: "Webhook processed",
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

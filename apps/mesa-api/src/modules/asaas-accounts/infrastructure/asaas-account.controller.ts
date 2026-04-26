import { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreateAsaasAccountUseCase } from "../application/create-asaas-account.use-case.js";
import { DrizzleAsaasAccountRepository } from "./drizzle-asaas-account.repository.js";
import { HttpAsaasGateway } from "../../payments/infrastructure/http-asaas.gateway.js";
import { env } from "../../../lib/env.js";

const createAccountBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  cpfCnpj: z.string().optional(),
  phone: z.string().optional(),
  postalCode: z.string().optional(),
});

export async function asaasAccountController(fastify: FastifyInstance) {
  const repository = new DrizzleAsaasAccountRepository();
  const gateway = new HttpAsaasGateway(env.ASAAS_API_KEY || "");
  const createAccountUseCase = new CreateAsaasAccountUseCase(repository, gateway);

  // POST /asaas/accounts — Criar subconta Asaas
  fastify.post("/asaas/accounts", async (request, reply) => {
    const body = createAccountBodySchema.safeParse(request.body);
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
      const account = await createAccountUseCase.execute({
        userId: user.id,
        name: body.data.name,
        email: body.data.email,
        cpfCnpj: body.data.cpfCnpj,
        phone: body.data.phone,
        postalCode: body.data.postalCode,
      });

      return reply.status(201).send({
        ok: true,
        data: account.toJSON(),
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("already has")) {
          return reply.status(409).send({
            ok: false,
            error: err.message,
          });
        }
      }
      fastify.log.error({ err }, "Failed to create Asaas account");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // GET /asaas/accounts/me — Minha subconta
  fastify.get("/asaas/accounts/me", async (request, reply) => {
    const user = request.user;
    if (!user?.id) {
      return reply.status(401).send({
        ok: false,
        error: "Unauthorized",
      });
    }

    try {
      const account = await repository.findByUserId(user.id);
      if (!account) {
        return reply.status(404).send({
          ok: false,
          error: "Asaas account not found",
        });
      }

      return reply.send({
        ok: true,
        data: account.toJSON(),
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get Asaas account");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });
}

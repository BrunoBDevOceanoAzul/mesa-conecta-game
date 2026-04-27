import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(8787),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // Token de deploy/integracao — nunca comitar no git
  DEPLOY_TOKEN: z.string().optional(),
  // Chave secreta para assinatura/verificacao de JWT — nunca comitar no git
  // Use: openssl rand -base64 64
  JWT_SECRET: z.string().min(32).optional(),
  // Asaas API Key — nunca comitar no git
  ASAAS_API_KEY: z.string().optional(),
  // Customer.io CDP/Pipelines source write key — nunca comitar no git
  CUSTOMERIO_CDP_WRITE_KEY: z.string().optional(),
  CUSTOMERIO_EVENTS_WRITE_KEY: z.string().optional(),
  CUSTOMERIO_CDP_API_BASE_URL: z.string().url().default("https://cdp.customer.io/v1"),
});

export const env = envSchema.parse(process.env);

import { z } from "zod";

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  instagramHandle: z.string().max(50).optional(),
  websiteUrl: z.string().url().max(500).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  coverImageUrl: z.string().url().max(500).optional(),
  preferredSystems: z.array(z.string()).max(20).optional(),
  playStyles: z.array(z.string()).max(20).optional(),
  experienceLevel: z.enum(["iniciante", "intermediario", "avancado", "veterano"]).optional(),
  preferredFormat: z.enum(["presencial", "online", "hibrido", "ambos"]).optional(),
  canPlay: z.boolean().optional(),
  canGm: z.boolean().optional(),
  canManageStore: z.boolean().optional(),
  canManageBrand: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

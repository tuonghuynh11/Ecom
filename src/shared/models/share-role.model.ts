import z from 'zod'

export const RoleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(500),
  description: z.string().default(''),
  isActive: z.boolean().default(true),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})

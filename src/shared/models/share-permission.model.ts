import { HTTPMethod } from 'src/shared/constants/role.constant'
import { DateTimeSchema } from 'src/shared/models/shared-other.model'
import z from 'zod'

export const PermissionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(500),
  description: z.string().default(''),
  module: z.string().max(500).default(''),
  path: z.string().max(1000),
  method: z.enum([
    HTTPMethod.GET,
    HTTPMethod.POST,
    HTTPMethod.PUT,
    HTTPMethod.PATCH,
    HTTPMethod.DELETE,
    HTTPMethod.OPTIONS,
    HTTPMethod.HEAD,
  ]),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.nullable(),
})

export type PermissionType = z.infer<typeof PermissionSchema>

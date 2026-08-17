import { PermissionSchema } from 'src/shared/models/share-permissiom.model'
import { RoleSchema } from 'src/shared/models/share-role.model'
import z from 'zod'

export const GetRolesResSchema = z.object({
  data: z.array(RoleSchema),
  totalItems: z.number().int().positive(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().positive(),
})
export const GetRoleDetailResSchema = RoleSchema.extend({
  permissions: z.array(
    PermissionSchema.pick({
      id: true,
      name: true,
      description: true,
      method: true,
      path: true,
    }),
  ),
})

export const CreateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
}).strict()

export const UpdateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
})
  .strict()
  .extend({
    permissionIds: z.array(z.number().int().positive()),
  })

export const GetRolesParamsSchema = z
  .object({
    roleId: z.coerce.number().int().positive(),
  })
  .strict()

export const GetRolesQueriesSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  })
  .strict()

export type RoleType = z.infer<typeof RoleSchema>
export type GetRolesResType = z.infer<typeof GetRolesResSchema>
export type GetRoleDetailResType = z.infer<typeof GetRoleDetailResSchema>
export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>
export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBodySchema>
export type GetRolesParamsType = z.infer<typeof GetRolesParamsSchema>
export type GetRolesQueriesType = z.infer<typeof GetRolesQueriesSchema>

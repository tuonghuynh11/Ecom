import { createZodDto } from 'nestjs-zod'
import {
  CreateRoleBodySchema,
  GetRoleDetailResSchema,
  GetRolesParamsSchema,
  GetRolesQueriesSchema,
  GetRolesResSchema,
  UpdateRoleBodySchema,
} from 'src/routes/roles/roles.model'
import { RoleSchema } from 'src/shared/models/share-role.model'

export class GetRolesResDTO extends createZodDto(GetRolesResSchema) {}
export class GetRoleResDTO extends createZodDto(RoleSchema) {}
export class GetRoleDetailResDTO extends createZodDto(GetRoleDetailResSchema) {}
export class CreateRoleBodyDTO extends createZodDto(CreateRoleBodySchema) {}
export class UpdateRoleBodyDTO extends createZodDto(UpdateRoleBodySchema) {}
export class GetRolesParamsDTO extends createZodDto(GetRolesParamsSchema) {}
export class GetRolesQueriesDTO extends createZodDto(GetRolesQueriesSchema) {}

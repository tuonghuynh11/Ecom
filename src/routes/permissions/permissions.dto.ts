import { createZodDto } from 'nestjs-zod'
import {
  CreatePermissionBodySchema,
  GetPermissionDetailResSchema,
  GetPermissionsParamsSchema,
  GetPermissionsQueriesSchema,
  GetPermissionsResSchema,
  UpdatePermissionBodySchema,
} from 'src/routes/permissions/permissions.model'

export class GetPermissionsResDTO extends createZodDto(GetPermissionsResSchema) {}
export class GetPermissionDetailResDTO extends createZodDto(GetPermissionDetailResSchema) {}
export class CreatePermissionBodyDTO extends createZodDto(CreatePermissionBodySchema) {}
export class UpdatePermissionBodyDTO extends createZodDto(UpdatePermissionBodySchema) {}
export class GetPermissionsParamsDTO extends createZodDto(GetPermissionsParamsSchema) {}
export class GetPermissionsQueriesDTO extends createZodDto(GetPermissionsQueriesSchema) {}

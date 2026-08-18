import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { RolePermissionsType } from 'src/shared/models/share-role.model'
import { REQUEST_ROLE_PERMISSIONS } from '../constants/auth.constant'
export const ActiveRolePermissions = createParamDecorator(
  (field: keyof RolePermissionsType | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    const role: RolePermissionsType | undefined = request[REQUEST_ROLE_PERMISSIONS]
    return field ? role?.[field] : role
  },
)

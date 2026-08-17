import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common'

export const RoleAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Error.RoleAlreadyExists',
    path: 'name',
  },
])

export const InvalidPermissionIdsException = (invalidPermissionIds: number[]) =>
  new UnprocessableEntityException([
    {
      message: 'Error.InvalidPermissionIds: ' + invalidPermissionIds.join(', '),
      path: 'permissionIds',
    },
  ])

export const ProhibitedActionOnBaseRoleException = new ForbiddenException('Error.ProhibitedActionOnBaseRole')

import { Injectable } from '@nestjs/common'
import { RoleFindManyArgs, RoleWhereInput } from 'src/generated/prisma/models'
import { InvalidPermissionIdsException } from 'src/routes/roles/roles.error'
import {
  CreateRoleBodyType,
  GetRoleDetailResType,
  GetRolesQueriesType,
  GetRolesResType,
  UpdateRoleBodyType,
} from 'src/routes/roles/roles.model'
import { SerializeAll } from 'src/shared/decorators/serialize.decorator'
import { RoleType } from 'src/shared/models/share-role.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
@SerializeAll()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isInvalidPermissionIds(permissionIds: number[]) {
    const uniquePermissionIds = [...new Set(permissionIds)]
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: uniquePermissionIds },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    })

    const validPermissionIds = new Set(permissions.map((permission) => permission.id))
    return uniquePermissionIds.filter((permissionId) => !validPermissionIds.has(permissionId))
  }
  async find(query: GetRolesQueriesType): Promise<GetRolesResType> {
    const { page, limit } = query
    const whereQuery: RoleWhereInput = { deletedAt: null }
    const queries: RoleFindManyArgs = {
      where: whereQuery,
      take: limit,
      skip: (page - 1) * limit,
    }
    const [data, totalItems] = await Promise.all([
      this.prisma.role.findMany(queries),
      this.prisma.role.count({ where: whereQuery }),
    ])

    return {
      data: data as any,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  findOne(id: number): Promise<GetRoleDetailResType | null> {
    return this.prisma.role.findUnique({
      where: { id, deletedAt: null },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
      },
    }) as any
  }

  create({ payload, createdById }: { payload: CreateRoleBodyType; createdById: number }): Promise<RoleType> {
    return this.prisma.role.create({
      data: {
        ...payload,
        createdById,
      },
    }) as any
  }

  async update({
    id,
    payload,
    updatedById,
  }: {
    id: number
    payload: UpdateRoleBodyType
    updatedById: number
  }): Promise<GetRoleDetailResType> {
    // Check if exist permissionIds has been soft deleted
    if (payload.permissionIds.length > 0) {
      const invalidPermissionIds = await this.isInvalidPermissionIds(payload.permissionIds)
      if (invalidPermissionIds.length > 0) {
        throw InvalidPermissionIdsException(invalidPermissionIds)
      }
    }

    return this.prisma.role.update({
      where: { id, deletedAt: null },
      data: {
        name: payload.name,
        description: payload.description,
        isActive: payload.isActive,
        permissions: {
          set: payload.permissionIds.map((permissionId) => ({ id: permissionId })),
        },
        updatedById,
      },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
      },
    }) as any
  }

  delete({ id, deletedById, isHard }: { id: number; deletedById: number; isHard?: boolean }) {
    if (isHard) {
      return this.prisma.role.delete({
        where: { id },
      })
    }
    return this.prisma.role.update({
      where: { id, deletedAt: null },
      data: {
        deletedById,
        deletedAt: new Date(),
      },
    })
  }
}

import { Injectable } from '@nestjs/common'
import { PermissionFindManyArgs, PermissionWhereInput } from 'src/generated/prisma/models'
import {
  CreatePermissionBodyType,
  GetPermissionDetailResType,
  GetPermissionsQueriesType,
  GetPermissionsResType,
  UpdatePermissionBodyType,
} from 'src/routes/permissions/permissions.model'
import { SerializeAll } from 'src/shared/decorators/serialize.decorator'
import { PermissionType } from 'src/shared/models/share-permission.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
@SerializeAll()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(query: GetPermissionsQueriesType): Promise<GetPermissionsResType> {
    const { page, limit } = query
    const whereQuery: PermissionWhereInput = { deletedAt: null }
    const queries: PermissionFindManyArgs = {
      where: whereQuery,
      take: limit,
      skip: (page - 1) * limit,
    }
    const [data, totalItems] = await Promise.all([
      this.prisma.permission.findMany(queries),
      this.prisma.permission.count({ where: whereQuery }),
    ])

    return {
      data: data as any,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  findOne(id: number): Promise<GetPermissionDetailResType | null> {
    return this.prisma.permission.findUnique({
      where: { id, deletedAt: null },
    }) as any
  }

  create({
    payload,
    createdById,
  }: {
    payload: CreatePermissionBodyType
    createdById: number
  }): Promise<GetPermissionDetailResType> {
    return this.prisma.permission.create({
      data: {
        ...payload,
        createdById,
      },
    }) as any
  }

  update({
    id,
    payload,
    updatedById,
  }: {
    id: number
    payload: UpdatePermissionBodyType
    updatedById: number
  }): Promise<GetPermissionDetailResType & { roles: { id: number }[] }> {
    return this.prisma.permission.update({
      where: { id, deletedAt: null },
      data: {
        ...payload,
        updatedById,
      },
      include: {
        roles: true,
      },
    }) as any
  }

  delete({
    id,
    deletedById,
    isHard,
  }: {
    id: number
    deletedById: number
    isHard?: boolean
  }): Promise<PermissionType & { roles: { id: number }[] }> {
    if (isHard) {
      return this.prisma.permission.delete({
        where: { id },
        include: {
          roles: true,
        },
      }) as any
    }
    return this.prisma.permission.update({
      where: { id, deletedAt: null },
      data: {
        deletedById,
        deletedAt: new Date(),
      },
      include: {
        roles: true,
      },
    }) as any
  }
}

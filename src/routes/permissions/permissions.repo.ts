import { Injectable } from '@nestjs/common'
import { PermissionFindManyArgs, PermissionWhereInput } from 'src/generated/prisma/models'
import {
  CreatePermissionBodyType,
  GetPermissionsQueriesType,
  GetPermissionsResType,
  UpdatePermissionBodyType,
} from 'src/routes/permissions/permissions.model'
import { SerializeAll } from 'src/shared/decorators/serialize.decorator'
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

  findOne(id: number) {
    return this.prisma.permission.findUnique({
      where: { id, deletedAt: null },
    })
  }

  create({ payload, createdById }: { payload: CreatePermissionBodyType; createdById: number }) {
    return this.prisma.permission.create({
      data: {
        ...payload,
        createdById,
      },
    })
  }

  update({ id, payload, updatedById }: { id: number; payload: UpdatePermissionBodyType; updatedById: number }) {
    return this.prisma.permission.update({
      where: { id, deletedAt: null },
      data: {
        ...payload,
        updatedById,
      },
    })
  }

  delete({ id, deletedById, isHard }: { id: number; deletedById: number; isHard?: boolean }) {
    if (isHard) {
      return this.prisma.permission.delete({
        where: { id },
      })
    }
    return this.prisma.permission.update({
      where: { id, deletedAt: null },
      data: {
        deletedById,
        deletedAt: new Date(),
      },
    })
  }
}

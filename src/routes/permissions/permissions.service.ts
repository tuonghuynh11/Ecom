import { Injectable } from '@nestjs/common'
import { PermissionAlreadyExistsException } from 'src/routes/permissions/permissions.error'
import {
  CreatePermissionBodyType,
  GetPermissionsQueriesType,
  UpdatePermissionBodyType,
} from 'src/routes/permissions/permissions.model'
import { PermissionsRepository } from 'src/routes/permissions/permissions.repo'
import { MessageResDto } from 'src/shared/dtos/response.dto'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}
  async find(query: GetPermissionsQueriesType) {
    const { page, limit } = query

    return this.permissionsRepository.find(query)
  }

  async findOne(id: number) {
    const permission = await this.permissionsRepository.findOne(id)
    if (!permission) {
      throw NotFoundRecordException
    }
    return permission
  }

  async create({ payload, createdById }: { payload: CreatePermissionBodyType; createdById: number }) {
    try {
      return await this.permissionsRepository.create({
        payload,
        createdById,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExistsException
      }
      throw error
    }
  }

  async update({ id, payload, updatedById }: { id: number; payload: UpdatePermissionBodyType; updatedById: number }) {
    try {
      return await this.permissionsRepository.update({ id, payload, updatedById })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExistsException
      }
      throw error
    }
  }

  async remove({ id, deletedById }: { id: number; deletedById: number }): Promise<MessageResDto> {
    try {
      await this.permissionsRepository.delete({ id, deletedById })
      return {
        message: 'Success.DeletePermission',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}

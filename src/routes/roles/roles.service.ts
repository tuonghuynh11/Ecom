import { Injectable } from '@nestjs/common'
import { ProhibitedActionOnBaseRoleException, RoleAlreadyExistsException } from 'src/routes/roles/roles.error'
import { CreateRoleBodyType, GetRolesQueriesType, UpdateRoleBodyType } from 'src/routes/roles/roles.model'
import { RolesRepository } from 'src/routes/roles/roles.repo'
import { RoleName } from 'src/shared/constants/role.constant'

import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class RolesService {
  constructor(private readonly RolesRepository: RolesRepository) {}
  async find(query: GetRolesQueriesType) {
    return this.RolesRepository.find(query)
  }

  async findOne(id: number) {
    const role = await this.RolesRepository.findOne(id)
    if (!role) {
      throw NotFoundRecordException
    }
    return role
  }

  async create({ payload, createdById }: { payload: CreateRoleBodyType; createdById: number }) {
    try {
      return await this.RolesRepository.create({
        payload,
        createdById,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException
      }
      throw error
    }
  }

  async update({ id, payload, updatedById }: { id: number; payload: UpdateRoleBodyType; updatedById: number }) {
    try {
      // Don't allow updating Admin role
      await this.verifyRole(id)

      return await this.RolesRepository.update({ id, payload, updatedById })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException
      }
      throw error
    }
  }

  async remove({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      const role = await this.verifyRole(id)

      // Don't allow deleting 3 system roles: Admin, Client, Seller
      const baseRoles: string[] = [RoleName.Admin, RoleName.Client, RoleName.Seller]
      if (baseRoles.includes(role.name)) {
        throw ProhibitedActionOnBaseRoleException
      }

      await this.RolesRepository.delete({ id, deletedById })
      return {
        message: 'Success.DeleteRole',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
  private async verifyRole(roleId: number) {
    const role = await this.RolesRepository.findOne(roleId)
    if (!role) {
      throw NotFoundRecordException
    }
    const baseRoles: string[] = [RoleName.Admin, RoleName.Client, RoleName.Seller]
    if (baseRoles.includes(role.name)) {
      throw ProhibitedActionOnBaseRoleException
    }
    return role
  }
}

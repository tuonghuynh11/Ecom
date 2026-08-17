import { Injectable } from '@nestjs/common'
import { RoleName } from 'src/shared/constants/role.constant'
import { RoleType } from 'src/shared/models/share-role.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedRoleRepository {
  private clientRoleId: number | null = null
  private adminRoleId: number | null = null
  private sellerRoleId: number | null = null

  constructor(private readonly prismaService: PrismaService) {}

  private async getRole(roleName: string) {
    const role: RoleType = await this.prismaService.$queryRaw`
      SELECT * 
      FROM "Role"
      WHERE "name" = ${RoleName.Client} AND "deletedAt" IS NULL
      LIMIT 1
    `.then((res: any) => {
      if (res.length === 0) {
        throw new Error(`Client role not found`)
      }
      return res[0]
    })
    return role
  }

  async getClientRoleId(): Promise<number> {
    if (this.clientRoleId) {
      return this.clientRoleId
    }
    const role = await this.getRole(RoleName.Client)
    this.clientRoleId = role.id
    return role.id
  }

  async getAdminRoleId(): Promise<number> {
    if (this.adminRoleId) {
      return this.adminRoleId
    }
    const role = await this.getRole(RoleName.Admin)
    this.adminRoleId = role.id
    return role.id
  }
  async getSellerRoleId(): Promise<number> {
    if (this.sellerRoleId) {
      return this.sellerRoleId
    }
    const role = await this.getRole(RoleName.Seller)
    this.sellerRoleId = role.id
    return role.id
  }
}

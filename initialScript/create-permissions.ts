import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod } from 'src/generated/prisma/enums'
import { RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

const SellerModules = ['AUTH', 'MEDIA', 'MANAGE-PRODUCT', 'PRODUCT-TRANSLATION', 'PROFILE']

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router

  const permissionsInDb = await prisma.permission.findMany({ where: { deletedAt: null } })

  const availableRoutes: { method: keyof typeof HTTPMethod; path: string; name: string; module: string }[] =
    router.stack
      .map((layer) => {
        if (layer.route) {
          const path = layer.route.path
          const method = String(layer.route.stack[0].method).toUpperCase() as keyof typeof HTTPMethod
          const moduleName = String(path.split('/')[1]).toUpperCase() || 'DEFAULT'
          return {
            path: `/api${path}`,
            method,
            name: method + ' ' + path,
            module: moduleName,
          }
        }
      })
      .filter((item) => item !== undefined)

  // Create object permissionInDbMap with key as [method-path]
  const permissionsInDbMap: Record<string, (typeof permissionsInDb)[0]> = permissionsInDb.reduce((acc, permission) => {
    const key = `${permission.method}-${permission.path}`
    acc[key] = permission
    return acc
  }, {})

  // Create object availableRoutesMap with key as [method-path]
  const availableRoutesMap: Record<string, (typeof availableRoutes)[0]> = availableRoutes.reduce((acc, route) => {
    const key = `${route.method}-${route.path}`
    acc[key] = route
    return acc
  }, {})

  // Find new permissions to create
  const permissionsToCreate = availableRoutes.filter((route) => {
    return !permissionsInDbMap[`${route.method}-${route.path}`]
  })

  // Find permissions to delete
  const permissionsToDelete = permissionsInDb.filter((permission) => {
    return !availableRoutesMap[`${permission.method}-${permission.path}`]
  })

  // If there are new permissions to create, insert them into the database
  if (permissionsToCreate.length > 0) {
    // Add new permissions and skip duplicates
    const createResult = await prisma.permission.createMany({
      data: permissionsToCreate,
      skipDuplicates: true,
    })

    console.info('Created permissions count: ', createResult.count, ' items')
  } else {
    console.info('No new permissions to create')
  }

  // If there are permissions to delete, remove them from the database
  if (permissionsToDelete.length > 0) {
    // Delete permissions that are no longer available
    const deleteResult = await prisma.permission.deleteMany({
      where: {
        id: {
          in: permissionsToDelete.map((p) => p.id),
        },
      },
    })
    console.info('Deleted permissions count: ', deleteResult.count, ' items')
  } else {
    console.info('No permissions to delete')
  }

  // Sync permissions with Admin roles
  // Get all permissions from the database
  const updatedPermissionInDb = await prisma.permission.findMany({ where: { deletedAt: null } })

  const adminRolePermissionIds = updatedPermissionInDb.map((permission) => ({ id: permission.id }))

  const sellerRolePermissionIds = updatedPermissionInDb
    .filter((permission) => SellerModules.includes(permission.module))
    .map((permission) => ({ id: permission.id }))
  await Promise.all([
    updateRolePermissions(adminRolePermissionIds, RoleName.Admin),
    updateRolePermissions(sellerRolePermissionIds, RoleName.Seller),
  ])
  process.exit(0)
}

const updateRolePermissions = async (permissionIds: { id: number }[], roleName: string) => {
  // Sync permissions with role
  const role = await prisma.role.findFirstOrThrow({
    where: { name: roleName },
  })
  if (!role) {
    console.error(`${roleName} role not found. Please create a ${roleName} role first.`)
    process.exit(1)
  }
  // Update Admin role with all permissions
  await prisma.role.update({
    where: { id: role.id },
    data: {
      permissions: {
        set: permissionIds,
      },
    },
  })

  console.info(
    `${roleName} role permissions updated successfully with all available permissions: ${permissionIds.length}`,
  )
}

bootstrap()

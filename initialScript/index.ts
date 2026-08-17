import envConfig from '../src/shared/config'
import { RoleName } from '../src/shared/constants/role.constant'
import { HashingService } from '../src/shared/services/hashing.service'
import { PrismaService } from '../src/shared/services/prisma.service'

const prisma = new PrismaService()
const hashService = new HashingService()

const ROLE_SEED_DATA = [
  {
    name: RoleName.Admin,
    description: 'Admin role',
  },
  {
    name: RoleName.Client,
    description: 'Client role',
  },
  {
    name: RoleName.Seller,
    description: 'Seller role',
  },
]

const main = async () => {
  const roleCount = await prisma.role.count()
  if (roleCount > 0) {
    throw new Error('Roles already exist')
  }

  const roles = await prisma.role.createMany({
    data: [...ROLE_SEED_DATA],
  })

  const adminRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Admin,
    },
  })

  const hashPassword = await hashService.hash(envConfig.ADMIN_PASSWORD)
  const adminUser = await prisma.user.create({
    data: {
      email: envConfig.ADMIN_EMAIL,
      password: hashPassword,
      name: envConfig.ADMIN_NAME,
      phoneNumber: envConfig.ADMIN_PHONE_NUMBER,
      roleId: adminRole.id,
    },
  })
  return {
    createRoles: roles.count,
    adminUser,
  }
}

main()
  .then(({ adminUser, createRoles }) => {
    console.log(`Created ${createRoles} roles`)
    console.log(`Created admin user: ${adminUser.email}`)
  })
  .catch(console.error)

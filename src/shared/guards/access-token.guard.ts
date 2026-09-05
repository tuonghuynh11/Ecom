import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql'
import type { Cache } from 'cache-manager'
import { keyBy } from 'lodash'
import { RolePermissionsType } from 'src/shared/models/share-role.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'
import { REQUEST_ROLE_PERMISSIONS, REQUEST_USER_KEY } from '../constants/auth.constant'
import { TokenService } from '../services/token.service'

type Permission = RolePermissionsType['permissions'][number]
type CachedRole = RolePermissionsType & {
  permissions: {
    [key: string]: Permission
  }
}
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request: any
    let isGraphql: boolean = false
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context)
      request = gqlCtx.getContext().req
      isGraphql = true
    } else {
      request = context.switchToHttp().getRequest<Request>()
    }

    // Extract and validate the access token from the request headers
    const decodedAccessToken = await this.extractAndValidateToken(request)
    await this.validateUserPermission(decodedAccessToken, request, isGraphql)
    return true
  }

  private async extractAndValidateToken(request: any): Promise<AccessTokenPayload> {
    const accessToken = await this.extractAccessTokenFromHeader(request)

    try {
      const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decodedAccessToken
      return decodedAccessToken
    } catch {
      throw new UnauthorizedException('Error.InvalidAccessToken')
    }
  }

  private extractAccessTokenFromHeader(request: any): Promise<string> {
    const accessToken = request.headers['authorization']?.split(' ')[1]
    if (!accessToken) {
      throw new UnauthorizedException('Error.MissingAccessToken')
    }
    return accessToken
  }

  private async validateUserPermission(
    decodedAccessToken: AccessTokenPayload,
    request: any,
    isGraphql: boolean,
  ): Promise<void> {
    const { roleId } = decodedAccessToken
    // Current path and method
    const path = isGraphql ? request.baseUrl : request.route.path
    const method = request.method

    const cacheKey = `role:${roleId}`

    //1. Check if the role permissions are cached
    let cachedRole = await this.cacheManager.get<CachedRole>(cacheKey)
    console.log('CachedRole:', cachedRole)
    if (cachedRole === undefined) {
      // 2. If not cached, fetch the role and permissions from the database
      const role = (await this.prismaService.role
        .findUniqueOrThrow({
          where: {
            id: roleId,
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: {
              where: {
                deletedAt: null,
              },
            },
          },
        })
        .catch(() => {
          throw new ForbiddenException('Error.Forbidden')
        })) as unknown as RolePermissionsType
      const permissionObject = keyBy(
        role.permissions,
        (permission) => `${permission.path}:${permission.method}`,
      ) as CachedRole['permissions']
      cachedRole = { ...role, permissions: permissionObject }
      await this.cacheManager.set(cacheKey, cachedRole, 1000 * 60 * 60) // Cache for 1 hour

      request[REQUEST_ROLE_PERMISSIONS] = role
    }

    // 3. Kiểm tra quyền truy cập
    const canAccess: Permission | undefined = cachedRole.permissions[`${path}:${method}`]
    if (!canAccess) {
      throw new ForbiddenException()
    }
  }
}

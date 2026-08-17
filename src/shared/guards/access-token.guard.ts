import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'
import { REQUEST_USER_KEY } from '../constants/auth.constant'
import { TokenService } from '../services/token.service'
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    // Extract and validate the access token from the request headers
    const decodedAccessToken = await this.extractAndValidateToken(request)
    await this.validateUserPermission(decodedAccessToken, request)
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

  private async validateUserPermission(decodedAccessToken: AccessTokenPayload, request: any): Promise<void> {
    const { roleId } = decodedAccessToken
    // Current path and method
    const path = request.route.path
    const method = request.method

    // Check if the user has permission for the current route
    const role = await this.prismaService.role
      .findUniqueOrThrow({
        where: {
          id: roleId,
          deletedAt: null,
        },
        include: {
          permissions: {
            where: {
              deletedAt: null,
              path,
              method,
            },
          },
        },
      })
      .catch(() => {
        throw new ForbiddenException('Error.Forbidden')
      })
    const canAccess = role.permissions.length > 0
    if (!canAccess) {
      throw new ForbiddenException('Error.Forbidden')
    }
  }
}

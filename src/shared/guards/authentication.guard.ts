import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PaymentAPIKeyGuard } from 'src/shared/guards/payment-api-key.guard'
import { AuthType, ConditionGuard } from '../constants/auth.constant'
import { AUTH_TYPE_KEY, AuthTypeDecoratorPayload } from '../decorators/auth.decorator'
import { AccessTokenGuard } from './access-token.guard'
@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly authTypeGuardMap: Record<string, CanActivate>
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly paymentAPIKeyGuard: PaymentAPIKeyGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.PaymentAPIKey]: this.paymentAPIKeyGuard,
      [AuthType.None]: {
        canActivate: () => true,
      },
    }
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.getAuthTypeValue(context)

    const guards = authTypeValue.authTypes.map((authType) => this.authTypeGuardMap[authType])

    return authTypeValue.options.conditions === ConditionGuard.And
      ? this.handleAndCondition(guards, context)
      : this.handleOrCondition(guards, context)
  }

  private getAuthTypeValue(context: ExecutionContext): AuthTypeDecoratorPayload {
    const authTypeValue = this.reflector.getAllAndOverride<AuthTypeDecoratorPayload | undefined>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? { authTypes: [AuthType.Bearer], options: { conditions: ConditionGuard.And } }
    return authTypeValue
  }

  private async handleOrCondition(guards: CanActivate[], context: ExecutionContext): Promise<boolean> {
    let lastError: any = null

    for (const instance of guards) {
      try {
        const canActive = await instance.canActivate(context)
        if (canActive) {
          return true
        }
      } catch (err) {
        lastError = err
      }
    }
    if (lastError instanceof HttpException) {
      throw lastError
    }
    throw new UnauthorizedException()
  }
  private async handleAndCondition(guards: CanActivate[], context: ExecutionContext): Promise<boolean> {
    for (const instance of guards) {
      try {
        const canActive = await instance.canActivate(context)
        if (!canActive) {
          throw new UnauthorizedException()
        }
      } catch (err) {
        if (err instanceof HttpException) {
          throw err
        }
        throw new UnauthorizedException()
      }
    }
    return true
  }
}

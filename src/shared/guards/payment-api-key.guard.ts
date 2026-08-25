import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import envConfig from '../config'
@Injectable()
export class PaymentAPIKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const xAPIKey = request.headers['payment-api-key']

    if (xAPIKey !== envConfig.PAYMENT_SECRET_API_KEY) {
      throw new UnauthorizedException()
    }
    return true
  }
}

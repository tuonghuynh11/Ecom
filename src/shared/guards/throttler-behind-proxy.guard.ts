import { ExecutionContext, Injectable } from '@nestjs/common'
import { GqlContextType } from '@nestjs/graphql'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  canActivate(context: ExecutionContext): Promise<boolean> {
    // Bỏ qua throttler cho các request GraphQL
    if (context.getType<GqlContextType>() === 'graphql') {
      return Promise.resolve(true)
    }
    return super.canActivate(context)
  }
  protected getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip // individualize IP extraction to meet your own needs
  }
}

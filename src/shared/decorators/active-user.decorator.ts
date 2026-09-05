import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'
import { REQUEST_USER_KEY } from '../constants/auth.constant'
export const ActiveUser = createParamDecorator(
  (field: keyof AccessTokenPayload | undefined, context: ExecutionContext) => {
    let request: any
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context)
      request = gqlCtx.getContext().req
    } else {
      request = context.switchToHttp().getRequest<Request>()
    }
    const user: AccessTokenPayload | undefined = request[REQUEST_USER_KEY]
    return field ? user?.[field] : user
  },
)

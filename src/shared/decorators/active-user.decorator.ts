import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'
import { REQUEST_USER_KEY } from '../constants/auth.constant'
export const ActiveUser = createParamDecorator(
  (field: keyof AccessTokenPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    const user: AccessTokenPayload | undefined = request[REQUEST_USER_KEY]
    return field ? user?.[field] : user
  },
)

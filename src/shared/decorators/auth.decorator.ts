import { SetMetadata } from '@nestjs/common'
import { AuthType, AuthTypeValue, ConditionGuard, ConditionGuardValue } from '../constants/auth.constant'

export const AUTH_TYPE_KEY = 'authType'

export type AuthTypeDecoratorPayload = {
  authTypes: AuthTypeValue[]
  options: {
    conditions: ConditionGuardValue
  }
}

export const Auth = (
  authTypes: AuthTypeValue[],
  options?: {
    conditions: ConditionGuardValue
  },
) => {
  return SetMetadata(AUTH_TYPE_KEY, {
    authTypes,
    options: options ?? {
      conditions: ConditionGuard.And,
    },
  })
}

export const IsPublic = () => Auth([AuthType.None])

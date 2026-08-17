import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { RoleSchema } from 'src/shared/models/share-role.model'
import { UserSchema } from 'src/shared/models/shared-user.model'
import z from 'zod'

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
  phoneNumber: true,
})
  .extend({
    confirmPassword: z.string().min(6).max(600),
    code: z.string().length(6),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password do not match',
        path: ['confirmPassword'],
      })
    }
  })

export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
})

export const VerificationCodeSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  code: z.string().length(6),
  type: z.enum([
    TypeOfVerificationCode.REGISTER,
    TypeOfVerificationCode.FORGOT_PASSWORD,
    TypeOfVerificationCode.LOGIN,
    TypeOfVerificationCode.DISABLE_2FA,
  ]),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const SendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
})

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
})
  .extend({
    totpCode: z.string().length(6).optional(), // 2FA code
    code: z.string().length(6).optional(), // OTP code
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    const message = 'You need to provide either a TOTP code or an OTP code to login. Not provide both'
    if (totpCode !== undefined && code !== undefined) {
      ctx.addIssue({
        path: ['totpCode'],
        code: 'custom',
        message,
      })
      ctx.addIssue({
        path: ['code'],
        code: 'custom',
        message,
      })
    }
  })

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string(),
  })
  .strict()

export const RefreshTokenResSchema = LoginResSchema

export const DeviceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.date(),
  createdAt: z.date(),
  isActive: z.boolean(),
})

export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  deviceId: z.number(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const LogoutBodySchema = RefreshTokenBodySchema

export const GoogleAuthStateSchema = DeviceSchema.pick({
  userAgent: true,
  ip: true,
})

export const GetAuthorizationUrlResSchema = z.object({
  url: z.url(),
})

export const ForgotPasswordBodySchema = z
  .object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100),
  })

  .strict()
  .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password do not match',
        path: ['confirmNewPassword'],
      })
    }
  })

export const DisableTwoFactorBodySchema = z
  .object({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    const message = 'You need to provide either a TOTP code or an OTP code to disable 2FA. Not provide both'

    // Nếu cả hai đều được cung cấp hoặc cả hai đều không được cung cấp, thì thêm lỗi vào context
    if ((totpCode !== undefined) === (code !== undefined)) {
      ctx.addIssue({
        path: ['totpCode'],
        code: 'custom',
        message,
      })
      ctx.addIssue({
        path: ['code'],
        code: 'custom',
        message,
      })
    }
  })

export const TwoFactorSetupResSchema = z.object({
  secret: z.string(),
  uri: z.string(),
})

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>

export type RegisterResType = z.infer<typeof RegisterResSchema>

export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>

export type SendOtpBodyType = z.infer<typeof SendOTPBodySchema>

export type LoginBodyType = z.infer<typeof LoginBodySchema>

export type LoginResType = z.infer<typeof LoginResSchema>

export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>

export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>

export type RefreshTokenResType = LoginResType

export type DeviceType = z.infer<typeof DeviceSchema>

export type RoleType = z.infer<typeof RoleSchema>

export type LogoutBodyType = RefreshTokenBodyType

export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>

export type DisableTwoFactorBodyType = z.infer<typeof DisableTwoFactorBodySchema>

export type TwoFactorSetupResType = z.infer<typeof TwoFactorSetupResSchema>

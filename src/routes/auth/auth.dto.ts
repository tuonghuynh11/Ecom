import { createZodDto } from 'nestjs-zod'
import {
  DisableTwoFactorBodySchema,
  ForgotPasswordBodySchema,
  GetAuthorizationUrlResSchema,
  LoginBodySchema,
  LoginResSchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RefreshTokenResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOTPBodySchema,
  TwoFactorSetupResSchema,
} from 'src/routes/auth/auth.model'

export class RegisterBodyDto extends createZodDto(RegisterBodySchema) {}

export class RegisterResDto extends createZodDto(RegisterResSchema) {}

export class SendOtpBodyDto extends createZodDto(SendOTPBodySchema) {}

export class LoginBodyDto extends createZodDto(LoginBodySchema) {}

export class LoginResDto extends createZodDto(LoginResSchema) {}

export class RefreshTokenBodyDto extends createZodDto(RefreshTokenBodySchema) {}

export class RefreshTokenResDto extends createZodDto(RefreshTokenResSchema) {}

export class LogoutBodyDto extends createZodDto(LogoutBodySchema) {}

export class GetAuthorizationUrlResDto extends createZodDto(GetAuthorizationUrlResSchema) {}

export class ForgotPasswordBodyDto extends createZodDto(ForgotPasswordBodySchema) {}

export class DisableTwoFactorBodyDto extends createZodDto(DisableTwoFactorBodySchema) {}

export class TwoFactorSetupResDto extends createZodDto(TwoFactorSetupResSchema) {}

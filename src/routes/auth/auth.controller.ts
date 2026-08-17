import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Query, Res, UseGuards } from '@nestjs/common'

import { ZodSerializerDto } from 'nestjs-zod'
import {
  DisableTwoFactorBodyDto,
  ForgotPasswordBodyDto,
  GetAuthorizationUrlResDto,
  LoginBodyDto,
  LoginResDto,
  LogoutBodyDto,
  RefreshTokenBodyDto,
  RefreshTokenResDto,
  RegisterBodyDto,
  RegisterResDto,
  SendOtpBodyDto,
  TwoFactorSetupResDto,
} from 'src/routes/auth/auth.dto'
import { GoogleService } from 'src/routes/auth/google.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'
import { MessageResDto } from 'src/shared/dtos/response.dto'
import { AccessTokenGuard } from '../../shared/guards/access-token.guard'
import { AuthService } from './auth.service'

import type { Response } from 'express'
import envConfig from 'src/shared/config'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { EmptyBodyDto } from 'src/shared/dtos/request.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResDto)
  register(@Body() body: RegisterBodyDto) {
    return this.authService.register(body)
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDto)
  sendOtp(@Body() body: SendOtpBodyDto) {
    return this.authService.sendOtp(body)
  }

  @Post('login')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LoginResDto)
  login(@Body() body: LoginBodyDto, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.login({
      ...body,
      userAgent,
      ip,
    })
  }

  @UseGuards(AccessTokenGuard)
  @Post('refresh-token')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(RefreshTokenResDto)
  refreshToken(@Body() body: RefreshTokenBodyDto, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.refreshToken({
      refreshToken: body.refreshToken,
      userAgent,
      ip,
    })
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDto)
  logout(@Body() body: LogoutBodyDto) {
    return this.authService.logout(body)
  }

  @Get('google-link')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizationUrlResDto)
  getGoogleLink(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.googleService.getAuthorizationUrl({
      userAgent,
      ip,
    })
  }

  @Get('google/callback')
  @IsPublic()
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      const tokens = await this.googleService.googleCallback({ code, state })
      const redirectUrl = `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
      return res.redirect(redirectUrl)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error occurred during login by Google. Please try again by another method'
      return res.redirect(`${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?errorMessage=${encodeURIComponent(message)}`)
    }
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDto)
  forgotPassword(@Body() body: ForgotPasswordBodyDto) {
    return this.authService.forgotPassword(body)
  }

  // Tại sao không dùng GET mà dùng POST? khi mà body gửi lên là {}
  // Vì POST mang ý nghĩa là tạo ra cái gì đó và POST cũng bảo mật hơn GET
  // Vì GET có thể được kích hoạt thông qua URL trên trình duyệt, POST thì không
  @Post('2fa/setup')
  @ZodSerializerDto(TwoFactorSetupResDto)
  setupTwoFactorAuth(@Body() _: EmptyBodyDto, @ActiveUser('userId') userId: number) {
    return this.authService.setupTwoFactorAuth({ userId })
  }

  @Post('2fa/disable')
  @ZodSerializerDto(MessageResDto)
  disableTwoFactorAuth(@Body() body: DisableTwoFactorBodyDto, @ActiveUser('userId') userId: number) {
    return this.authService.disableTwoFactorAuth({ ...body, userId })
  }
}

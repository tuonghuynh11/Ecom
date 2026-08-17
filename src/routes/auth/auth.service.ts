/* eslint-disable @typescript-eslint/await-thenable */
import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import ms, { StringValue } from 'ms'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidPasswordException,
  InvalidTOTPAndCodeException,
  InvalidTOTPException,
  OTPExpiredException,
  RefreshTokenAlreadyUsedException,
  TOTPAlreadyEnabledException,
  TOTPNotEnabledException,
} from 'src/routes/auth/auth.error'
import {
  DisableTwoFactorBodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  LogoutBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOtpBodyType,
  VerificationCodeType,
} from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { RoleService } from 'src/routes/auth/role.service'
import envConfig from 'src/shared/config'
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { TwoFactorAuthService } from 'src/shared/services/2fa.service'
import { EmailService } from 'src/shared/services/email.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly roleService: RoleService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeOfVerificationCodeType
  }): Promise<VerificationCodeType> {
    // 1. Find OTP code
    const verificationCode = await this.authRepository.findUniqueVerificationCode({
      email_type: {
        email,
        type,
      },
    })

    if (!verificationCode || verificationCode.code !== code) {
      throw InvalidOTPException
    }

    // 2. Check OTP code is expired or not
    if (verificationCode.expiresAt < new Date()) {
      throw OTPExpiredException
    }
    return verificationCode
  }
  async register(body: RegisterBodyType) {
    try {
      // 1. Find OTP code
      await this.validateVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.REGISTER,
      })

      const [hashedPassword, roleId] = await Promise.all([
        this.hashingService.hash(body.password),
        this.roleService.getClientRoleId(),
      ])

      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          name: body.name,
          phoneNumber: body.phoneNumber,
          password: hashedPassword,
          roleId,
        }),
        // 3. Delete OTP code after register successfully
        this.authRepository.deleteVerificationCode({
          email_type: {
            email: body.email,
            code: body.code,
            type: TypeOfVerificationCode.REGISTER,
          },
        }),
      ])
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistsException
      }
      throw error
    }
  }
  async sendOtp(payload: SendOtpBodyType) {
    // 1. Kiểm tra email có tồn tại trong database không
    const user = await this.sharedUserRepository.findUnique({
      email: payload.email,
    })

    if (payload.type === TypeOfVerificationCode.REGISTER && user) {
      throw EmailAlreadyExistsException
    }

    if (payload.type === TypeOfVerificationCode.FORGOT_PASSWORD && !user) {
      throw EmailNotFoundException
    }

    // 2. Tạo OTP code
    const otp = generateOTP(6)

    await this.authRepository.createVerificationCode({
      code: otp.toString(),
      email: payload.email,
      type: payload.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as StringValue)),
    })

    //3. Gửi OTP code về email
    const { error } = await this.emailService.sendOTP({
      email: payload.email,
      code: otp.toString(),
    })

    if (error) {
      throw FailedToSendOTPException
    }
    return {
      message: 'Send OTP successfully',
    }
  }

  async login(
    body: LoginBodyType & {
      userAgent: string
      ip: string
    },
  ) {
    //1. Kiểm tra user có tồn tại không, mật khẩu có đúng không
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    })

    if (!user) {
      throw EmailNotFoundException
    }
    const isPasswordCorrect = await this.hashingService.compare(body.password, user.password)

    if (!isPasswordCorrect) {
      throw InvalidPasswordException
    }

    // 2. Nếu User có bật 2FA thì kiểm tra TOTP code hoặc OTP code có hợp lệ không
    if (user.totpSecret) {
      // Nếu cả hai đều không được cung cấp, thì ném ra lỗi
      if (!body.totpCode && !body.code) {
        throw InvalidTOTPAndCodeException
      }

      // Kiểm tra TOTP code có hợp lệ không nếu được cung cấp
      if (body.totpCode) {
        const isValid = this.twoFactorAuthService.verifyTOTP({
          email: body.email,
          token: body.totpCode,
          secret: user.totpSecret,
        })
        if (!isValid) {
          throw InvalidTOTPException
        }
      } else if (body.code) {
        // Kiểm tra OTP code có hợp lệ không nếu được cung cấp
        await this.validateVerificationCode({
          email: body.email,
          code: body.code,
          type: TypeOfVerificationCode.LOGIN,
        })
      }
    }

    // 3. Tạo Device
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
      lastActive: new Date(),
      isActive: true,
    })

    // 4. Tạo accessToken và refreshToken
    const tokens = await this.generateTokens({
      deviceId: device.id,
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })

    return tokens
  }

  async generateTokens({ deviceId, userId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({ userId }),
    ])
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)

    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: new Date(
        decodedRefreshToken.exp * 1000, // Convert seconds to milliseconds
      ),
      deviceId,
    })
    return {
      accessToken,
      refreshToken,
    }
  }

  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)

      // 2. Kiểm tra refreshToken có tồn tại trong database không
      const refreshTokenInDb = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
        token: refreshToken,
      })

      if (!refreshTokenInDb) {
        throw RefreshTokenAlreadyUsedException
      }
      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenInDb
      // 3. Cập nhật Device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        ip,
        userAgent,
      })
      // 4. Xóa refreshToken cũ
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })

      // 5. Tạo mới accessToken và refreshToken
      const $tokens = this.generateTokens({
        userId,
        deviceId,
        roleId,
        roleName,
      })

      const [tokens, ,] = await Promise.all([$tokens, $updateDevice, $deleteRefreshToken])

      return tokens
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      throw new UnauthorizedException()
    }
  }
  async logout(payload: LogoutBodyType) {
    const { refreshToken } = payload
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken)

      // 2. Xóa refreshToken
      const { deviceId } = await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })
      // 3. Cập nhật Device đã logout
      await this.authRepository.updateDevice(deviceId, {
        isActive: false,
      })
      return {
        message: 'Logout successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw RefreshTokenAlreadyUsedException
      }

      throw new UnauthorizedException()
    }
  }

  async forgotPassword(payload: ForgotPasswordBodyType) {
    const { code, newPassword, email } = payload
    try {
      // 1. Kiểm tra emai có tồn tại không
      const user = await this.authRepository.findUniqueUserIncludeRole({
        email,
      })
      if (!user) {
        throw EmailNotFoundException
      }
      // 2. Kiểm tra OTP code có valid không
      await this.validateVerificationCode({
        email,
        code,
        type: TypeOfVerificationCode.FORGOT_PASSWORD,
      })

      // 3. Hash new password
      const hashedPassword = await this.hashingService.hash(newPassword)

      // 4. Update password and delete verification code
      await Promise.all([
        this.authRepository.updateUser({ id: user.id }, { password: hashedPassword }),
        this.authRepository.deleteVerificationCode({
          email_type: {
            email,
            code,
            type: TypeOfVerificationCode.FORGOT_PASSWORD,
          },
        }),
      ])
      return {
        message: 'Reset password successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw RefreshTokenAlreadyUsedException
      }

      throw error
    }
  }

  async setupTwoFactorAuth({ userId }: { userId: number }) {
    // 1. Lấy thông tin user,  Kiểm tra user có tồn tại không, và đã bật 2FA chưa
    const user = await this.authRepository.findUniqueUserIncludeRole({ id: userId })
    if (!user) {
      throw EmailNotFoundException
    }

    if (user.totpSecret) {
      throw TOTPAlreadyEnabledException
    }

    // 2. Nếu chưa bật 2FA thì tạo TOTP secret và uri
    const { secret, uri } = this.twoFactorAuthService.generateTOTPSecret(user.email)

    // 3. Lưu TOTP secret vào database
    await this.authRepository.updateUser({ id: userId }, { totpSecret: secret })

    // 4. Tra về TOTP secret và uri cho client để tạo QR code
    return { secret, uri }
  }

  async disableTwoFactorAuth(data: { userId: number } & DisableTwoFactorBodyType) {
    const { userId, totpCode, code } = data
    // 1. Lấy thông tin user,  Kiểm tra user có tồn tại không, và đã bật 2FA chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw EmailNotFoundException
    }

    if (!user.totpSecret) {
      throw TOTPNotEnabledException
    }

    // 2. Kiểm tra TOTP code hoặc OTP code có hợp lệ không
    if (totpCode) {
      const isValid = this.twoFactorAuthService.verifyTOTP({
        email: user.email,
        token: totpCode,
        secret: user.totpSecret,
      })
      if (!isValid) {
        throw InvalidTOTPException
      }
    } else if (code) {
      // 3.  Kiểm tra OTP code có hợp lệ không nếu được cung cấp
      await this.validateVerificationCode({
        email: user.email,
        code,
        type: TypeOfVerificationCode.DISABLE_2FA,
      })
    }
    // 3. Nếu đã bật 2FA thì cập nhật TOTP secret trong database về null để tắt 2FA
    await this.authRepository.updateUser({ id: userId }, { totpSecret: null })

    return { message: 'Disable 2FA successfully' }
  }
}

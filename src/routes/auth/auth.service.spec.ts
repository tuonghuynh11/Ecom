import { Test, TestingModule } from '@nestjs/testing'
import { InvalidOTPException, OTPExpiredException } from 'src/routes/auth/auth.error'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { AuthService } from 'src/routes/auth/auth.service'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { TwoFactorAuthService } from 'src/shared/services/2fa.service'
import { EmailService } from 'src/shared/services/email.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'

// Phải mock uuid vì trong AuthService có sử dụng uuid để tạo deviceId,
// nếu không mock thì khi chạy test sẽ bị lỗi vì uuid không được import đúng cách.
// Lý do: uuid sử dụng ESM module, trong khi Jest mặc định sử dụng CommonJS, dẫn đến việc import uuid không thành công.
jest.mock('uuid', () => ({
  __esModule: true,
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}))

describe('AuthService', () => {
  let authService: AuthService
  const mockAuthRepository = {
    createUser: jest.fn(),
    createUserIncludeRole: jest.fn(),
    createVerificationCode: jest.fn(),
    findUniqueVerificationCode: jest.fn(),
    createRefreshToken: jest.fn(),
    createDevice: jest.fn(),
    findUniqueUserIncludeRole: jest.fn(),
    findUniqueRefreshTokenIncludeUserRole: jest.fn(),
    updateDevice: jest.fn(),
    deleteRefreshToken: jest.fn(),
    deleteVerificationCode: jest.fn(),
  }

  const mockHashingService = {
    hash: jest.fn(),
    compare: jest.fn(),
  }
  const mockTokenService = {
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  }
  const mockSharedRoleRepository = {
    getRole: jest.fn(),
    getClientRoleId: jest.fn(),
    getAdminRoleId: jest.fn(),
    getSellerRoleId: jest.fn(),
  }
  const mockSharedUserRepository = {
    findUnique: jest.fn(),
    findUniqueIncludeRolePermissions: jest.fn(),
    update: jest.fn(),
  }
  const mockEmailService = {
    sendOTP: jest.fn(),
  }
  const mockTwoFactorAuthService = {
    createTOTP: jest.fn(),
    generateTOTPSecret: jest.fn(),
    verifyTOTP: jest.fn(),
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },

        {
          provide: HashingService,
          useValue: mockHashingService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: SharedRoleRepository,
          useValue: mockSharedRoleRepository,
        },
        {
          provide: SharedUserRepository,
          useValue: mockSharedUserRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TwoFactorAuthService,
          useValue: mockTwoFactorAuthService,
        },
      ],
    }).compile()

    authService = app.get<AuthService>(AuthService)
  })

  describe('validateVerificationCode', () => {
    const mockVerificationCodePayload = {
      email: 'test@example.com',
      code: '123456',
      type: TypeOfVerificationCode.REGISTER,
    }
    it('should validate verification code successfully', async () => {
      const mockResultPayload = {
        id: 1,
        ...mockVerificationCodePayload,
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
      }
      mockAuthRepository.findUniqueVerificationCode.mockResolvedValue(mockResultPayload)

      const result = await authService.validateVerificationCode(mockVerificationCodePayload)

      expect(result).toEqual(mockResultPayload)
    })
    it('should throw InvalidOTPException if code not exists in database', async () => {
      mockAuthRepository.findUniqueVerificationCode.mockResolvedValue(null)

      await expect(authService.validateVerificationCode(mockVerificationCodePayload)).rejects.toThrow(
        InvalidOTPException,
      )
    })
    it('should throw InvalidOTPException if code different from the one in database', async () => {
      const mockResultPayload = {
        id: 1,
        ...mockVerificationCodePayload,
        code: '123221',
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
      }
      mockAuthRepository.findUniqueVerificationCode.mockResolvedValue(mockResultPayload)

      await expect(authService.validateVerificationCode(mockVerificationCodePayload)).rejects.toThrow(
        InvalidOTPException,
      )
    })
    it('should throw OTPExpiredException if code is expired', async () => {
      const mockResultPayload = {
        id: 1,
        ...mockVerificationCodePayload,
        code: '123221',
        expiresAt: new Date(Date.now() - 10000),
        createdAt: new Date(),
      }
      mockAuthRepository.findUniqueVerificationCode.mockResolvedValue(mockResultPayload)

      await expect(authService.validateVerificationCode(mockVerificationCodePayload)).rejects.toThrow(
        OTPExpiredException,
      )
    })
  })
})

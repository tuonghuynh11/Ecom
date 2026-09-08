import { Test, TestingModule } from '@nestjs/testing'
import { Prisma } from 'src/generated/prisma/client'
import { EmailAlreadyExistsException, InvalidOTPException, OTPExpiredException } from 'src/routes/auth/auth.error'
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

  afterEach(() => {
    // Clear All Mocks after each test to avoid interference between tests
    jest.clearAllMocks()
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

  describe('register', () => {
    const mockVerificationCodeResult = {
      id: 1,
      email: 'test@example.com',
      code: '123456',
      type: TypeOfVerificationCode.REGISTER,
      expiresAt: new Date(Date.now() + 10000).toISOString(),
      createdAt: new Date().toISOString(),
    }

    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      phoneNumber: '1234567890',
      code: '123456',
    }

    const mockNewUser = {
      id: 1,
      ...registerData,
      roleId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Happy Path
    it('should register a new user successfully', async () => {
      jest.spyOn(authService, 'validateVerificationCode').mockResolvedValue(mockVerificationCodeResult)

      mockSharedRoleRepository.getClientRoleId.mockResolvedValue(1)
      mockHashingService.hash.mockResolvedValue('hashedPassword')
      mockAuthRepository.createUser.mockResolvedValue(mockNewUser)
      mockAuthRepository.deleteVerificationCode.mockResolvedValue(undefined)

      const result = await authService.register(registerData)

      expect(result).toEqual(mockNewUser)

      expect(mockHashingService.hash).toHaveBeenCalledWith(registerData.password)
      expect(mockAuthRepository.createUser).toHaveBeenCalled()
      expect(mockAuthRepository.deleteVerificationCode).toHaveBeenCalled()
    })
    it('should throw UserAlreadyExistsException if email already exists', async () => {
      jest.spyOn(authService, 'validateVerificationCode').mockResolvedValue(mockVerificationCodeResult)

      mockSharedRoleRepository.getClientRoleId.mockResolvedValue(1)
      mockHashingService.hash.mockResolvedValue('hashedPassword')
      mockAuthRepository.createUser.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unprocessable Entity Exception', {
          code: 'P2002',
          clientVersion: '6.0.3',
        }),
      )
      mockAuthRepository.deleteVerificationCode.mockResolvedValue(undefined)

      await expect(authService.register(registerData)).rejects.toThrow(EmailAlreadyExistsException)
    })

    it('should throw error when validate verification code fails', async () => {
      jest.spyOn(authService, 'validateVerificationCode').mockRejectedValue(mockVerificationCodeResult)

      await expect(authService.register(registerData)).rejects.toBeDefined()

      // verify that the other methods were not called since validation failed
      expect(mockHashingService.hash).not.toHaveBeenCalled()
      expect(mockSharedRoleRepository.getClientRoleId).not.toHaveBeenCalled()
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled()
      expect(mockAuthRepository.deleteVerificationCode).not.toHaveBeenCalled()
    })
  })
})

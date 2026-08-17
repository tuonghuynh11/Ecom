import { Injectable } from '@nestjs/common'
import { google } from 'googleapis'
import { OAuth2Client } from 'googleapis-common'
import { GoogleUserInfoError } from 'src/routes/auth/auth.error'
import { GoogleAuthStateType } from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { AuthService } from 'src/routes/auth/auth.service'
import envConfig from 'src/shared/config'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'

import { v4 as uuidv4 } from 'uuid'
@Injectable()
export class GoogleService {
  private oAuth2Client: OAuth2Client
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly sharedRoleRepository: SharedRoleRepository,
    private readonly authService: AuthService,
  ) {
    this.oAuth2Client = new google.auth.OAuth2({
      client_id: envConfig.GOOGLE_CLIENT_ID,
      clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
      redirectUri: envConfig.GOOGLE_REDIRECT_URI,
    })
  }

  getAuthorizationUrl({ ip, userAgent }: GoogleAuthStateType) {
    const scope = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

    // Chuyển Object sang string base64 an toàn bỏ lên url
    const stateString = Buffer.from(JSON.stringify({ ip, userAgent }), 'utf-8').toString('base64')
    const url = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      include_granted_scopes: true,
      state: stateString,
    })
    return { url }
  }

  async googleCallback({ code, state }: { code: string; state: string }) {
    try {
      let userAgent = 'unknown'
      let ip = 'unknown'
      // 1. Lấy state từ url
      try {
        // Giải mã state từ base64 sang object
        const stateString = Buffer.from(state, 'base64').toString('utf-8')
        const stateObject = JSON.parse(stateString) as GoogleAuthStateType
        userAgent = stateObject.userAgent
        ip = stateObject.ip
      } catch (error) {
        console.error('Error parsing state:', error)
      }
      // 2. Dùng code để lấy token từ Google
      const { tokens } = await this.oAuth2Client.getToken(code)
      this.oAuth2Client.setCredentials(tokens)

      // 3. Dùng token để lấy thông tin user từ Google
      const oauth2 = google.oauth2({
        auth: this.oAuth2Client,
        version: 'v2',
      })
      const { data } = await oauth2.userinfo.get()

      if (!data.email) {
        throw GoogleUserInfoError
      }

      // 4. Kiểm tra email có tồn tại trong hệ thống hay chưa, nếu chưa thì tạo mới user
      let user = await this.authRepository.findUniqueUserIncludeRole({ email: data.email })

      if (!user) {
        // 4.1 Nếu user chưa tồn tại thì tạo mới user với role mặc định là USER
        const randomPassword = uuidv4() // Tạo mật khẩu ngẫu nhiên cho user mới
        const [hashedPassword, clientRoleId] = await Promise.all([
          this.hashingService.hash(randomPassword),
          this.sharedRoleRepository.getClientRoleId(),
        ])

        user = await this.authRepository.createUserIncludeRole({
          email: data.email,
          name: data.name ?? '',
          password: hashedPassword,
          roleId: clientRoleId,
          phoneNumber: '',
          avatar: data.picture ?? null,
        })
      }
      // 5. Tạo device cho user mới

      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent,
        ip,
        lastActive: new Date(),
        isActive: true,
      })
      // 6. Tạo access token và refresh token cho user

      const authTokens = await this.authService.generateTokens({
        deviceId: device.id,
        userId: user.id,
        roleId: user.roleId,
        roleName: user.role.name,
      })

      // 7. Trả về access token và refresh token cho client
      return authTokens
    } catch (error) {
      console.error('Error in googleCallback:', error)
      throw error
    }
  }
}

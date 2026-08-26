import { INestApplicationContext, UnauthorizedException } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { Server, ServerOptions, Socket } from 'socket.io'
import envConfig from 'src/shared/config'
import { generateRoomUserId } from 'src/shared/helpers'
import { SharedWebsocketRepository } from 'src/shared/repositories/shared-websocket.repo'
import { TokenService } from 'src/shared/services/token.service'

const namespaces = ['/', 'chat', 'payment']

export class WebsocketAdapter extends IoAdapter {
  private readonly sharedWebsocketRepository: SharedWebsocketRepository
  private readonly tokenService: TokenService

  private adapterConstructor!: ReturnType<typeof createAdapter>

  constructor(app: INestApplicationContext) {
    super(app)
    this.sharedWebsocketRepository = app.get(SharedWebsocketRepository)
    this.tokenService = app.get(TokenService)
  }

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: envConfig.REDIS_URL })
    const subClient = pubClient.duplicate()

    await Promise.all([pubClient.connect(), subClient.connect()])

    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server: Server = super.createIOServer(3003, {
      ...options,
      cors: {
        origin: '*',
        credentials: true,
      },
    })
    server.use((socket: Socket, next) => {
      this.authMiddleware(socket, next)
        .then(() => {})
        .catch((err) => {})
    })
    server.of(/.*/).use((socket: Socket, next) => {
      this.authMiddleware(socket, next)
        .then(() => {})
        .catch((err) => {})
    })

    // namespaces.forEach((namespace) => {
    //   server.of(namespace).use(authMiddleware)
    // })
    return server
  }

  async authMiddleware(socket: Socket, next: (err?: any) => void) {
    const { authorization } = socket.handshake.headers

    if (!authorization) {
      return next(new UnauthorizedException("Missing 'Authorization' header"))
    }

    const accessToken = authorization.split(' ')[1]
    if (!accessToken) {
      return next(new UnauthorizedException('Missing access token'))
    }

    try {
      const { userId } = await this.tokenService.verifyAccessToken(accessToken)
      await socket.join(generateRoomUserId(userId))

      // await this.sharedWebsocketRepository.create({
      //   userId, // Replace with actual user ID from access token
      //   socketId: socket.id,
      // })
      // socket.on('disconnect', async () => {
      //   await this.sharedWebsocketRepository.delete(socket.id).catch((err) => {})
      // })
      next()
    } catch (error) {
      next(error)
    }
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedWebsocketRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create({ userId, socketId }: { userId: number; socketId: string }) {
    return this.prismaService.websocket.create({
      data: {
        id: socketId,
        userId: userId,
      },
    })
  }
  delete(socketId: string) {
    return this.prismaService.websocket.delete({
      where: {
        id: socketId,
      },
    })
  }
  findByUserId(userId: number) {
    return this.prismaService.websocket.findMany({
      where: {
        userId: userId,
      },
    })
  }
}

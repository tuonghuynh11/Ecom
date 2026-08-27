import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class RemoveRefreshTokenCronjob {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(RemoveRefreshTokenCronjob.name)

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    this.logger.log('Running Refresh Token Cleanup Cronjob at 1 AM every day')
    const deletedTokens = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
    this.logger.log(`Deleted ${deletedTokens.count} expired refresh tokens`)
  }
}

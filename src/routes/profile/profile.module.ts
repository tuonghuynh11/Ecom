import { Module } from '@nestjs/common'
import { SharedModule } from 'src/shared/shared.module'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'

@Module({
  imports: [SharedModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}

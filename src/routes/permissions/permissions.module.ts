import { Module } from '@nestjs/common'
import { PermissionsRepository } from 'src/routes/permissions/permissions.repo'
import { PermissionsController } from './permissions.controller'
import { PermissionsService } from './permissions.service'

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsRepository],
})
export class PermissionsModule {}

import { Module } from '@nestjs/common'
import { RolesController } from 'src/routes/roles/roles.controller'
import { RolesRepository } from 'src/routes/roles/roles.repo'
import { RolesService } from 'src/routes/roles/roles.service'

@Module({
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
})
export class RolesModule {}

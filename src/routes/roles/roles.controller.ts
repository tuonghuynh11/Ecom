import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateRoleBodyDTO,
  GetRoleDetailResDTO,
  GetRoleResDTO,
  GetRolesParamsDTO,
  GetRolesQueriesDTO,
  GetRolesResDTO,
  UpdateRoleBodyDTO,
} from 'src/routes/roles/roles.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResSchema } from 'src/shared/models/response.model'
import { RolesService } from './roles.service'

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ZodSerializerDto(GetRolesResDTO)
  find(@Query() query: GetRolesQueriesDTO) {
    return this.rolesService.find(query)
  }

  @Get(':roleId')
  @ZodSerializerDto(GetRoleDetailResDTO)
  findOne(@Param() params: GetRolesParamsDTO) {
    return this.rolesService.findOne(params.roleId)
  }

  @Post()
  @ZodSerializerDto(GetRoleResDTO)
  create(@Body() body: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.create({
      payload: body,
      createdById: userId,
    })
  }

  @Put(':roleId')
  @ZodSerializerDto(GetRoleDetailResDTO)
  update(@Param() params: GetRolesParamsDTO, @Body() body: UpdateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.update({
      id: params.roleId,
      payload: body,
      updatedById: userId,
    })
  }

  @Delete(':roleId')
  @ZodSerializerDto(MessageResSchema)
  remove(@Param() params: GetRolesParamsDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.remove({
      id: params.roleId,
      deletedById: userId,
    })
  }
}

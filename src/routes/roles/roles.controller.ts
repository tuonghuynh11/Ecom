import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
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
import { MessageResDto } from 'src/shared/dtos/response.dto'
import { RolesService } from './roles.service'

@Controller('roles')
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ZodResponse({ type: GetRolesResDTO })
  find(@Query() query: GetRolesQueriesDTO) {
    return this.rolesService.find(query)
  }

  @Get(':roleId')
  @ApiParam({ name: 'roleId', type: Number })
  @ZodResponse({ type: GetRoleDetailResDTO })
  findOne(@Param() params: GetRolesParamsDTO) {
    return this.rolesService.findOne(params.roleId)
  }

  @Post()
  @ZodResponse({ type: GetRoleResDTO })
  create(@Body() body: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.create({
      payload: body,
      createdById: userId,
    })
  }

  @Put(':roleId')
  @ApiParam({ name: 'roleId', type: Number })
  @ZodResponse({ type: GetRoleDetailResDTO })
  update(@Param() params: GetRolesParamsDTO, @Body() body: UpdateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.update({
      id: params.roleId,
      payload: body,
      updatedById: userId,
    })
  }

  @Delete(':roleId')
  @ApiParam({ name: 'roleId', type: Number })
  @ZodResponse({ type: MessageResDto })
  remove(@Param() params: GetRolesParamsDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.remove({
      id: params.roleId,
      deletedById: userId,
    })
  }
}

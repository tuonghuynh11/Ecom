import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import {
  CreatePermissionBodyDTO,
  GetPermissionDetailResDTO,
  GetPermissionsParamsDTO,
  GetPermissionsQueriesDTO,
  GetPermissionsResDTO,
  UpdatePermissionBodyDTO,
} from 'src/routes/permissions/permissions.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDto } from 'src/shared/dtos/response.dto'
import { PermissionsService } from './permissions.service'

@Controller('permissions')
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ZodResponse({ type: GetPermissionsResDTO })
  find(@Query() query: GetPermissionsQueriesDTO) {
    return this.permissionsService.find(query)
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ZodResponse({ type: GetPermissionDetailResDTO })
  findOne(@Param() params: GetPermissionsParamsDTO) {
    return this.permissionsService.findOne(params.id)
  }

  @Post()
  @ZodResponse({ type: GetPermissionDetailResDTO })
  create(@Body() body: CreatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return this.permissionsService.create({
      payload: body,
      createdById: userId,
    })
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: Number })
  @ZodResponse({ type: GetPermissionDetailResDTO })
  update(
    @Param() params: GetPermissionsParamsDTO,
    @Body() body: UpdatePermissionBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.permissionsService.update({
      id: params.id,
      payload: body,
      updatedById: userId,
    })
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @ZodResponse({ type: MessageResDto })
  remove(@Param() params: GetPermissionsParamsDTO, @ActiveUser('userId') userId: number) {
    return this.permissionsService.remove({
      id: params.id,
      deletedById: userId,
    })
  }
}

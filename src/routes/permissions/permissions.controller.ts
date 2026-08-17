import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreatePermissionBodyDTO,
  GetPermissionDetailResDTO,
  GetPermissionsParamsDTO,
  GetPermissionsQueriesDTO,
  GetPermissionsResDTO,
  UpdatePermissionBodyDTO,
} from 'src/routes/permissions/permissions.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResSchema } from 'src/shared/models/response.model'
import { PermissionsService } from './permissions.service'

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ZodSerializerDto(GetPermissionsResDTO)
  find(@Query() query: GetPermissionsQueriesDTO) {
    return this.permissionsService.find(query)
  }

  @Get(':id')
  @ZodSerializerDto(GetPermissionDetailResDTO)
  findOne(@Param() params: GetPermissionsParamsDTO) {
    return this.permissionsService.findOne(params.id)
  }

  @Post()
  @ZodSerializerDto(GetPermissionDetailResDTO)
  create(@Body() body: CreatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return this.permissionsService.create({
      payload: body,
      createdById: userId,
    })
  }

  @Put(':id')
  @ZodSerializerDto(GetPermissionDetailResDTO)
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
  @ZodSerializerDto(MessageResSchema)
  remove(@Param() params: GetPermissionsParamsDTO, @ActiveUser('userId') userId: number) {
    return this.permissionsService.remove({
      id: params.id,
      deletedById: userId,
    })
  }
}

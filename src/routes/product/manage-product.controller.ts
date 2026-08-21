import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ManageProductService } from 'src/routes/product/manage-product.service'
import {
  CreateProductBodyDTO,
  GetManageProductsQueryDTO,
  GetProductParamsDTO,
  UpdateProductBodyDTO,
} from 'src/routes/product/product.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import type { AccessTokenPayload } from 'src/shared/types/jwt.type'

@Controller('manage-product/products')
export class ManageProductController {
  constructor(private readonly manageProductService: ManageProductService) {}

  @Get()
  list(@Query() query: GetManageProductsQueryDTO, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.list({
      query,
      roleNameRequest: user.roleName,
      userIdRequest: user.userId,
    })
  }

  @Get(':productId')
  findById(@Param() params: GetProductParamsDTO, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.getDetail({
      productId: params.productId,
      roleNameRequest: user.roleName,
      userIdRequest: user.userId,
    })
  }

  @Post()
  create(@Body() body: CreateProductBodyDTO, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.create({
      data: body,
      createdById: user.userId,
    })
  }

  @Put(':productId')
  update(
    @Body() body: UpdateProductBodyDTO,
    @Param() params: GetProductParamsDTO,
    @ActiveUser() user: AccessTokenPayload,
  ) {
    return this.manageProductService.update({
      data: body,
      productId: params.productId,
      updatedById: user.userId,
      roleNameRequest: user.roleName,
    })
  }

  @Delete(':productId')
  delete(@Param() params: GetProductParamsDTO, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.delete({
      productId: params.productId,
      deletedById: user.userId,
      roleNameRequest: user.roleName,
    })
  }
}

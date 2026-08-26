import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { ManageProductService } from 'src/routes/product/manage-product.service'
import {
  CreateProductBodyDTO,
  GetManageProductsQueryDTO,
  GetProductDetailResDTO,
  GetProductParamsDTO,
  GetProductsResDTO,
  ProductDTO,
  UpdateProductBodyDTO,
} from 'src/routes/product/product.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDto } from 'src/shared/dtos/response.dto'
import type { AccessTokenPayload } from 'src/shared/types/jwt.type'
import { OrderBy, SortBy } from 'src/shared/constants/other.constant'

@Controller('manage-product/products')
@ApiBearerAuth()
export class ManageProductController {
  constructor(private readonly manageProductService: ManageProductService) {}

  @Get()
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'name', type: String, required: false })
  @ApiQuery({ name: 'brandIds', type: Number, required: false, isArray: true })
  @ApiQuery({ name: 'categories', type: Number, required: false, isArray: true })
  @ApiQuery({ name: 'minPrice', type: Number, required: false })
  @ApiQuery({ name: 'maxPrice', type: Number, required: false })
  @ApiQuery({ name: 'createdById', type: Number, required: true })
  @ApiQuery({ name: 'orderBy', enum: OrderBy, required: false, example: OrderBy.Desc })
  @ApiQuery({ name: 'sortBy', enum: SortBy, required: false, example: SortBy.CreatedAt })
  @ApiQuery({ name: 'isPublic', type: Boolean, required: false })
  @ZodResponse({ type: GetProductsResDTO })
  list(@Query() query: GetManageProductsQueryDTO, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.list({
      query,
      roleNameRequest: user.roleName,
      userIdRequest: user.userId,
    })
  }

  @Get(':productId')
  @ApiParam({ name: 'productId', type: Number })
  @ZodResponse({ type: GetProductDetailResDTO })
  findById(@Param() params: GetProductParamsDTO, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.getDetail({
      productId: params.productId,
      roleNameRequest: user.roleName,
      userIdRequest: user.userId,
    })
  }

  @Post()
  @ZodResponse({ type: ProductDTO })
  create(@Body() body: CreateProductBodyDTO, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.create({
      data: body,
      createdById: user.userId,
    })
  }

  @Put(':productId')
  @ApiParam({ name: 'productId', type: Number })
  @ZodResponse({ type: ProductDTO })
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
  @ApiParam({ name: 'productId', type: Number })
  @ZodResponse({ type: MessageResDto })
  delete(@Param() params: GetProductParamsDTO, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.delete({
      productId: params.productId,
      deletedById: user.userId,
      roleNameRequest: user.roleName,
    })
  }
}

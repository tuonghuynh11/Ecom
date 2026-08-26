import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import {
  GetProductDetailResDTO,
  GetProductParamsDTO,
  GetProductsQueryDTO,
  GetProductsResDTO,
} from 'src/routes/product/product.dto'
import { ProductService } from 'src/routes/product/product.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { OrderBy, SortBy } from 'src/shared/constants/other.constant'

@Controller('products')
@IsPublic()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'name', type: String, required: false })
  @ApiQuery({ name: 'brandIds', type: Number, required: false, isArray: true })
  @ApiQuery({ name: 'categories', type: Number, required: false, isArray: true })
  @ApiQuery({ name: 'minPrice', type: Number, required: false })
  @ApiQuery({ name: 'maxPrice', type: Number, required: false })
  @ApiQuery({ name: 'createdById', type: Number, required: false })
  @ApiQuery({ name: 'orderBy', enum: OrderBy, required: false, example: OrderBy.Desc })
  @ApiQuery({ name: 'sortBy', enum: SortBy, required: false, example: SortBy.CreatedAt })
  @ZodResponse({ type: GetProductsResDTO })
  list(@Query() query: GetProductsQueryDTO) {
    return this.productService.list(query)
  }

  @Get(':productId')
  @ApiParam({ name: 'productId', type: Number })
  @ZodResponse({ type: GetProductDetailResDTO })
  findById(@Param() params: GetProductParamsDTO) {
    return this.productService.getDetail(params.productId)
  }
}

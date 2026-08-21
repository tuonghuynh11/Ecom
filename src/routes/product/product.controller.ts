import { Controller, Get, Param, Query } from '@nestjs/common'
import { GetProductParamsDTO, GetProductsQueryDTO } from 'src/routes/product/product.dto'
import { ProductService } from 'src/routes/product/product.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

@Controller('products')
@IsPublic()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  // @ZodResponse({ type: GetProductsResDTO })
  list(@Query() query: GetProductsQueryDTO) {
    return this.productService.list(query)
  }

  @Get(':productId')
  // @ZodResponse({ type: GetProductDetailResDTO })
  findById(@Param() params: GetProductParamsDTO) {
    return this.productService.getDetail(params.productId)
  }
}

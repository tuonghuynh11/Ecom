import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
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

@Controller('manage-product/products')
export class ManageProductController {
  constructor(private readonly manageProductService: ManageProductService) {}

  @Get()
  @ZodResponse({ type: GetProductsResDTO })
  list(@Query() query: GetManageProductsQueryDTO, @ActiveUser('userId') userId: number, @ActiveUser("roleName") roleName: string) {
    return this.manageProductService.list({
      query,
      roleNameRequest: roleName,
      userIdRequest: userId,
    })
  }

  @Get(':productId')
  @ZodResponse({ type: GetProductDetailResDTO })
  findById(@Param() params: GetProductParamsDTO, @ActiveUser('userId') userId: number, @ActiveUser("roleName") roleName: string) {
    return this.manageProductService.getDetail({
      productId: params.productId,
      roleNameRequest: roleName,
      userIdRequest: userId,
    })
  }

  @Post()
  @ZodResponse({ type: GetProductDetailResDTO })
  create(@Body() body: CreateProductBodyDTO, @ActiveUser('userId') userId: number) {
    return this.manageProductService.create({
      data: body,
      createdById: userId,
    })
  }

  @Put(':productId')
  @ZodResponse({ type: ProductDTO })
  update(
    @Body() body: UpdateProductBodyDTO,
    @Param() params: GetProductParamsDTO,
   @ActiveUser('userId') userId: number, @ActiveUser("roleName") roleName: string
  ) {
    return this.manageProductService.update({
      data: body,
      productId: params.productId,
      updatedById:userId,
      roleNameRequest: roleName,
    })
  }

  @Delete(':productId')
  @ZodResponse({ type: MessageResDto })
  delete(@Param() params: GetProductParamsDTO, @ActiveUser('userId') userId: number, @ActiveUser("roleName") roleName: string) {
    return this.manageProductService.delete({
      productId: params.productId,
      deletedById: userId,
      roleNameRequest: roleName,
    })
  }
}

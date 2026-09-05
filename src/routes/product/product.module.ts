import { Module } from '@nestjs/common'
import { ManageProductResolver } from 'src/routes/product/graphql/manage-product.resolver'
import { ProductResolver } from 'src/routes/product/graphql/product.resolver'
import { ManageProductController } from 'src/routes/product/manage-product.controller'
import { ManageProductService } from 'src/routes/product/manage-product.service'
import { ProductController } from 'src/routes/product/product.controller'
import { ProductRepo } from 'src/routes/product/product.repo'
import { ProductService } from 'src/routes/product/product.service'

@Module({
  providers: [ProductService, ManageProductService, ProductRepo, ManageProductResolver, ProductResolver],
  controllers: [ProductController, ManageProductController],
})
export class ProductModule {}

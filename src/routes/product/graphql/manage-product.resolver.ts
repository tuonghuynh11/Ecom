import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import {
  CreateProductInput,
  GetManageProductsQuery,
  GetProduct,
  GetProducts,
} from 'src/routes/product/graphql/product.entity'
import { ManageProductService } from 'src/routes/product/manage-product.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { GqlThrottlerGuard } from 'src/shared/guards/gql-throttler.guard'
import type { AccessTokenPayload } from 'src/shared/types/jwt.type'

@Resolver()
@UseGuards(GqlThrottlerGuard)
export class ManageProductResolver {
  constructor(private readonly manageProductService: ManageProductService) {}
  // Define your GraphQL queries and mutations here
  @Query(() => GetProducts, { name: 'manageProducts' })
  findAll(@Args() args: GetManageProductsQuery, @ActiveUser() user: AccessTokenPayload) {
    return this.manageProductService.list({
      query: args,
      userIdRequest: user.userId,
      roleNameRequest: user.roleName,
    })
  }

  @Mutation(() => GetProduct)
  createProduct(@Args('createProductInput') input: CreateProductInput, @ActiveUser('userId') userId: number) {
    return this.manageProductService.create({
      data: input,
      createdById: userId,
    })
  }
}

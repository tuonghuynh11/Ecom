import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Product } from 'src/shared/graphql-entities/shared-product.entity'
import { Timestamp } from 'src/shared/graphql-entities/shared-timestamp.entity'

@ObjectType()
export class ProductTranslation extends Timestamp {
  @Field(() => Int)
  id: number

  @Field(() => Int)
  productId: number

  @Field()
  name: string

  @Field()
  description: string

  @Field()
  languageId: string
}

@ObjectType()
export class ProductIncludeTranslation extends Product {
  @Field(() => [ProductTranslation])
  productTranslations: ProductTranslation[]
}

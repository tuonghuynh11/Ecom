import { Field, Float, Int, ObjectType } from '@nestjs/graphql'
import { Timestamp } from 'src/shared/graphql-entities/shared-timestamp.entity'

@ObjectType()
export class SKU extends Timestamp {
  @Field(() => Int)
  id: number

  @Field()
  value: string

  @Field(() => Float)
  price: number

  @Field(() => Int)
  stock: number

  @Field()
  image: string

  @Field(() => Int)
  productId: number
}

import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Timestamp } from 'src/shared/graphql-entities/shared-timestamp.entity'

@ObjectType()
export class Category extends Timestamp {
  @Field(() => Int)
  id: number

  @Field(() => Int, { nullable: true })
  parentCategoryId: number

  @Field()
  name: string

  @Field({ nullable: true })
  logo: string
}

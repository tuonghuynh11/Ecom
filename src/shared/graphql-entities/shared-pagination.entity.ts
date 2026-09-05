import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Pagination {
  @Field(() => Int)
  totalItems: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  limit: number

  @Field(() => Int)
  totalPages: number
}

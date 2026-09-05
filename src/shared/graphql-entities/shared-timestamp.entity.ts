import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Timestamp {
  @Field(() => Int)
  createdById: number

  @Field(() => Int, { nullable: true })
  updatedById?: number | null

  @Field(() => Int, { nullable: true })
  deletedById?: number | null

  @Field(() => String, { nullable: true })
  deletedAt?: string | null

  @Field()
  createdAt: string

  @Field()
  updatedAt: string
}

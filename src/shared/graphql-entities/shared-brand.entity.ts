import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Timestamp } from 'src/shared/graphql-entities/shared-timestamp.entity'

@ObjectType()
export class Brand extends Timestamp {
  @Field(() => Int)
  id: number

  @Field()
  name: string

  @Field()
  logo: string
}

import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Brand } from 'src/shared/graphql-entities/shared-brand.entity'
import { Timestamp } from 'src/shared/graphql-entities/shared-timestamp.entity'

@ObjectType()
export class BrandTranslation extends Timestamp {
  @Field(() => Int)
  id: number

  @Field(() => Int)
  brandId: number

  @Field()
  languageId: string

  @Field()
  name: string

  @Field()
  description: string
}

@ObjectType()
export class BrandIncludeTranslation extends Brand {
  @Field(() => [BrandTranslation])
  brandTranslations: BrandTranslation[]
}

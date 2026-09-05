import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Category } from 'src/shared/graphql-entities/shared-category.entity'
import { Timestamp } from 'src/shared/graphql-entities/shared-timestamp.entity'

@ObjectType()
export class CategoryTranslation extends Timestamp {
  @Field(() => Int)
  id: number

  @Field(() => Int)
  categoryId: number

  @Field()
  languageId: string

  @Field()
  name: string

  @Field()
  description: string
}

@ObjectType()
export class CategoryIncludeTranslation extends Category {
  @Field(() => [CategoryTranslation])
  categoryTranslations: CategoryTranslation[]
}

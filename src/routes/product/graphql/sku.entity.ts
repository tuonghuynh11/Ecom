import { InputType, PickType } from '@nestjs/graphql'
import { SKU } from 'src/shared/graphql-entities/shared-sku.entity'

@InputType()
export class UpsertSKUInput extends PickType(SKU, ['value', 'price', 'stock', 'image'], InputType) {}

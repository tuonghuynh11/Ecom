/* eslint-disable @typescript-eslint/no-namespace */
import { VariantsType } from 'src/shared/models/shared-product.model'

declare global {
  namespace PrismaJson {
    type Variants = VariantsType
  }
}

// This file must be a module.
export {}
